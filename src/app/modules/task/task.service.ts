import { StatusCodes } from 'http-status-codes';
import ApiError from '../../../errors/ApiError';
import QueryBuilder from '../../builder/QueryBuilder';
import { Category } from '../category/category.model';
import { TaskUpdate, TaskStatus } from './task.interface';
import { Task } from './task.interface';
import { TaskModel } from './task.model';
import unlinkFile from '../../../shared/unlinkFile';
import { BidService } from '../bid/bid.service';
import { sendNotifications } from '../notification/notificationsHelper';
import PaymentService from '../payment/payment.service';
import { PaymentModel } from '../payment/payment.model';
import { PAYMENT_STATUS, RELEASE_TYPE } from '../payment/payment.interface';
import mongoose from 'mongoose';
import { Bookmark } from '../bookmark/bookmark.model';
import { Rating } from '../rating';
import { DisputeType } from '../dispute/dispute.interface';
import AggregationBuilder from '../../builder/AggregationBuilder';

// Temporary DisputeService implementation until the full service is uncommented
const DisputeService = {
  createDispute: async (clientId: string, disputeData: any) => {
    // For now, just return a mock dispute object
    // This should be replaced with the actual implementation when DisputeService is uncommented
    return {
      _id: new mongoose.Types.ObjectId(),
      taskId: disputeData.taskId,
      type: disputeData.type,
      title: disputeData.title,
      description: disputeData.description,
      posterClaim: disputeData.posterClaim,
      status: 'open',
      createdAt: new Date(),
    };
  }
};

const createTask = async (task: Task) => {
  // Validate category
  const category = await Category.findById(task.taskCategory);
  if (!category) {
    throw new ApiError(StatusCodes.BAD_REQUEST, 'Invalid category ID');
  }

  const result = await TaskModel.create(task);
  return result;
};

const getAllTasks = async (query: Record<string, unknown>, userId?: string) => {
  // Step 1: Build query (always lean for performance)
  const taskQuery = new QueryBuilder(TaskModel.find().lean(), query)
    .search(['title', 'description'])
    .filter()
    .locationFilter() // Add location-based filtering
    .dateFilter()
    .sort()
    .paginate()
    .fields();

  // Step 2: Prepare promises (tasks + pagination)
  const promises: Promise<any>[] = [
    taskQuery.modelQuery, // already lean()
    taskQuery.getPaginationInfo(),
  ];

  // Add bookmark query only if logged in
  if (userId) {
    promises.push(
      Bookmark.find({ user: userId })
        .select('post -_id') // only select needed field
        .lean() // lightweight result
    );
  }

  // Step 3: Run all queries in parallel
  const results = await Promise.all(promises);

  const tasks: Task[] = results[0];
  const paginationInfo = results[1];
  const bookmarks = userId ? results[2] : [];

  // Step 4: Early return if no tasks
  if (!tasks.length) {
    return {
      pagination: paginationInfo,
      data: [],
    };
  }

  // Step 5: Convert bookmarks into Set for O(1) lookup
  const bookmarkedIds = new Set((bookmarks as any[]).map(b => String(b.post)));

  // Step 6: Enrich tasks
  const enrichedTasks = tasks.map((task: Task) => ({
    ...task,
    isBookmarked: bookmarkedIds.has(String(task._id)),
  }));

  return {
    pagination: paginationInfo,
    data: enrichedTasks,
  };
};

const getTaskById = async (taskId: string) => {
  const result = await TaskModel.findById(taskId);
  return result;
};

const updateTask = async (taskId: string, payload: TaskUpdate) => {
  const task = await TaskModel.findById(taskId);
  if (!task) {
    throw new ApiError(StatusCodes.NOT_FOUND, 'Task not found');
  }

  if (payload.taskImage && Array.isArray(payload.taskImage)) {
    payload.taskImage.forEach((imgPath: string) => {
      unlinkFile(imgPath);
    });
  }

  const updateDoc = await TaskModel.findOneAndUpdate({ _id: taskId }, payload, {
    new: true,
  });

  return updateDoc;
};

