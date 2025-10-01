"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.WEBHOOK_EVENT_TYPE = exports.CURRENCY = exports.ACCOUNT_TYPE = exports.RELEASE_TYPE = exports.BUSINESS_TYPE = exports.PAYMENT_STATUS = void 0;
// Payment Status Enum
var PAYMENT_STATUS;
(function (PAYMENT_STATUS) {
    PAYMENT_STATUS["PENDING"] = "pending";
    PAYMENT_STATUS["HELD"] = "held";
    PAYMENT_STATUS["RELEASED"] = "released";
    PAYMENT_STATUS["REFUNDED"] = "refunded";
    PAYMENT_STATUS["FAILED"] = "failed";
    PAYMENT_STATUS["CANCELLED"] = "cancelled";
})(PAYMENT_STATUS || (exports.PAYMENT_STATUS = PAYMENT_STATUS = {}));
// Business Type Enum
var BUSINESS_TYPE;
(function (BUSINESS_TYPE) {
    BUSINESS_TYPE["INDIVIDUAL"] = "individual";
    BUSINESS_TYPE["COMPANY"] = "company";
})(BUSINESS_TYPE || (exports.BUSINESS_TYPE = BUSINESS_TYPE = {}));
// Release Type Enum
var RELEASE_TYPE;
(function (RELEASE_TYPE) {
    RELEASE_TYPE["COMPLETE"] = "complete";
    RELEASE_TYPE["PARTIAL"] = "partial";
    RELEASE_TYPE["REFUND"] = "refund";
})(RELEASE_TYPE || (exports.RELEASE_TYPE = RELEASE_TYPE = {}));
// Account Type Enum
var ACCOUNT_TYPE;
(function (ACCOUNT_TYPE) {
    ACCOUNT_TYPE["CLIENT"] = "client";
    ACCOUNT_TYPE["FREELANCER"] = "freelancer";
})(ACCOUNT_TYPE || (exports.ACCOUNT_TYPE = ACCOUNT_TYPE = {}));
// Currency Enum (common currencies)
var CURRENCY;
(function (CURRENCY) {
    CURRENCY["USD"] = "usd";
    CURRENCY["EUR"] = "eur";
    CURRENCY["GBP"] = "gbp";
    CURRENCY["CAD"] = "cad";
    CURRENCY["AUD"] = "aud";
})(CURRENCY || (exports.CURRENCY = CURRENCY = {}));
// Webhook Event Types
var WEBHOOK_EVENT_TYPE;
(function (WEBHOOK_EVENT_TYPE) {
    WEBHOOK_EVENT_TYPE["PAYMENT_INTENT_SUCCEEDED"] = "payment_intent.succeeded";
    WEBHOOK_EVENT_TYPE["PAYMENT_INTENT_PAYMENT_FAILED"] = "payment_intent.payment_failed";
    WEBHOOK_EVENT_TYPE["TRANSFER_CREATED"] = "transfer.created";
    WEBHOOK_EVENT_TYPE["TRANSFER_UPDATED"] = "transfer.updated";
    WEBHOOK_EVENT_TYPE["ACCOUNT_UPDATED"] = "account.updated";
    WEBHOOK_EVENT_TYPE["PAYOUT_CREATED"] = "payout.created";
    WEBHOOK_EVENT_TYPE["PAYOUT_FAILED"] = "payout.failed";
})(WEBHOOK_EVENT_TYPE || (exports.WEBHOOK_EVENT_TYPE = WEBHOOK_EVENT_TYPE = {}));
