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
Object.defineProperty(exports, "__esModule", { value: true });
exports.createRefundForIntent = exports.createTransfer = exports.retrievePaymentIntent = exports.createPaymentIntent = exports.deleteAccount = exports.retrieveAccount = exports.createOnboardingLink = exports.createExpressAccount = void 0;
const stripe_1 = require("../../../config/stripe");
const createExpressAccount = (params) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const account = yield stripe_1.stripe.accounts.create({
            type: 'express',
            country: 'US',
            email: params.email,
            capabilities: {
                card_payments: { requested: true },
                transfers: { requested: true },
            },
            business_type: 'individual',
            individual: {
                first_name: params.firstName,
                last_name: params.lastName || '',
                email: params.email,
                dob: params.dob,
                address: {
                    city: params.city,
                    country: 'US',
                },
            },
            metadata: params.metadata,
        });
        return account;
    }
    catch (error) {
        throw new Error(`createExpressAccount failed: ${(0, stripe_1.handleStripeError)(error)}`);
    }
});
exports.createExpressAccount = createExpressAccount;
const createOnboardingLink = (accountId, refreshUrl, returnUrl) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const accountLink = yield stripe_1.stripe.accountLinks.create({
            account: accountId,
            refresh_url: refreshUrl,
            return_url: returnUrl,
            type: 'account_onboarding',
        });
        return accountLink.url;
    }
    catch (error) {
        throw new Error(`createOnboardingLink failed: ${(0, stripe_1.handleStripeError)(error)}`);
    }
});
exports.createOnboardingLink = createOnboardingLink;
const retrieveAccount = (accountId) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        return yield stripe_1.stripe.accounts.retrieve(accountId);
    }
    catch (error) {
        throw new Error(`retrieveAccount failed: ${(0, stripe_1.handleStripeError)(error)}`);
    }
});
exports.retrieveAccount = retrieveAccount;
const deleteAccount = (accountId) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        return yield stripe_1.stripe.accounts.del(accountId);
    }
    catch (error) {
        throw new Error(`deleteAccount failed: ${(0, stripe_1.handleStripeError)(error)}`);
    }
});
exports.deleteAccount = deleteAccount;
const createPaymentIntent = (params) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const intent = yield stripe_1.stripe.paymentIntents.create({
            amount: (0, stripe_1.dollarsToCents)(params.amountDollars),
            currency: params.currency || stripe_1.DEFAULT_CURRENCY,
            automatic_payment_methods: { enabled: true },
            capture_method: params.captureMethod || 'manual',
            metadata: params.metadata,
        });
        return intent;
    }
    catch (error) {
        throw new Error(`createPaymentIntent failed: ${(0, stripe_1.handleStripeError)(error)}`);
    }
});
exports.createPaymentIntent = createPaymentIntent;
const retrievePaymentIntent = (intentId) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        return yield stripe_1.stripe.paymentIntents.retrieve(intentId);
    }
    catch (error) {
        throw new Error(`retrievePaymentIntent failed: ${(0, stripe_1.handleStripeError)(error)}`);
    }
});
exports.retrievePaymentIntent = retrievePaymentIntent;
const createTransfer = (params) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const transfer = yield stripe_1.stripe.transfers.create({
            amount: (0, stripe_1.dollarsToCents)(params.amountDollars),
            currency: params.currency || stripe_1.DEFAULT_CURRENCY,
            destination: params.destinationAccountId,
            source_transaction: params.sourceChargeId,
            metadata: params.metadata,
        });
        return transfer;
    }
    catch (error) {
        throw new Error(`createTransfer failed: ${(0, stripe_1.handleStripeError)(error)}`);
    }
});
exports.createTransfer = createTransfer;
const createRefundForIntent = (intentId, reason) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const refund = yield stripe_1.stripe.refunds.create({
            payment_intent: intentId,
            reason: reason,
        });
        return refund;
    }
    catch (error) {
        throw new Error(`createRefundForIntent failed: ${(0, stripe_1.handleStripeError)(error)}`);
    }
});
exports.createRefundForIntent = createRefundForIntent;
