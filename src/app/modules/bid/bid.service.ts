import { Bid, BidUpdate, BidStatus } from './bid.interface';
import { BidModel } from './bid.model';
import { TaskModel } from '../task/task.model';
import { TaskStatus } from '../task/task.interface';
import { sendNotifications } from '../notification/notificationsHelper';
import PaymentService from '../payment/payment.service';
import mongoose from 'mongoose';
import QueryBuilder from '../../builder/QueryBuilder';
import ApiError from '../../../errors/ApiError';
import { StatusCodes } from 'http-status-codes';
import { Rating } from '../rating';
import { findByIdOrThrow } from '../../../helpers/serviceHelpers';

const createBid = async (bid: Bid, taskerId: string) => {
  // 1st: Find the task
  const task = await findByIdOrThrow(TaskModel, bid.taskId, 'Task');

  // 2️nd: Check if the task status allows bidding
  if (task.status === TaskStatus.COMPLETED) {
    throw new ApiError(
      StatusCodes.BAD_REQUEST,
      'Cannot place bid: Task is already completed'
    );
  }
  if (task.status === TaskStatus.CANCELLED) {
    throw new ApiError(
      StatusCodes.BAD_REQUEST,
      'Cannot place bid: Task is already cancelled'
    );
  }
  if (task.status === TaskStatus.IN_PROGRESS) {
    throw new ApiError(
      StatusCodes.BAD_REQUEST,
      'Cannot place bid: Task is already accepted'
    );
  }

  // 3️rd: Check if the tasker has already placed a bid on this task
  const isBidExistByTasker = await BidModel.findOne({
    taskId: bid.taskId,
    taskerId,
  });
  if (isBidExistByTasker)
    throw new ApiError(
      StatusCodes.BAD_REQUEST,
      'You have already placed a bid for this task'
    );

  // 4️th: Create a new bid
  const newBid = await BidModel.create({
    ...bid,
    taskerId,
    status: BidStatus.PENDING,
  });

  // 5️th: Prepare notification data for the task owner
  const notificationData = {
    text: `Hi! A new bid has been placed on your task "${task.title}" by a tasker.`,
    title: 'New Bid',
    receiver: task.userId, // task owner
    type: 'BID', // type of notification
    referenceId: newBid._id, // link to bid
    read: false,
  };

  // 6️th: Send notification to the task owner
  await sendNotifications(notificationData);

  return newBid;
};

// Service: Get all tasks a tasker has bid on (with rating from poster)
const getAllTasksByTaskerBids = async (
  taskerId: string,
  query: Record<string, unknown> = {}
) => {
  // 1st: Query bids for this tasker
  const bidQuery = new QueryBuilder(BidModel.find({ taskerId }), query)
    .search(['message'])
    .filter()
    .dateFilter()
    .sort()
    .paginate()
    .fields()
    .populate(['taskId'], {
      taskId: 'title description status userId assignedTo taskCategory',
    });

  // 2nd: Execute query and filter out bids with deleted tasks
  const { data: bids, pagination } = await bidQuery.getFilteredResults([
    'taskId',
  ]);

  // 3rd: Add rating info for each task (from poster → tasker)
  const bidsWithRating = await Promise.all(
    bids.map(async (bid: any) => {
      const task = bid.taskId; // populated task
      let ratingValue: string | number = 'not given';

      // Check if task exists and is not null (task might be deleted)
      if (task && task.assignedTo?.toString() === taskerId) {
        const rating = await Rating.findOne({
          taskId: task?._id,
          givenBy: task?.userId, // poster
          givenTo: task?.assignedTo, // tasker
        });

        if (rating) {
          ratingValue = rating.rating;
        }
      }

      return {
        ...bid.toObject(),
        ratingFromPoster: ratingValue,
        // Add task status to help identify deleted tasks
        taskExists: task !== null,
      };
    })
  );

  // 4th: Return final result
  return {
    data: bidsWithRating,
    pagination,
  };
};

const updateBid = async (
  bidId: string,
  taskerId: string,
  bidUpdate: BidUpdate
) => {
  // 1st: Find the bid by ID
  const bid = await BidModel.findById(bidId);
  if (!bid) throw new Error('Bid not found');
  // const bid = await findByIdOrThrow(BidModel, bidId, 'Bid');

  // 2nd: Ensure only the tasker who created the bid can update it
  if (!bid.taskerId || bid.taskerId.toString() !== taskerId)
    throw new Error('Not authorized');

  // 3rd: Only pending bids can be updated
  if (bid.status !== BidStatus.PENDING)
    throw new Error('Cannot update a bid that is not pending');

  // 4th: Reject empty payloads
  if (!bidUpdate.amount && !bidUpdate.message) {
    throw new Error('No fields provided to update');
  }

  // 5th: Extra safety: Validate updated amount
  if (bidUpdate.amount !== undefined && bidUpdate.amount <= 0)
    throw new Error('Amount must be greater than 0');

  // 6th: Apply the updates
  Object.assign(bid, bidUpdate);

  // 7th: Save the bid and return
  await bid.save();
  return bid;
};