// Delete a task by ID
const deleteTask = async (taskId: string) => {
  const result = await TaskModel.findByIdAndDelete(taskId);
  return result;
};

// Get all tasks of the current logged-in user
const getAllTasksByUser = async (
  userId: string,
  query: Record<string, unknown> = {}
) => {
  // 🔹 Base filter: userId
  const filters: Record<string, unknown> = { userId };

  // 🔹 Filter by status if provided
  if (query.status) {
    filters.status = query.status;
  }

  // 🔹 Initialize QueryBuilder with filters and query
  const taskQuery = new QueryBuilder(TaskModel.find(filters), query)
    .search(['title', 'description']) // search by title/description
    .filter() // generic field filtering
    .dateFilter() // recently / weekly / monthly filter
    .sort() // sorting
    .paginate() // pagination
    .fields(); // field selection

  // 🔹 Execute query with population
  let tasks = await taskQuery.modelQuery.populate('taskCategory', 'name'); // <-- populate category name

  // 🔹 Add rating info: assigned worker → poster
  const tasksWithRating = await Promise.all(
    tasks.map(async (task: any) => {
      let ratingValue: string | number = 'not giving';

      if (task.assignedTo) {
        const rating = await Rating.findOne({
          taskId: task._id,
          givenBy: task.assignedTo,
          givenTo: task.userId, // poster
        });

        if (rating) {
          ratingValue = rating.rating;
        }
      }

      // 🔹 Payment status
      const payment = await PaymentModel.findOne({ taskId: task._id });
      const paymentStatus = payment ? payment.status : 'not created';

      return {
        _id: task._id,
        title: task.title,
        taskCategory: task.taskCategory.name,
        taskLocation: task.taskLocation,
        taskBudget: task.taskBudget,
        status: task.status,
        createdAt: task.createdAt,
        ratingFromTasker: ratingValue,
        paymentStatus,
      };
    })
  );

  // 🔹 Get pagination info
  const paginationInfo = await taskQuery.getPaginationInfo();

  // 🔹 Return combined result
  return {
    pagination: paginationInfo,
    data: { tasks: tasksWithRating },
  };
};

// Get task statistics
// const getTaskStats = async () => {
//   // Total counts by status
//   const totalTasks = await TaskModel.countDocuments();
//   const completedTasks = await TaskModel.countDocuments({
//     status: TaskStatus.COMPLETED,
//   });
//   const activeTasks = await TaskModel.countDocuments({
//     status: TaskStatus.OPEN,
//   });
//   const cancelledTasks = await TaskModel.countDocuments({
//     status: TaskStatus.CANCELLED,
//   });

//   // Function to calculate monthly growth for a given filter
//   const calculateMonthlyGrowth = async (
//     filter: Record<string, unknown> = {}
//   ) => {
//     const now = new Date();
//     const startOfThisMonth = new Date(now.getFullYear(), now.getMonth(), 1);
//     const startOfLastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
//     const endOfLastMonth = new Date(now.getFullYear(), now.getMonth(), 0);

//     const thisMonthCount = await TaskModel.countDocuments({
//       ...filter,
//       createdAt: { $gte: startOfThisMonth },
//     });

//     const lastMonthCount = await TaskModel.countDocuments({
//       ...filter,
//       createdAt: { $gte: startOfLastMonth, $lte: endOfLastMonth },
//     });

//     let monthlyGrowth = 0;
//     let growthType: 'increase' | 'decrease' | 'no_change' = 'no_change';

//     if (lastMonthCount > 0) {
//       monthlyGrowth =
//         ((thisMonthCount - lastMonthCount) / lastMonthCount) * 100;
//       growthType =
//         monthlyGrowth > 0
//           ? 'increase'
//           : monthlyGrowth < 0
//           ? 'decrease'
//           : 'no_change';
//     } else if (thisMonthCount > 0 && lastMonthCount === 0) {
//       monthlyGrowth = 100;
//       growthType = 'increase';
//     }

