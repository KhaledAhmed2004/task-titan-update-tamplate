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
exports.BidService = void 0;
const bid_interface_1 = require("./bid.interface");
const bid_model_1 = require("./bid.model");
const task_model_1 = require("../task/task.model");
const task_interface_1 = require("../task/task.interface");
const notificationsHelper_1 = require("../notification/notificationsHelper");
const payment_service_1 = __importDefault(require("../payment/payment.service"));
const mongoose_1 = __importDefault(require("mongoose"));
const QueryBuilder_1 = __importDefault(require("../../builder/QueryBuilder"));
const ApiError_1 = __importDefault(require("../../../errors/ApiError"));
const http_status_codes_1 = require("http-status-codes");
const rating_1 = require("../rating");
const serviceHelpers_1 = require("../../../helpers/serviceHelpers");
const createBid = (bid, taskerId) => __awaiter(void 0, void 0, void 0, function* () {
    // 1st: Find the task
    const task = yield (0, serviceHelpers_1.findByIdOrThrow)(task_model_1.TaskModel, bid.taskId, 'Task');
    // 2️nd: Check if the task status allows bidding
    if (task.status === task_interface_1.TaskStatus.COMPLETED) {
        throw new ApiError_1.default(http_status_codes_1.StatusCodes.BAD_REQUEST, 'Cannot place bid: Task is already completed');
    }
    if (task.status === task_interface_1.TaskStatus.CANCELLED) {
        throw new ApiError_1.default(http_status_codes_1.StatusCodes.BAD_REQUEST, 'Cannot place bid: Task is already cancelled');
    }
    if (task.status === task_interface_1.TaskStatus.IN_PROGRESS) {
        throw new ApiError_1.default(http_status_codes_1.StatusCodes.BAD_REQUEST, 'Cannot place bid: Task is already accepted');
    }
    // 3️rd: Check if the tasker has already placed a bid on this task
    const isBidExistByTasker = yield bid_model_1.BidModel.findOne({
        taskId: bid.taskId,
        taskerId,
    });
    if (isBidExistByTasker)
        throw new ApiError_1.default(http_status_codes_1.StatusCodes.BAD_REQUEST, 'You have already placed a bid for this task');
    // 4️th: Create a new bid
    const newBid = yield bid_model_1.BidModel.create(Object.assign(Object.assign({}, bid), { taskerId, status: bid_interface_1.BidStatus.PENDING }));
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
    yield (0, notificationsHelper_1.sendNotifications)(notificationData);
    return newBid;
});
// Service: Get all tasks a tasker has bid on (with rating from poster)
const getAllTasksByTaskerBids = (taskerId_1, ...args_1) => __awaiter(void 0, [taskerId_1, ...args_1], void 0, function* (taskerId, query = {}) {
    // 1st: Query bids for this tasker
    const bidQuery = new QueryBuilder_1.default(bid_model_1.BidModel.find({ taskerId }), query)
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
    const { data: bids, pagination } = yield bidQuery.getFilteredResults([
        'taskId',
    ]);
    // 3rd: Add rating info for each task (from poster → tasker)
    const bidsWithRating = yield Promise.all(bids.map((bid) => __awaiter(void 0, void 0, void 0, function* () {
        var _a;
        const task = bid.taskId; // populated task
        let ratingValue = 'not given';
        // Check if task exists and is not null (task might be deleted)
        if (task && ((_a = task.assignedTo) === null || _a === void 0 ? void 0 : _a.toString()) === taskerId) {
            const rating = yield rating_1.Rating.findOne({
                taskId: task === null || task === void 0 ? void 0 : task._id,
                givenBy: task === null || task === void 0 ? void 0 : task.userId, // poster
                givenTo: task === null || task === void 0 ? void 0 : task.assignedTo, // tasker
            });
            if (rating) {
                ratingValue = rating.rating;
            }
        }
        return Object.assign(Object.assign({}, bid.toObject()), { ratingFromPoster: ratingValue, 
            // Add task status to help identify deleted tasks
            taskExists: task !== null });
    })));
    // 4th: Return final result
    return {
        data: bidsWithRating,
        pagination,
    };
});
const updateBid = (bidId, taskerId, bidUpdate) => __awaiter(void 0, void 0, void 0, function* () {
    // 1st: Find the bid by ID
    const bid = yield bid_model_1.BidModel.findById(bidId);
    if (!bid)
        throw new Error('Bid not found');
    // const bid = await findByIdOrThrow(BidModel, bidId, 'Bid');
    // 2nd: Ensure only the tasker who created the bid can update it
    if (!bid.taskerId || bid.taskerId.toString() !== taskerId)
        throw new Error('Not authorized');
    // 3rd: Only pending bids can be updated
    if (bid.status !== bid_interface_1.BidStatus.PENDING)
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
    yield bid.save();
    return bid;
});
const deleteBid = (bidId, taskerId) => __awaiter(void 0, void 0, void 0, function* () {
    // 1st: Check if bidId is valid
    if (!mongoose_1.default.Types.ObjectId.isValid(bidId)) {
        throw new Error('Invalid bid ID format');
    }
    // 2nd: Find the bid by ID
    const bid = yield (0, serviceHelpers_1.findByIdOrThrow)(bid_model_1.BidModel, bidId, 'Bid');
    // 3rd: Check if taskerId is provided
    if (!taskerId)
        throw new Error('Tasker ID missing');
    // 4th: Ensure only the bid owner can delete
    if (!bid.taskerId || bid.taskerId.toString() !== taskerId) {
        throw new Error('Not authorized');
    }
    // 5th: Only pending bids can be deleted
    if (bid.status !== bid_interface_1.BidStatus.PENDING) {
        throw new Error('Cannot delete a bid that is not pending');
    }
    // 6th: Fetch the associated task
    const task = yield (0, serviceHelpers_1.findByIdOrThrow)(task_model_1.TaskModel, bid.taskId, 'Task');
    // 7th: Ensure the task is still open
    if (task.status !== task_interface_1.TaskStatus.OPEN) {
        throw new Error('Cannot delete bid because the task is no longer open');
    }
    // 8th: Try delete with concurrency safety
    const deletedBid = yield bid_model_1.BidModel.findByIdAndDelete(bidId);
    if (!deletedBid) {
        throw new Error('Bid already deleted');
    }
    return { message: 'Bid deleted successfully' };
});
const getAllBidsByTaskId = (taskId, query) => __awaiter(void 0, void 0, void 0, function* () {
    // 1st: Validate taskId
    if (!mongoose_1.default.isValidObjectId(taskId))
        throw new ApiError_1.default(400, 'Invalid taskId');
    // 2nd: Ensure the task exists
    const task = yield (0, serviceHelpers_1.findByIdOrThrow)(task_model_1.TaskModel, taskId, 'Task');
    // 3rd: Build query with filters, pagination, sorting etc.
    const queryBuilder = new QueryBuilder_1.default(bid_model_1.BidModel.find({ taskId }), query)
        .search(['amount', 'message'])
        .filter()
        .dateFilter()
        .sort()
        .paginate()
        .fields()
        .populate(['taskerId'], { taskerId: 'name' });
    // 4th: Execute query
    const { data, pagination } = yield queryBuilder.getFilteredResults();
    return { data, pagination };
});
const getBidById = (bidId) => __awaiter(void 0, void 0, void 0, function* () {
    // 1st: Validate bidId
    if (!mongoose_1.default.isValidObjectId(bidId))
        throw new ApiError_1.default(400, 'Invalid bidId');
    // 2nd: Find bid by ID
    const bid = yield (0, serviceHelpers_1.findByIdOrThrow)(bid_model_1.BidModel, bidId, 'Bid');
    return bid;
});
const acceptBid = (bidId, clientId) => __awaiter(void 0, void 0, void 0, function* () {
    // 1st: Validate bidId
    if (!mongoose_1.default.isValidObjectId(bidId)) {
        throw new ApiError_1.default(http_status_codes_1.StatusCodes.BAD_REQUEST, 'Invalid bidId');
    }
    // 2nd: Find the bid by its ID
    const bid = yield (0, serviceHelpers_1.findByIdOrThrow)(bid_model_1.BidModel, bidId, 'Bid');
    // 3rd: Find the task associated with the bid
    const task = yield (0, serviceHelpers_1.findByIdOrThrow)(task_model_1.TaskModel, bid.taskId, 'Task');
    // 4th: Check if the client is authorized to accept this bid
    if (task.userId.toString() !== clientId) {
        throw new ApiError_1.default(http_status_codes_1.StatusCodes.FORBIDDEN, 'You are not authorized to accept this bid');
    }
    // 5th: Ensure the bid is still pending
    if (bid.status !== bid_interface_1.BidStatus.PENDING) {
        throw new ApiError_1.default(http_status_codes_1.StatusCodes.BAD_REQUEST, 'Bid already processed');
    }
    // 6th: Ensure the task is open for accepting bids
    if (task.status !== task_interface_1.TaskStatus.OPEN) {
        throw new ApiError_1.default(http_status_codes_1.StatusCodes.BAD_REQUEST, 'Task is not open for accepting bids');
    }
    try {
        // 7th: Create escrow payment for the bid
        const paymentData = {
            taskId: new mongoose_1.default.Types.ObjectId(task._id),
            posterId: new mongoose_1.default.Types.ObjectId(clientId),
            freelancerId: bid.taskerId,
            bidId: new mongoose_1.default.Types.ObjectId(bid._id),
            amount: bid.amount,
        };
        const paymentResult = yield payment_service_1.default.createEscrowPayment(paymentData);
        // 8th: Atomically accept bid and assign tasker to task
        const session = yield mongoose_1.default.startSession();
        session.startTransaction();
        try {
            // 8.1: Accept the bid immediately so task moves to in-progress
            const acceptedBid = yield bid_model_1.BidModel.findOneAndUpdate({ _id: bid._id, status: bid_interface_1.BidStatus.PENDING }, {
                $set: {
                    status: bid_interface_1.BidStatus.ACCEPTED,
                    paymentIntentId: paymentResult.payment.stripePaymentIntentId,
                },
            }, { session, new: true });
            if (!acceptedBid) {
                throw new ApiError_1.default(http_status_codes_1.StatusCodes.CONFLICT, 'Bid was already processed');
            }
            // 8.2: Update the task status and assignment
            yield task_model_1.TaskModel.findByIdAndUpdate(task._id, {
                status: task_interface_1.TaskStatus.IN_PROGRESS,
                assignedTo: bid.taskerId,
                paymentIntentId: paymentResult.payment.stripePaymentIntentId,
            }, { session });
            // 8.3: Reject all other bids for this task
            yield bid_model_1.BidModel.updateMany({ taskId: task._id, _id: { $ne: bid._id } }, { $set: { status: bid_interface_1.BidStatus.REJECTED } }, { session });
            // 8.4: Commit transaction
            yield session.commitTransaction();
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
                yield (0, notificationsHelper_1.sendNotifications)(acceptedNotification);
            }
            catch (err) {
                console.error('Failed to send notification for accepted bid:', err);
            }
            const updatedTask = yield task_model_1.TaskModel.findById(task._id);
            return {
                bid: acceptedBid,
                task: updatedTask,
                payment: paymentResult,
                message: 'Bid accepted and task moved to in-progress. Payment processing...'
            };
        }
        catch (txError) {
            yield session.abortTransaction();
            session.endSession();
            throw txError;
        }
    }
    catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
        throw new ApiError_1.default(http_status_codes_1.StatusCodes.INTERNAL_SERVER_ERROR, `Failed to accept bid: ${errorMessage}`);
    }
});
// New function to complete bid acceptance after payment is confirmed
const completeBidAcceptance = (bidId) => __awaiter(void 0, void 0, void 0, function* () {
    // 1st: Find the bid by its ID
    const bid = yield (0, serviceHelpers_1.findByIdOrThrow)(bid_model_1.BidModel, bidId, 'Bid');
    // 2nd: Find the task associated with the bid
    const task = yield (0, serviceHelpers_1.findByIdOrThrow)(task_model_1.TaskModel, bid.taskId, 'Task');
    // 3rd: If bid is already accepted, ensure task state is correct and exit
    if (bid.status === bid_interface_1.BidStatus.ACCEPTED) {
        yield task_model_1.TaskModel.findByIdAndUpdate(task._id, {
            status: task_interface_1.TaskStatus.IN_PROGRESS,
            assignedTo: bid === null || bid === void 0 ? void 0 : bid.taskerId,
        });
        // Also ensure other bids are rejected
        yield bid_model_1.BidModel.updateMany({ taskId: task._id, _id: { $ne: bid._id } }, { $set: { status: bid_interface_1.BidStatus.REJECTED } });
        return { bid, task };
    }
    // 3.1: Otherwise, proceed if we were still pending payment
    if (bid.status !== bid_interface_1.BidStatus.PAYMENT_PENDING) {
        throw new ApiError_1.default(http_status_codes_1.StatusCodes.BAD_REQUEST, 'Bid is not in payment pending status');
    }
    // 4th: Start a MongoDB session for transaction
    const session = yield mongoose_1.default.startSession();
    session.startTransaction();
    try {
        // 5th: Accept the selected bid atomically to prevent race conditions
        const acceptedBid = yield bid_model_1.BidModel.findOneAndUpdate({ _id: bid._id, status: bid_interface_1.BidStatus.PAYMENT_PENDING }, { $set: { status: bid_interface_1.BidStatus.ACCEPTED } }, { session, new: true });
        if (!acceptedBid) {
            throw new ApiError_1.default(http_status_codes_1.StatusCodes.CONFLICT, 'Bid was already processed or payment not confirmed');
        }
        // 6th: Update the task: assign freelancer, update status
        yield task_model_1.TaskModel.findByIdAndUpdate(task._id, {
            status: task_interface_1.TaskStatus.IN_PROGRESS,
            assignedTo: bid === null || bid === void 0 ? void 0 : bid.taskerId,
        }, { session });
        // 7th: Reject all other bids for this task
        yield bid_model_1.BidModel.updateMany({ taskId: task._id, _id: { $ne: bid._id } }, { $set: { status: bid_interface_1.BidStatus.REJECTED } }, { session });
        // 8th: Commit the transaction to finalize all changes
        yield session.commitTransaction();
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
            yield (0, notificationsHelper_1.sendNotifications)(acceptedNotification);
        }
        catch (err) {
            console.error('Failed to send notification for accepted bid:', err);
        }
        return { bid: acceptedBid, task };
    }
    catch (error) {
        // ❌ Rollback transaction if anything fails
        yield session.abortTransaction();
        session.endSession();
        const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
        throw new ApiError_1.default(http_status_codes_1.StatusCodes.INTERNAL_SERVER_ERROR, `Failed to complete bid acceptance: ${errorMessage}`);
    }
});
const getAllBidsByTaskIdWithTasker = (taskId) => __awaiter(void 0, void 0, void 0, function* () {
    const task = yield (0, serviceHelpers_1.findByIdOrThrow)(task_model_1.TaskModel, taskId, 'Task');
    return yield bid_model_1.BidModel.find({ taskId }).populate({
        path: 'taskerId',
        model: 'User',
        select: 'name email image location phone role verified',
    });
});
exports.BidService = {
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