const deleteBid = async (bidId: string, taskerId: string) => {
  // 1st: Check if bidId is valid
  if (!mongoose.Types.ObjectId.isValid(bidId)) {
    throw new Error('Invalid bid ID format');
  }

  // 2nd: Find the bid by ID
  const bid = await findByIdOrThrow(BidModel, bidId, 'Bid');

  // 3rd: Check if taskerId is provided
  if (!taskerId) throw new Error('Tasker ID missing');

  // 4th: Ensure only the bid owner can delete
  if (!bid.taskerId || bid.taskerId.toString() !== taskerId) {
    throw new Error('Not authorized');
  }

  // 5th: Only pending bids can be deleted
  if (bid.status !== BidStatus.PENDING) {
    throw new Error('Cannot delete a bid that is not pending');
  }

  // 6th: Fetch the associated task
  const task = await findByIdOrThrow(TaskModel, bid.taskId, 'Task');

  // 7th: Ensure the task is still open
  if (task.status !== TaskStatus.OPEN) {
    throw new Error('Cannot delete bid because the task is no longer open');
  }

  // 8th: Try delete with concurrency safety
  const deletedBid = await BidModel.findByIdAndDelete(bidId);
  if (!deletedBid) {
    throw new Error('Bid already deleted');
  }

  return { message: 'Bid deleted successfully' };
};

const getAllBidsByTaskId = async (
  taskId: string,
  query: Record<string, any>
) => {
  // 1st: Validate taskId
  if (!mongoose.isValidObjectId(taskId))
    throw new ApiError(400, 'Invalid taskId');

  // 2nd: Ensure the task exists
  const task = await findByIdOrThrow(TaskModel, taskId, 'Task');

  // 3rd: Build query with filters, pagination, sorting etc.
  const queryBuilder = new QueryBuilder(BidModel.find({ taskId }), query)
    .search(['amount', 'message'])
    .filter()
    .dateFilter()
    .sort()
    .paginate()
    .fields()
    .populate(['taskerId'], { taskerId: 'name' });

  // 4th: Execute query
  const { data, pagination } = await queryBuilder.getFilteredResults();

  return { data, pagination };
};

const getBidById = async (bidId: string) => {
  // 1st: Validate bidId
  if (!mongoose.isValidObjectId(bidId))
    throw new ApiError(400, 'Invalid bidId');
  // 2nd: Find bid by ID
  const bid = await findByIdOrThrow(BidModel, bidId, 'Bid');

  return bid;
};

const acceptBid = async (bidId: string, clientId: string) => {
  // 1st: Validate bidId
  if (!mongoose.isValidObjectId(bidId)) {
    throw new ApiError(StatusCodes.BAD_REQUEST, 'Invalid bidId');
  }

  // 2nd: Find the bid by its ID
  const bid = await findByIdOrThrow(BidModel, bidId, 'Bid');

  // 3rd: Find the task associated with the bid
  const task = await findByIdOrThrow(TaskModel, bid.taskId, 'Task');

  // 4th: Check if the client is authorized to accept this bid
  if (task.userId.toString() !== clientId) {
    throw new ApiError(
      StatusCodes.FORBIDDEN,
      'You are not authorized to accept this bid'
    );
  }

  // 5th: Ensure the bid is still pending
  if (bid.status !== BidStatus.PENDING) {
    throw new ApiError(StatusCodes.BAD_REQUEST, 'Bid already processed');
  }

  // 6th: Ensure the task is open for accepting bids
  if (task.status !== TaskStatus.OPEN) {
    throw new ApiError(
      StatusCodes.BAD_REQUEST,
      'Task is not open for accepting bids'
    );
  }

  try {
    // 7th: Create escrow payment for the bid
    const paymentData = {
      taskId: new mongoose.Types.ObjectId(task._id),
      posterId: new mongoose.Types.ObjectId(clientId),
      freelancerId: bid.taskerId!,
      bidId: new mongoose.Types.ObjectId(bid._id),
      amount: bid.amount,
    };

    const paymentResult = await PaymentService.createEscrowPayment(paymentData);

    // 8th: Atomically accept bid and assign tasker to task
    const session = await mongoose.startSession();
    session.startTransaction();

    try {
      // 8.1: Accept the bid immediately so task moves to in-progress
      const acceptedBid = await BidModel.findOneAndUpdate(
        { _id: bid._id, status: BidStatus.PENDING },
        {
          $set: {
            status: BidStatus.ACCEPTED,
            paymentIntentId: paymentResult.payment.stripePaymentIntentId,
          },
        },
        { session, new: true }
      );

      if (!acceptedBid) {
        throw new ApiError(
          StatusCodes.CONFLICT,
          'Bid was already processed'
        );
      }

      // 8.2: Update the task status and assignment
      await TaskModel.findByIdAndUpdate(
        task._id,
        {
          status: TaskStatus.IN_PROGRESS,
          assignedTo: bid.taskerId,
          paymentIntentId: paymentResult.payment.stripePaymentIntentId,
        },
        { session }
      );

      // 8.3: Reject all other bids for this task
      await BidModel.updateMany(
        { taskId: task._id, _id: { $ne: bid._id } },
        { $set: { status: BidStatus.REJECTED } },
        { session }
      );

      // 8.4: Commit transaction
      await session.commitTransaction();
      session.endSession();

      // 9th: Notify freelancer about acceptance
      const acceptedNotification = {
        text: `Congratulations! Your bid for "${task.title}" has been accepted.`,
        title: 'Bid Accepted',
        receiver: bid.taskerId,
        type: 'BID_ACCEPTED',
        referenceId: bid._id,
        isRead: false,
      };

      try {
        await sendNotifications(acceptedNotification);
      } catch (err) {
        console.error('Failed to send notification for accepted bid:', err);
      }

      const updatedTask = await TaskModel.findById(task._id);
      return {
        bid: acceptedBid,
        task: updatedTask,
        payment: paymentResult,
        message: 'Bid accepted and task moved to in-progress. Payment processing...'
      };
    } catch (txError) {
      await session.abortTransaction();
      session.endSession();
      throw txError;
    }
  } catch (error) {
    const errorMessage =
      error instanceof Error ? error.message : 'Unknown error occurred';
    throw new ApiError(
      StatusCodes.INTERNAL_SERVER_ERROR,
      `Failed to accept bid: ${errorMessage}`
    );
  }
};

