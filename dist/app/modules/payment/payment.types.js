"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.CURRENCY = exports.RELEASE_TYPE = exports.PAYMENT_STATUS = void 0;
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
// Release Type Enum
var RELEASE_TYPE;
(function (RELEASE_TYPE) {
    RELEASE_TYPE["COMPLETE"] = "complete";
    RELEASE_TYPE["PARTIAL"] = "partial";
    RELEASE_TYPE["REFUND"] = "refund";
})(RELEASE_TYPE || (exports.RELEASE_TYPE = RELEASE_TYPE = {}));
// // Account Type Enum
// export enum ACCOUNT_TYPE {
//   CLIENT = 'client',
//   FREELANCER = 'freelancer',
// }
// Currency Enum (common currencies)
var CURRENCY;
(function (CURRENCY) {
    CURRENCY["USD"] = "usd";
    CURRENCY["EUR"] = "eur";
    CURRENCY["GBP"] = "gbp";
    CURRENCY["CAD"] = "cad";
    CURRENCY["AUD"] = "aud";
})(CURRENCY || (exports.CURRENCY = CURRENCY = {}));