//     // Format for display
//     const formattedGrowth =
//       (monthlyGrowth > 0 ? '+' : '') + monthlyGrowth.toFixed(2) + '%';
//     return {
//       thisMonthCount,
//       lastMonthCount,
//       monthlyGrowth: Math.abs(monthlyGrowth), // absolute number for stats
//       formattedGrowth, // formatted string with + / - for UI
//       growthType,
//     };
//   };

//   // Calculate stats for all tasks and by status
//   const allTaskStats = await calculateMonthlyGrowth();
//   const completedStats = await calculateMonthlyGrowth({
//     status: TaskStatus.COMPLETED,
//   });
//   const activeStats = await calculateMonthlyGrowth({
//     status: TaskStatus.OPEN,
//   });
//   const cancelledStats = await calculateMonthlyGrowth({
//     status: TaskStatus.CANCELLED,
//   });

//   return {
//     allTasks: { total: totalTasks, ...allTaskStats },
//     completed: { total: completedTasks, ...completedStats },
//     active: { total: activeTasks, ...activeStats },
//     cancelled: { total: cancelledTasks, ...cancelledStats },
//   };
// };
const getTaskStats = async () => {
  const builder = new AggregationBuilder(TaskModel);

  // All tasks
  const allTasks = await builder.calculateGrowth({ period: 'month' });

  // Completed tasks
  const completed = await builder.calculateGrowth({
    filter: { status: TaskStatus.COMPLETED },
    period: 'month',
  });

  // Active (open) tasks
  const active = await builder.calculateGrowth({
    filter: { status: TaskStatus.OPEN },
    period: 'month',
  });

  // Cancelled tasks
  const cancelled = await builder.calculateGrowth({
    filter: { status: TaskStatus.CANCELLED },
    period: 'month',
  });

  return {
    allTasks,
    completed,
    active,
    cancelled,
  };
};

const getLastSixMonthsCompletionStats = async () => {
  const now = new Date();
  const stats: {
    month: string;
    completedTasks: number;
    growthPercentage: number;
    growthType: 'increase' | 'decrease' | 'no_change';
  }[] = [];

  let prevMonthCount = 0;

  for (let i = 5; i >= 0; i--) {
    const startOfMonth = new Date(now.getFullYear(), now.getMonth() - i, 1);
    const endOfMonth = new Date(now.getFullYear(), now.getMonth() - i + 1, 0);

    const completedTasks = await TaskModel.countDocuments({
      status: TaskStatus.COMPLETED,
      createdAt: { $gte: startOfMonth, $lte: endOfMonth },
    });

    // Calculate growth percentage compared to previous month
    let growthPercentage = 0;
    let growthType: 'increase' | 'decrease' | 'no_change' = 'no_change';

    if (prevMonthCount > 0) {
      growthPercentage =
        ((completedTasks - prevMonthCount) / prevMonthCount) * 100;
      growthType =
        growthPercentage > 0
          ? 'increase'
          : growthPercentage < 0
          ? 'decrease'
          : 'no_change';
    } else if (completedTasks > 0 && prevMonthCount === 0) {
      growthPercentage = 100;
      growthType = 'increase';
    }

    const monthName = startOfMonth.toLocaleString('default', {
      month: 'short',
    }); // Jan, Feb, etc.

    stats.push({
      month: monthName,
      completedTasks,
      growthPercentage: parseFloat(growthPercentage.toFixed(2)),
      growthType,
    });

    prevMonthCount = completedTasks; // store for next iteration
  }

  return stats;
};

const getMyTaskById = async (userId: string, taskId: string) => {
  const task = await TaskModel.findOne({ _id: taskId, userId }); // ✅ fix here
  if (!task) {
    throw new ApiError(StatusCodes.NOT_FOUND, 'Task not found');
  }

  // Get all bids for this task with populated tasker information
  const bids = await BidService.getAllBidsByTaskIdWithTasker(taskId);

  return {
    ...task.toObject(),
    bids,
  };
};

