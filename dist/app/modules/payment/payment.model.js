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
Object.defineProperty(exports, "__esModule", { value: true });
exports.StripeAccountModel = exports.PaymentModel = exports.StripeAccount = exports.Payment = void 0;
const mongoose_1 = __importStar(require("mongoose"));
const payment_interface_1 = require("./payment.interface");
const PaymentSchema = new mongoose_1.Schema({
    taskId: {
        type: mongoose_1.Schema.Types.ObjectId,
        ref: 'Task',
        required: true,
    },
    posterId: {
        type: mongoose_1.Schema.Types.ObjectId,
        ref: 'User',
        required: true,
    },
    freelancerId: {
        type: mongoose_1.Schema.Types.ObjectId,
        ref: 'User',
        required: true,
    },
    bidId: {
        type: mongoose_1.Schema.Types.ObjectId,
        ref: 'Bid',
        required: false,
    },
    amount: {
        type: Number,
        required: true,
        min: 0,
    },
    platformFee: {
        type: Number,
        required: true,
        min: 0,
    },
    freelancerAmount: {
        type: Number,
        required: true,
        min: 0,
    },
    stripePaymentIntentId: {
        type: String,
        required: true,
    },
    stripeTransferId: {
        type: String,
        required: false,
    },
    status: {
        type: String,
        enum: Object.values(payment_interface_1.PAYMENT_STATUS),
        default: payment_interface_1.PAYMENT_STATUS.PENDING,
        required: true,
    },
    currency: {
        type: String,
        default: 'usd',
        required: true,
    },
    metadata: {
        type: mongoose_1.Schema.Types.Mixed,
        default: {},
    },
    refundReason: {
        type: String,
        required: false,
    },
}, {
    timestamps: true,
});
// Indexes for better query performance
PaymentSchema.index({ taskId: 1 });
PaymentSchema.index({ posterId: 1 });
PaymentSchema.index({ freelancerId: 1 });
PaymentSchema.index({ bidId: 1 });
PaymentSchema.index({ status: 1 });
PaymentSchema.index({ stripePaymentIntentId: 1 });
const StripeAccountSchema = new mongoose_1.Schema({
    userId: {
        type: mongoose_1.Schema.Types.ObjectId,
        ref: 'User',
        required: true,
    },
    stripeAccountId: {
        type: String,
        required: true,
    },
    onboardingCompleted: {
        type: Boolean,
        default: false,
    },
    chargesEnabled: {
        type: Boolean,
        default: false,
    },
    payoutsEnabled: {
        type: Boolean,
        default: false,
    },
    country: {
        type: String,
        required: false,
    },
    currency: {
        type: String,
        default: 'usd',
    },
    businessType: {
        type: String,
        enum: Object.values(payment_interface_1.BUSINESS_TYPE),
        default: payment_interface_1.BUSINESS_TYPE.INDIVIDUAL,
        required: true,
    },
}, {
    timestamps: true,
});
// Indexes
StripeAccountSchema.index({ userId: 1 });
StripeAccountSchema.index({ stripeAccountId: 1 });
// Payment Model Methods (following project patterns)
PaymentSchema.statics.isExistPaymentById = function (id) {
    return __awaiter(this, void 0, void 0, function* () {
        return yield this.findById(id);
    });
};
PaymentSchema.statics.isExistPaymentByStripeId = function (stripeId) {
    return __awaiter(this, void 0, void 0, function* () {
        return yield this.findOne({ stripePaymentIntentId: stripeId });
    });
};
PaymentSchema.statics.getPaymentsByUser = function (userId) {
    return __awaiter(this, void 0, void 0, function* () {
        return yield this.find({
            $or: [{ posterId: userId }, { freelancerId: userId }]
        }).populate('taskId posterId freelancerId');
    });
};
PaymentSchema.statics.getPaymentsByTask = function (taskId) {
    return __awaiter(this, void 0, void 0, function* () {
        return yield this.find({ taskId }).populate('posterId freelancerId');
    });
};
PaymentSchema.statics.getPaymentsByBid = function (bidId) {
    return __awaiter(this, void 0, void 0, function* () {
        return yield this.find({ bidId }).populate('taskId posterId freelancerId');
    });
};
PaymentSchema.statics.updatePaymentStatus = function (paymentId, status) {
    return __awaiter(this, void 0, void 0, function* () {
        return yield this.findByIdAndUpdate(paymentId, { status, updatedAt: new Date() }, { new: true });
    });
};
// Stripe Account Model Methods
StripeAccountSchema.statics.isExistAccountByUserId = function (userId) {
    return __awaiter(this, void 0, void 0, function* () {
        return yield this.findOne({ userId });
    });
};
StripeAccountSchema.statics.isExistAccountByStripeId = function (stripeId) {
    return __awaiter(this, void 0, void 0, function* () {
        return yield this.findOne({ stripeAccountId: stripeId });
    });
};
StripeAccountSchema.statics.updateAccountStatus = function (userId, updates) {
    return __awaiter(this, void 0, void 0, function* () {
        return yield this.findOneAndUpdate({ userId }, Object.assign(Object.assign({}, updates), { updatedAt: new Date() }), { new: true });
    });
};
// Export Models with proper typing
exports.Payment = mongoose_1.default.model('Payment', PaymentSchema);
exports.PaymentModel = exports.Payment;
exports.StripeAccount = mongoose_1.default.model('StripeAccount', StripeAccountSchema);
exports.StripeAccountModel = exports.StripeAccount;
