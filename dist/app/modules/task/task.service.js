"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.TaskService = void 0;
const http_status_codes_1 = require("http-status-codes");
const ApiError_1 = __importDefault(require("../../../errors/ApiError"));
const QueryBuilder_1 = __importDefault(require("../../builder/QueryBuilder"));
const category_model_1 = require("../category/category.model");
const task_interface_1 = require("./task.interface");
const task_model_1 = require("./task.model");
const unlinkFile_1 = __importDefault(require("../../../shared/unlinkFile"));
const bid_service_1 = require("../bid/bid.service");
const notificationsHelper_1 = require("../notification/notificationsHelper");
const payment_service_1 = __importDefault(require("../payment/payment.service"));
const payment_model_1 = require("../payment/payment.model");
const payment_interface_1 = require("../payment/payment.interface");
const mongoose_1 = __importDefault(require("mongoose"));
const bookmark_model_1 = require("../bookmark/bookmark.model");
const rating_1 = require("../rating");
const dispute_interface_1 = require("../dispute/dispute.interface");
const AggregationBuilder_1 = __importDefault(require("../../builder/AggregationBuilder"));
// Temporary DisputeService implementation until the full service is uncommented
const DisputeService = {
    createDispute: (clientId, disputeData) => __awaiter(void 0, void 0, void 0, function* () {
        // For now, just return a mock dispute object
        // This should be replaced with the actual implementation when DisputeService is uncommented
        return {
            _id: new mongoose_1.default.Types.ObjectId(),
            taskId: disputeData.taskId,
            type: disputeData.type,
            title: disputeData.title,
            description: disputeData.description,
            posterClaim: disputeData.posterClaim,
            status: 'open',
            createdAt: new Date(),
        };
    })
};
const createTask = (task) => __awaiter(void 0, void 0, void 0, function* () {
    // Validate category
    const category = yield category_model_1.Category.findById(task.taskCategory);
    if (!category) {
        throw new ApiError_1.default(http_status_codes_1.StatusCodes.BAD_REQUEST, 'Invalid category ID');
    }
    const result = yield task_model_1.TaskModel.create(task);
    return result;
});
const getAllTasks = (query, userId) => __awaiter(void 0, void 0, void 0, function* () {
    // Step 1: Build query (always lean for performance)
    const taskQuery = new QueryBuilder_1.default(task_model_1.TaskModel.find().lean(), query)
        .search(['title', 'description'])
        .filter()
        .locationFilter() // Add location-based filtering
        .dateFilter()
        .sort()
        .paginate()
        .fields();
    // Step 2: Prepare promises (tasks + pagination)
    const promises = [
        taskQuery.modelQuery, // already lean()
        taskQuery.getPaginationInfo(),
    ];
    // Add bookmark query only if logged in
    if (userId) {
        promises.push(bookmark_model_1.Bookmark.find({ user: userId })
            .select('post -_id') // only select needed field
            .lean() // lightweight result
        );
    }
    // Step 3: Run all queries in parallel
    const results = yield Promise.all(promises);
    const tasks = results[0];
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
    const bookmarkedIds = new Set(bookmarks.map(b => String(b.post)));
    // Step 6: Enrich tasks
    const enrichedTasks = tasks.map((task) => (Object.assign(Object.assign({}, task), { isBookmarked: bookmarkedIds.has(String(task._id)) })));
    return {
        pagination: paginationInfo,
        data: enrichedTasks,
    };
});
const getTaskById = (taskId) => __awaiter(void 0, void 0, void 0, function* () {
    const result = yield task_model_1.TaskModel.findById(taskId);
    return result;
});
const updateTask = (taskId, payload) => __awaiter(void 0, void 0, void 0, function* () {
    const task = yield task_model_1.TaskModel.findById(taskId);
    if (!task) {
        throw new ApiError_1.default(http_status_codes_1.StatusCodes.NOT_FOUND, 'Task not found');
    }
    if (payload.taskImage && Array.isArray(payload.taskImage)) {
        payload.taskImage.forEach((imgPath) => {
            (0, unlinkFile_1.default)(imgPath);
        });
    }
    const updateDoc = yield task_model_1.TaskModel.findOneAndUpdate({ _id: taskId }, payload, {
        new: true,
    });
    return updateDoc;
});
// Delete a task by ID
const deleteTask = (taskId) => __awaiter(void 0, void 0, void 0, function* () {
    const result = yield task_model_1.TaskModel.findByIdAndDelete(taskId);
    return result;
});
// Get all tasks of the current logged-in user
const getAllTasksByUser = (userId_1, ...args_1) => __awaiter(void 0, [userId_1, ...args_1], void 0, function* (userId, query = {}) {
    // 🔹 Base filter: userId
    const filters = { userId };
    // 🔹 Filter by status if provided
    if (query.status) {
        filters.status = query.status;
    }
    // 🔹 Initialize QueryBuilder with filters and query
    const taskQuery = new QueryBuilder_1.default(task_model_1.TaskModel.find(filters), query)
        .search(['title', 'description']) // search by title/description
        .filter() // generic field filtering
        .dateFilter() // recently / weekly / monthly filter
        .sort() // sorting
        .paginate() // pagination
        .fields(); // field selection
    // 🔹 Execute query with population
    let tasks = yield taskQuery.modelQuery.populate('taskCategory', 'name'); // <-- populate category name
    // 🔹 Add rating info: assigned worker → poster
    const tasksWithRating = yield Promise.all(tasks.map((task) => __awaiter(void 0, void 0, void 0, function* () {
        let ratingValue = 'not giving';
        if (task.assignedTo) {
            const rating = yield rating_1.Rating.findOne({
                taskId: task._id,
                givenBy: task.assignedTo,
                givenTo: task.userId, // poster
            });
            if (rating) {
                ratingValue = rating.rating;
            }
        }
        // 🔹 Payment status
        const payment = yield payment_model_1.PaymentModel.findOne({ taskId: task._id });
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
    })));
    // 🔹 Get pagination info
    const paginationInfo = yield taskQuery.getPaginationInfo();
    // 🔹 Return combined result
    return {
        pagination: paginationInfo,
        data: { tasks: tasksWithRating },
    };
});
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
const getTaskStats = () => __awaiter(void 0, void 0, void 0, function* () {
    const builder = new AggregationBuilder_1.default(task_model_1.TaskModel);
    // All tasks
    const allTasks = yield builder.calculateGrowth({ period: 'month' });
    // Completed tasks
    const completed = yield builder.calculateGrowth({
        filter: { status: task_interface_1.TaskStatus.COMPLETED },
        period: 'month',
    });
    // Active (open) tasks
    const active = yield builder.calculateGrowth({
        filter: { status: task_interface_1.TaskStatus.OPEN },
        period: 'month',
    });
    // Cancelled tasks
    const cancelled = yield builder.calculateGrowth({
        filter: { status: task_interface_1.TaskStatus.CANCELLED },
        period: 'month',
    });
    return {
        allTasks,
        completed,
        active,
        cancelled,
    };
});
const getLastSixMonthsCompletionStats = () => __awaiter(void 0, void 0, void 0, function* () {
    const now = new Date();
    const stats = [];
    let prevMonthCount = 0;
    for (let i = 5; i >= 0; i--) {
        const startOfMonth = new Date(now.getFullYear(), now.getMonth() - i, 1);
        const endOfMonth = new Date(now.getFullYear(), now.getMonth() - i + 1, 0);
        const completedTasks = yield task_model_1.TaskModel.countDocuments({
            status: task_interface_1.TaskStatus.COMPLETED,
            createdAt: { $gte: startOfMonth, $lte: endOfMonth },
        });
        // Calculate growth percentage compared to previous month
        let growthPercentage = 0;
        let growthType = 'no_change';
        if (prevMonthCount > 0) {
            growthPercentage =
                ((completedTasks - prevMonthCount) / prevMonthCount) * 100;
            growthType =
                growthPercentage > 0
                    ? 'increase'
                    : growthPercentage < 0
                        ? 'decrease'
                        : 'no_change';
        }
        else if (completedTasks > 0 && prevMonthCount === 0) {
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
});
const getMyTaskById = (userId, taskId) => __awaiter(void 0, void 0, void 0, function* () {
    const task = yield task_model_1.TaskModel.findOne({ _id: taskId, userId }); // ✅ fix here
    if (!task) {
        throw new ApiError_1.default(http_status_codes_1.StatusCodes.NOT_FOUND, 'Task not found');
    }
    // Get all bids for this task with populated tasker information
    const bids = yield bid_service_1.BidService.getAllBidsByTaskIdWithTasker(taskId);
    return Object.assign(Object.assign({}, task.toObject()), { bids });
});
// Complete task and release payment (called when delivery is accepted)
const completeTask = (taskId, clientId) => __awaiter(void 0, void 0, void 0, function* () {
    const task = yield task_model_1.TaskModel.findById(taskId);
    if (!task) {
        throw new ApiError_1.default(http_status_codes_1.StatusCodes.NOT_FOUND, 'Task not found');
    }
    if (task.userId.toString() !== clientId) {
        throw new ApiError_1.default(http_status_codes_1.StatusCodes.FORBIDDEN, 'Only task owner can complete the task');
    }
    if (task.status !== task_interface_1.TaskStatus.UNDER_REVIEW) {
        throw new ApiError_1.default(http_status_codes_1.StatusCodes.BAD_REQUEST, 'Task must be under review to complete');
    }
    if (!task.paymentIntentId) {
        throw new ApiError_1.default(http_status_codes_1.StatusCodes.BAD_REQUEST, 'No payment found for this task');
    }
    try {
        // Find the payment record for this task
        const payments = yield payment_model_1.PaymentModel.getPaymentsByTask(new mongoose_1.default.Types.ObjectId(taskId));
        if (!payments || payments.length === 0) {
            throw new ApiError_1.default(http_status_codes_1.StatusCodes.NOT_FOUND, 'No payment found for this task. Please ensure payment was created when the bid was accepted.');
        }
        // Find the payment that is currently held (escrow)
        const heldPayment = payments.find(payment => payment.status === payment_interface_1.PAYMENT_STATUS.HELD);
        if (!heldPayment) {
            // Check if there are pending payments that need confirmation
            const pendingPayment = payments.find(payment => payment.status === payment_interface_1.PAYMENT_STATUS.PENDING);
            if (pendingPayment) {
                // Check the actual Stripe status
                const stripe = require('../../../config/stripe').stripe;
                const paymentIntent = yield stripe.paymentIntents.retrieve(pendingPayment.stripePaymentIntentId);
                // Handle payment capture and processing
                if (paymentIntent.status === 'requires_capture' ||
                    paymentIntent.status === 'succeeded') {
                    try {
                        let capturedPayment = paymentIntent;
                        // Only capture if it requires capture
                        if (paymentIntent.status === 'requires_capture') {
                            capturedPayment = yield stripe.paymentIntents.capture(pendingPayment.stripePaymentIntentId);
                        }
                        if (capturedPayment.status === 'succeeded') {
                            // Ensure pendingPayment has a valid _id
                            if (!pendingPayment._id) {
                                throw new ApiError_1.default(http_status_codes_1.StatusCodes.BAD_REQUEST, 'Payment ID is missing');
                            }
                            // Update payment status to HELD in database
                            yield payment_model_1.PaymentModel.updatePaymentStatus(pendingPayment._id, payment_interface_1.PAYMENT_STATUS.HELD);
                            // Refresh the payments array to get the updated status
                            const updatedPayments = yield payment_model_1.PaymentModel.getPaymentsByTask(new mongoose_1.default.Types.ObjectId(taskId));
                            // Find the now-held payment
                            const heldPayment = updatedPayments.find(payment => payment.status === payment_interface_1.PAYMENT_STATUS.HELD);
                            if (heldPayment) {
                                // Continue with the release process using the captured payment
                                const paymentRelease = yield payment_service_1.default.releaseEscrowPayment({
                                    paymentId: heldPayment._id,
                                    releaseType: payment_interface_1.RELEASE_TYPE.COMPLETE,
                                    clientId: new mongoose_1.default.Types.ObjectId(clientId),
                                });
                                // Update task status to completed
                                task.status = task_interface_1.TaskStatus.COMPLETED;
                                yield task.save();
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
                                    yield (0, notificationsHelper_1.sendNotifications)(notificationData);
                                }
                                return { task, paymentRelease };
                            }
                        }
                    }
                    catch (captureError) {
                        // Handle the case where payment is already captured
                        if (captureError.message &&
                            captureError.message.includes('already been captured')) {
                            // Payment is already captured, just update the database status
                            if (!pendingPayment._id) {
                                throw new ApiError_1.default(http_status_codes_1.StatusCodes.BAD_REQUEST, 'Payment ID is missing');
                            }
                            yield payment_model_1.PaymentModel.updatePaymentStatus(pendingPayment._id, payment_interface_1.PAYMENT_STATUS.HELD);
                            // Refresh the payments array to get the updated status
                            const updatedPayments = yield payment_model_1.PaymentModel.getPaymentsByTask(new mongoose_1.default.Types.ObjectId(taskId));
                            // Find the now-held payment
                            const heldPayment = updatedPayments.find(payment => payment.status === payment_interface_1.PAYMENT_STATUS.HELD);
                            if (heldPayment) {
                                // Continue with the release process
                                const paymentRelease = yield payment_service_1.default.releaseEscrowPayment({
                                    paymentId: heldPayment._id,
                                    releaseType: payment_interface_1.RELEASE_TYPE.COMPLETE,
                                    clientId: new mongoose_1.default.Types.ObjectId(clientId),
                                });
                                // Update task status to completed
                                task.status = task_interface_1.TaskStatus.COMPLETED;
                                yield task.save();
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
                                    yield (0, notificationsHelper_1.sendNotifications)(notificationData);
                                }
                                return { task, paymentRelease };
                            }
                        }
                        else {
                            throw new ApiError_1.default(http_status_codes_1.StatusCodes.BAD_REQUEST, `Failed to process payment: ${captureError.message}`);
                        }
                    }
                }
                let errorMessage = 'Payment is not yet confirmed. ';
                let suggestions = [];
                if (paymentIntent.status === 'requires_payment_method') {
                    suggestions.push('Client needs to provide payment method');
                }
                else if (paymentIntent.status === 'requires_confirmation') {
                    suggestions.push('Use the test confirmation endpoint: POST /api/v1/payments/test/confirm-payment');
                    suggestions.push(`Body: {"client_secret": "${paymentIntent.client_secret}", "task_id": "${taskId}"}`);
                }
                else if (paymentIntent.status === 'requires_action') {
                    suggestions.push('Payment requires additional authentication');
                }
                else if (paymentIntent.status === 'processing') {
                    suggestions.push('Payment is being processed, please wait');
                }
                else {
                    suggestions.push(`Payment status in Stripe: ${paymentIntent.status}`);
                }
                errorMessage += 'Suggestions: ' + suggestions.join('; ');
                throw new ApiError_1.default(http_status_codes_1.StatusCodes.BAD_REQUEST, errorMessage);
            }
            // Check for other payment statuses
            const paymentStatuses = payments.map(p => p.status).join(', ');
            throw new ApiError_1.default(http_status_codes_1.StatusCodes.BAD_REQUEST, `No held payment found for this task. Current payment statuses: [${paymentStatuses}]. Payment may have already been released or refunded.`);
        }
        // Release payment to freelancer
        const paymentRelease = yield payment_service_1.default.releaseEscrowPayment({
            paymentId: heldPayment._id,
            releaseType: payment_interface_1.RELEASE_TYPE.COMPLETE,
            clientId: new mongoose_1.default.Types.ObjectId(clientId),
        });
        // Update task status to completed
        task.status = task_interface_1.TaskStatus.COMPLETED;
        yield task.save();
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
            yield (0, notificationsHelper_1.sendNotifications)(notificationData);
        }
        return { task, paymentRelease };
    }
    catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
        throw new ApiError_1.default(http_status_codes_1.StatusCodes.INTERNAL_SERVER_ERROR, `Failed to complete task and release payment: ${errorMessage}`);
    }
});
// Cancel task before delivery
const cancelTask = (taskId, clientId, reason) => __awaiter(void 0, void 0, void 0, function* () {
    const task = yield task_model_1.TaskModel.findById(taskId);
    if (!task) {
        throw new ApiError_1.default(http_status_codes_1.StatusCodes.NOT_FOUND, 'Task not found');
    }
    // Only poster can cancel
    if (task.userId.toString() !== clientId.toString()) {
        throw new ApiError_1.default(http_status_codes_1.StatusCodes.FORBIDDEN, 'Only the task owner can cancel the task');
    }
    try {
        // Prevent cancel if already finalized
        if ([
            task_interface_1.TaskStatus.COMPLETED,
            task_interface_1.TaskStatus.CANCELLED,
            task_interface_1.TaskStatus.DISPUTED,
        ].includes(task.status)) {
            throw new ApiError_1.default(http_status_codes_1.StatusCodes.BAD_REQUEST, 'Task cannot be cancelled in current status');
        }
        // ✅ If delivery already submitted (UNDER_REVIEW) → escalate to dispute
        if (task.status === task_interface_1.TaskStatus.UNDER_REVIEW) {
            const dispute = yield DisputeService.createDispute(clientId, {
                taskId,
                type: dispute_interface_1.DisputeType.TASK_CANCELLATION,
                title: `Task Cancellation Request: ${task.title}`,
                description: `Poster requested to cancel task after delivery submission.`,
                posterClaim: reason || 'Task cancellation requested by poster',
            });
            task.status = task_interface_1.TaskStatus.DISPUTED;
            yield task.save();
            return {
                task,
                dispute,
                message: 'Dispute created for task cancellation after delivery submission',
            };
        }
        // Direct cancellation - refund payment if exists
        const payment = yield payment_model_1.PaymentModel.findOne({
            taskId: new mongoose_1.default.Types.ObjectId(taskId),
            status: { $in: [payment_interface_1.PAYMENT_STATUS.PENDING, payment_interface_1.PAYMENT_STATUS.HELD] }
        });
        if (payment) {
            yield payment_service_1.default.refundEscrowPayment(payment._id.toString(), reason);
        }
        // Update task status
        task.status = task_interface_1.TaskStatus.CANCELLED;
        yield task.save();
        // Send notification to freelancer if assigned
        if (task.assignedTo) {
            const notificationData = {
                text: `Task "${task.title}" has been cancelled by the poster. ${reason ? `Reason: ${reason}` : ''}`,
                title: 'Task Cancelled',
                receiver: task.assignedTo,
                type: 'TASK_CANCELLED',
                referenceId: task._id,
                read: false,
            };
            yield (0, notificationsHelper_1.sendNotifications)(notificationData);
        }
        return { task, message: 'Task cancelled and payment refunded' };
    }
    catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
        throw new ApiError_1.default(http_status_codes_1.StatusCodes.INTERNAL_SERVER_ERROR, `Failed to cancel task: ${errorMessage}`);
    }
});
const submitDelivery = (taskId, taskerId) => __awaiter(void 0, void 0, void 0, function* () {
    const task = yield task_model_1.TaskModel.findById(taskId);
    if (!task) {
        throw new ApiError_1.default(http_status_codes_1.StatusCodes.NOT_FOUND, 'Task not found');
    }
    // // Ensure in progress
    // if (task.status !== TaskStatus.IN_PROGRESS) {
    //   throw new ApiError(
    //     StatusCodes.BAD_REQUEST,
    //     'Task is not in progress, cannot submit delivery'
    //   );
    // }
    // ✅ Change status
    task.status = task_interface_1.TaskStatus.UNDER_REVIEW;
    yield task.save();
    // Notify poster
    const notificationData = {
        text: `Delivery submitted for "${task.title}". Please review.`,
        title: 'Delivery Submitted',
        receiver: task.userId,
        type: 'DELIVERY_SUBMITTED',
        referenceId: task._id,
        read: false,
    };
    yield (0, notificationsHelper_1.sendNotifications)(notificationData);
    return task;
});
const getSimilarTasks = (taskId) => __awaiter(void 0, void 0, void 0, function* () {
    // Find the reference task first
    const task = yield task_model_1.TaskModel.findById(taskId);
    if (!task) {
        throw new ApiError_1.default(http_status_codes_1.StatusCodes.NOT_FOUND, 'Task not found');
    }
    // Find other tasks in the same category, excluding this task
    const similarTasks = yield task_model_1.TaskModel.find({
        _id: { $ne: taskId }, // exclude current task
        taskCategory: task.taskCategory,
        status: task_interface_1.TaskStatus.OPEN, // only show open tasks
    })
        .limit(10) // limit number of similar tasks
        .sort({ createdAt: -1 }); // newest first
    return similarTasks;
});
exports.TaskService = {
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