// Complete task and release payment (called when delivery is accepted)
const completeTask = async (taskId: string, clientId: string) => {
  const task = await TaskModel.findById(taskId);
  if (!task) {
    throw new ApiError(StatusCodes.NOT_FOUND, 'Task not found');
  }

  if (task.userId.toString() !== clientId) {
    throw new ApiError(
      StatusCodes.FORBIDDEN,
      'Only task owner can complete the task'
    );
  }

  if (task.status !== TaskStatus.UNDER_REVIEW) {
    throw new ApiError(
      StatusCodes.BAD_REQUEST,
      'Task must be under review to complete'
    );
  }

  if (!task.paymentIntentId) {
    throw new ApiError(
      StatusCodes.BAD_REQUEST,
      'No payment found for this task'
    );
  }

  try {
    // Find the payment record for this task
    const payments = await PaymentModel.getPaymentsByTask(
      new mongoose.Types.ObjectId(taskId)
    );

    if (!payments || payments.length === 0) {
      throw new ApiError(
        StatusCodes.NOT_FOUND,
        'No payment found for this task. Please ensure payment was created when the bid was accepted.'
      );
    }

    // Find the payment that is currently held (escrow)
    const heldPayment = payments.find(
      payment => payment.status === PAYMENT_STATUS.HELD
    );

    if (!heldPayment) {
      // Check if there are pending payments that need confirmation
      const pendingPayment = payments.find(
        payment => payment.status === PAYMENT_STATUS.PENDING
      );

      if (pendingPayment) {
        // Check the actual Stripe status
        const stripe = require('../../../config/stripe').stripe;
        const paymentIntent = await stripe.paymentIntents.retrieve(
          pendingPayment.stripePaymentIntentId
        );

        // Handle payment capture and processing
        if (
          paymentIntent.status === 'requires_capture' ||
          paymentIntent.status === 'succeeded'
        ) {
          try {
            let capturedPayment = paymentIntent;

            // Only capture if it requires capture
            if (paymentIntent.status === 'requires_capture') {
              capturedPayment = await stripe.paymentIntents.capture(
                pendingPayment.stripePaymentIntentId
              );
            }

            if (capturedPayment.status === 'succeeded') {
              // Ensure pendingPayment has a valid _id
              if (!pendingPayment._id) {
                throw new ApiError(
                  StatusCodes.BAD_REQUEST,
                  'Payment ID is missing'
                );
              }

              // Update payment status to HELD in database
              await PaymentModel.updatePaymentStatus(
                pendingPayment._id,
                PAYMENT_STATUS.HELD
              );

              // Refresh the payments array to get the updated status
              const updatedPayments = await PaymentModel.getPaymentsByTask(
                new mongoose.Types.ObjectId(taskId)
              );

              // Find the now-held payment
              const heldPayment = updatedPayments.find(
                payment => payment.status === PAYMENT_STATUS.HELD
              );

              if (heldPayment) {
                // Continue with the release process using the captured payment
                const paymentRelease =
                  await PaymentService.releaseEscrowPayment({
                    paymentId: heldPayment._id!,
                    releaseType: RELEASE_TYPE.COMPLETE,
                    clientId: new mongoose.Types.ObjectId(clientId),
                  });

                // Update task status to completed
                task.status = TaskStatus.COMPLETED;
                await task.save();

                // Send notification to freelancer about payment release
                if (task.assignedTo) {
                  const notificationData = {
                    text: `Great news! Payment for "${task.title}" has been released. The task is now completed.`,
                    title: 'Payment Released',
                    receiver: task.assignedTo,
                    type: 'TASK',
                    referenceId: task._id,
                    read: false,
                  };
                  await sendNotifications(notificationData);
                }

                return { task, paymentRelease };
              }
            }
          } catch (captureError: any) {
            // Handle the case where payment is already captured
            if (
              captureError.message &&
              captureError.message.includes('already been captured')
            ) {
              // Payment is already captured, just update the database status
              if (!pendingPayment._id) {
                throw new ApiError(
                  StatusCodes.BAD_REQUEST,
                  'Payment ID is missing'
                );
              }

              await PaymentModel.updatePaymentStatus(
                pendingPayment._id,
                PAYMENT_STATUS.HELD
              );

              // Refresh the payments array to get the updated status
              const updatedPayments = await PaymentModel.getPaymentsByTask(
                new mongoose.Types.ObjectId(taskId)
              );

              // Find the now-held payment
              const heldPayment = updatedPayments.find(
                payment => payment.status === PAYMENT_STATUS.HELD
              );

              if (heldPayment) {
                // Continue with the release process
                const paymentRelease =
                  await PaymentService.releaseEscrowPayment({
                    paymentId: heldPayment._id!,
                    releaseType: RELEASE_TYPE.COMPLETE,
                    clientId: new mongoose.Types.ObjectId(clientId),
                  });

                // Update task status to completed
                task.status = TaskStatus.COMPLETED;
                await task.save();

                // Send notification to freelancer about payment release
                if (task.assignedTo) {
                  const notificationData = {
                    text: `Great news! Payment for "${task.title}" has been released. The task is now completed.`,
                    title: 'Payment Released',
                    receiver: task.assignedTo,
                    type: 'TASK',
                    referenceId: task._id,
                    read: false,
                  };
                  await sendNotifications(notificationData);
                }

                return { task, paymentRelease };
              }
            } else {
              throw new ApiError(
                StatusCodes.BAD_REQUEST,
                `Failed to process payment: ${captureError.message}`
              );
            }
          }
        }

        let errorMessage = 'Payment is not yet confirmed. ';
        let suggestions = [];

        if (paymentIntent.status === 'requires_payment_method') {
          suggestions.push('Client needs to provide payment method');
        } else if (paymentIntent.status === 'requires_confirmation') {
          suggestions.push(
            'Use the test confirmation endpoint: POST /api/v1/payments/test/confirm-payment'
          );
          suggestions.push(
            `Body: {"client_secret": "${paymentIntent.client_secret}", "task_id": "${taskId}"}`
          );
        } else if (paymentIntent.status === 'requires_action') {
          suggestions.push('Payment requires additional authentication');
        } else if (paymentIntent.status === 'processing') {
          suggestions.push('Payment is being processed, please wait');
        } else {
          suggestions.push(`Payment status in Stripe: ${paymentIntent.status}`);
        }

        errorMessage += 'Suggestions: ' + suggestions.join('; ');

        throw new ApiError(StatusCodes.BAD_REQUEST, errorMessage);
      }

      // Check for other payment statuses
      const paymentStatuses = payments.map(p => p.status).join(', ');
      throw new ApiError(
        StatusCodes.BAD_REQUEST,
        `No held payment found for this task. Current payment statuses: [${paymentStatuses}]. Payment may have already been released or refunded.`
      );
    }

    // Release payment to freelancer
    const paymentRelease = await PaymentService.releaseEscrowPayment({
      paymentId: heldPayment._id!,
      releaseType: RELEASE_TYPE.COMPLETE,
      clientId: new mongoose.Types.ObjectId(clientId),
    });

    // Update task status to completed
    task.status = TaskStatus.COMPLETED;
    await task.save();

    // Send notification to freelancer about payment release
    if (task.assignedTo) {
      const notificationData = {
        text: `Great news! Payment for "${task.title}" has been released. The task is now completed.`,
        title: 'Payment Released',
        receiver: task.assignedTo,
        type: 'TASK',
        referenceId: task._id,
        read: false,
      };
      await sendNotifications(notificationData);
    }

    return { task, paymentRelease };
  } catch (error) {
    const errorMessage =
      error instanceof Error ? error.message : 'Unknown error occurred';
    throw new ApiError(
      StatusCodes.INTERNAL_SERVER_ERROR,
      `Failed to complete task and release payment: ${errorMessage}`
    );
  }
};