// New function to complete bid acceptance after payment is confirmed
const completeBidAcceptance = async (bidId: string) => {
  // 1st: Find the bid by its ID
  const bid = await findByIdOrThrow(BidModel, bidId, 'Bid');

  // 2nd: Find the task associated with the bid
  const task = await findByIdOrThrow(TaskModel, bid.taskId, 'Task');

  // 3rd: If bid is already accepted, ensure task state is correct and exit
  if (bid.status === BidStatus.ACCEPTED) {
    await TaskModel.findByIdAndUpdate(task._id, {
      status: TaskStatus.IN_PROGRESS,
      assignedTo: bid?.taskerId,
    });
    // Also ensure other bids are rejected
    await BidModel.updateMany(
      { taskId: task._id, _id: { $ne: bid._id } },
      { $set: { status: BidStatus.REJECTED } }
    );
    return { bid, task };
  }

  // 3.1: Otherwise, proceed if we were still pending payment
  if (bid.status !== BidStatus.PAYMENT_PENDING) {
    throw new ApiError(
      StatusCodes.BAD_REQUEST,
      'Bid is not in payment pending status'
    );
  }

  // 4th: Start a MongoDB session for transaction
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    // 5th: Accept the selected bid atomically to prevent race conditions
    const acceptedBid = await BidModel.findOneAndUpdate(
      { _id: bid._id, status: BidStatus.PAYMENT_PENDING },
      { $set: { status: BidStatus.ACCEPTED } },
      { session, new: true }
    );

    if (!acceptedBid) {
      throw new ApiError(
        StatusCodes.CONFLICT,
        'Bid was already processed or payment not confirmed'
      );
    }

    // 6th: Update the task: assign freelancer, update status
    await TaskModel.findByIdAndUpdate(
      task._id,
      {
        status: TaskStatus.IN_PROGRESS,
        assignedTo: bid?.taskerId,
      },
      { session }
    );

    // 7th: Reject all other bids for this task
    await BidModel.updateMany(
      { taskId: task._id, _id: { $ne: bid._id } },
      { $set: { status: BidStatus.REJECTED } },
      { session }
    );

    // 8th: Commit the transaction to finalize all changes
    await session.commitTransaction();
    session.endSession();

    // 9th: Send notifications to the accepted freelancer
    const acceptedNotification = {
      text: `Congratulations! Your bid for "${task.title}" has been accepted. Payment is confirmed and held in escrow.`,
      title: 'Bid Accepted',
      receiver: bid.taskerId,
      type: 'BID_ACCEPTED',
      referenceId: bid._id,
      isRead: false,
    };

    try {
      await sendNotifications(acceptedNotification);
    } catch (err) {
      console.error('Failed to send notification for accepted bid:', err);
    }

    return { bid: acceptedBid, task };
  } catch (error) {
    // ❌ Rollback transaction if anything fails
    await session.abortTransaction();
    session.endSession();

    const errorMessage =
      error instanceof Error ? error.message : 'Unknown error occurred';
    throw new ApiError(
      StatusCodes.INTERNAL_SERVER_ERROR,
      `Failed to complete bid acceptance: ${errorMessage}`
    );
  }
};

const getAllBidsByTaskIdWithTasker = async (taskId: string) => {
  const task = await findByIdOrThrow(TaskModel, taskId, 'Task');

  return await BidModel.find({ taskId }).populate({
    path: 'taskerId',
    model: 'User',
    select: 'name email image location phone role verified',
  });
};

export const BidService = {
  createBid,
  getAllBidsByTaskIdWithTasker,
  getAllBidsByTaskId,
  getBidById,
  updateBid,
  deleteBid,
  acceptBid,
  completeBidAcceptance,
  getAllTasksByTaskerBids,
};
