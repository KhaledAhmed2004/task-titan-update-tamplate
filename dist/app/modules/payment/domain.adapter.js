"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
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
exports.PaymentDomainAdapter = exports.DefaultPaymentDomainAdapter = void 0;
const ApiError_1 = __importDefault(require("../../../errors/ApiError"));
const http_status_1 = __importDefault(require("http-status"));
const bid_model_1 = require("../bid/bid.model");
const task_model_1 = require("../task/task.model");
// Default adapter that uses existing Task/Bid models.
// Projects can replace this by exporting their own implementation.
class DefaultPaymentDomainAdapter {
    getBidAndTask(bidId) {
        return __awaiter(this, void 0, void 0, function* () {
            var _a, _b;
            const bid = yield bid_model_1.BidModel.findById(bidId).populate('taskId');
            if (!bid) {
                throw new ApiError_1.default(http_status_1.default.NOT_FOUND, 'Bid not found');
            }
            const task = bid.taskId;
            if (!bid.taskerId) {
                throw new ApiError_1.default(http_status_1.default.BAD_REQUEST, 'Bid does not have an assigned freelancer');
            }
            return { bid, task, freelancerId: (_b = (_a = bid.taskerId) === null || _a === void 0 ? void 0 : _a.toString) === null || _b === void 0 ? void 0 : _b.call(_a) };
        });
    }
    ensureClientAuthorized(taskId, clientId) {
        return __awaiter(this, void 0, void 0, function* () {
            var _a, _b, _c;
            const task = yield task_model_1.TaskModel.findById(taskId);
            if (!task || ((_b = (_a = task.userId) === null || _a === void 0 ? void 0 : _a.toString) === null || _b === void 0 ? void 0 : _b.call(_a)) !== ((_c = clientId === null || clientId === void 0 ? void 0 : clientId.toString) === null || _c === void 0 ? void 0 : _c.call(clientId))) {
                throw new ApiError_1.default(http_status_1.default.FORBIDDEN, 'You are not authorized to release this payment');
            }
        });
    }
    markBidCompleted(bidId) {
        return __awaiter(this, void 0, void 0, function* () {
            yield bid_model_1.BidModel.findByIdAndUpdate(bidId, { status: 'completed' });
        });
    }
    markBidCancelled(bidId) {
        return __awaiter(this, void 0, void 0, function* () {
            yield bid_model_1.BidModel.findByIdAndUpdate(bidId, { status: 'cancelled' });
        });
    }
    getPaymentsPopulateOptions() {
        // Deep populate bid -> task and tasker for richer views
        return {
            path: 'bidId',
            populate: [
                { path: 'taskId', select: 'title' },
                { path: 'taskerId', select: 'name email' },
            ],
        };
    }
    resetBidToPending(bidId, paymentIntentId) {
        return __awaiter(this, void 0, void 0, function* () {
            yield bid_model_1.BidModel.findByIdAndUpdate(bidId, {
                status: 'pending',
                paymentIntentId: paymentIntentId ? null : undefined,
            });
        });
    }
    revertTaskAssignmentIfMatches(bidId) {
        return __awaiter(this, void 0, void 0, function* () {
            var _a, _b, _c, _d;
            const bid = yield bid_model_1.BidModel.findById(bidId);
            if (!bid)
                return;
            const task = yield task_model_1.TaskModel.findById(bid.taskId);
            if (!task)
                return;
            const assignedMatches = ((_b = (_a = task.assignedTo) === null || _a === void 0 ? void 0 : _a.toString) === null || _b === void 0 ? void 0 : _b.call(_a)) === ((_d = (_c = bid.taskerId) === null || _c === void 0 ? void 0 : _c.toString) === null || _d === void 0 ? void 0 : _d.call(_c));
            if (assignedMatches) {
                yield task_model_1.TaskModel.findByIdAndUpdate(task._id, {
                    status: 'OPEN',
                    assignedTo: null,
                    paymentIntentId: null,
                });
            }
        });
    }
    completeBidAcceptanceAfterCapture(bidId) {
        return __awaiter(this, void 0, void 0, function* () {
            const { BidService } = yield Promise.resolve().then(() => __importStar(require('../bid/bid.service')));
            yield BidService.completeBidAcceptance(bidId);
        });
    }
}
exports.DefaultPaymentDomainAdapter = DefaultPaymentDomainAdapter;
// Export a singleton default adapter; projects can re-export a custom one elsewhere
exports.PaymentDomainAdapter = new DefaultPaymentDomainAdapter();