// Cancel task before delivery
const cancelTask = async (
  taskId: string,
  clientId: string,
  reason?: string
) => {
  const task = await TaskModel.findById(taskId);
  if (!task) {
    throw new ApiError(StatusCodes.NOT_FOUND, 'Task not found');
  }

  // Only poster can cancel
  if (task.userId.toString() !== clientId.toString()) {
    throw new ApiError(
      StatusCodes.FORBIDDEN,
      'Only the task owner can cancel the task'
    );
  }

  try {
    // Prevent cancel if already finalized
    if (
      [
        TaskStatus.COMPLETED,
        TaskStatus.CANCELLED,
        TaskStatus.DISPUTED,
      ].includes(task.status as any)
    ) {
      throw new ApiError(
        StatusCodes.BAD_REQUEST,
        'Task cannot be cancelled in current status'
      );
    }

    // ✅ If delivery already submitted (UNDER_REVIEW) → escalate to dispute
    if (task.status === TaskStatus.UNDER_REVIEW) {
      const dispute = await DisputeService.createDispute(clientId, {
        taskId,
        type: DisputeType.TASK_CANCELLATION,
        title: `Task Cancellation Request: ${task.title}`,
        description: `Poster requested to cancel task after delivery submission.`,
        posterClaim: reason || 'Task cancellation requested by poster',
      });

      task.status = TaskStatus.DISPUTED;
      await task.save();

      return {
        task,
        dispute,
        message:
          'Dispute created for task cancellation after delivery submission',
      };
    }

    // Direct cancellation - refund payment if exists
    const payment = await PaymentModel.findOne({ 
      taskId: new mongoose.Types.ObjectId(taskId),
      status: { $in: [PAYMENT_STATUS.PENDING, PAYMENT_STATUS.HELD] }
    });

    if (payment) {
      await PaymentService.refundEscrowPayment(payment._id.toString(), reason);
    }

    // Update task status
    task.status = TaskStatus.CANCELLED;
    await task.save();

    // Send notification to freelancer if assigned
    if (task.assignedTo) {
      const notificationData = {
        text: `Task "${task.title}" has been cancelled by the poster. ${
          reason ? `Reason: ${reason}` : ''
        }`,
        title: 'Task Cancelled',
        receiver: task.assignedTo,
        type: 'TASK_CANCELLED',
        referenceId: task._id,
        read: false,
      };
      await sendNotifications(notificationData);
    }

    return { task, message: 'Task cancelled and payment refunded' };
  } catch (error) {
    const errorMessage =
      error instanceof Error ? error.message : 'Unknown error occurred';
    throw new ApiError(
      StatusCodes.INTERNAL_SERVER_ERROR,
      `Failed to cancel task: ${errorMessage}`
    );
  }
};

const submitDelivery = async (taskId: string, taskerId: string) => {
  const task = await TaskModel.findById(taskId);
  if (!task) {
    throw new ApiError(StatusCodes.NOT_FOUND, 'Task not found');
  }

  // // Ensure in progress
  // if (task.status !== TaskStatus.IN_PROGRESS) {
  //   throw new ApiError(
  //     StatusCodes.BAD_REQUEST,
  //     'Task is not in progress, cannot submit delivery'
  //   );
  // }

  // ✅ Change status
  task.status = TaskStatus.UNDER_REVIEW;
  await task.save();

  // Notify poster
  const notificationData = {
    text: `Delivery submitted for "${task.title}". Please review.`,
    title: 'Delivery Submitted',
    receiver: task.userId,
    type: 'DELIVERY_SUBMITTED',
    referenceId: task._id,
    read: false,
  };
  await sendNotifications(notificationData);

  return task;
};

const getSimilarTasks = async (taskId: string) => {
  // Find the reference task first
  const task = await TaskModel.findById(taskId);
  if (!task) {
    throw new ApiError(StatusCodes.NOT_FOUND, 'Task not found');
  }

  // Find other tasks in the same category, excluding this task
  const similarTasks = await TaskModel.find({
    _id: { $ne: taskId }, // exclude current task
    taskCategory: task.taskCategory,
    status: TaskStatus.OPEN, // only show open tasks
  })
    .limit(10) // limit number of similar tasks
    .sort({ createdAt: -1 }); // newest first

  return similarTasks;
};

export const TaskService = {
  createTask,
  getAllTasks,
  getTaskById,
  updateTask,
  deleteTask,
  getAllTasksByUser,
  getTaskStats,
  getLastSixMonthsCompletionStats,
  getMyTaskById,
  completeTask,
  cancelTask,
  submitDelivery,
  getSimilarTasks,
};
