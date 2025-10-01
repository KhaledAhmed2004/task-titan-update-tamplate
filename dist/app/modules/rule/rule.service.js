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
exports.RuleService = void 0;
const http_status_codes_1 = require("http-status-codes");
const ApiError_1 = __importDefault(require("../../../errors/ApiError"));
const rule_model_1 = require("./rule.model");
//privacy policy
const createPrivacyPolicyToDB = (payload) => __awaiter(void 0, void 0, void 0, function* () {
    // check if privacy policy exist or not
    const isExistPrivacy = yield rule_model_1.Rule.findOne({ type: 'privacy' });
    if (isExistPrivacy) {
        // update privacy is exist 
        const result = yield rule_model_1.Rule.findOneAndUpdate({ type: 'privacy' }, { content: payload === null || payload === void 0 ? void 0 : payload.content }, { new: true });
        const message = "Privacy & Policy Updated successfully";
        return { message, result };
    }
    else {
        // create new if not exist
        const result = yield rule_model_1.Rule.create(Object.assign(Object.assign({}, payload), { type: 'privacy' }));
        const message = "Privacy & Policy Created successfully";
        return { message, result };
    }
});
const getPrivacyPolicyFromDB = () => __awaiter(void 0, void 0, void 0, function* () {
    const result = yield rule_model_1.Rule.findOne({ type: 'privacy' });
    if (!result) {
        throw new ApiError_1.default(http_status_codes_1.StatusCodes.BAD_REQUEST, "Privacy policy doesn't exist!");
    }
    return result;
});
//terms and conditions
const createTermsAndConditionToDB = (payload) => __awaiter(void 0, void 0, void 0, function* () {
    const isExistTerms = yield rule_model_1.Rule.findOne({ type: 'terms' });
    if (isExistTerms) {
        const result = yield rule_model_1.Rule.findOneAndUpdate({ type: 'terms' }, { content: payload === null || payload === void 0 ? void 0 : payload.content }, { new: true });
        const message = "Terms And Condition Updated successfully";
        return { message, result };
    }
    else {
        const result = yield rule_model_1.Rule.create(Object.assign(Object.assign({}, payload), { type: 'terms' }));
        const message = "Terms And Condition Created Successfully";
        return { message, result };
    }
});
const getTermsAndConditionFromDB = () => __awaiter(void 0, void 0, void 0, function* () {
    const result = yield rule_model_1.Rule.findOne({ type: 'terms' });
    if (!result) {
        throw new ApiError_1.default(http_status_codes_1.StatusCodes.BAD_REQUEST, "Terms and conditions doesn't  exist!");
    }
    return result;
});
//privacy policy
const createAboutToDB = (payload) => __awaiter(void 0, void 0, void 0, function* () {
    const isExistAbout = yield rule_model_1.Rule.findOne({ type: 'about' });
    if (isExistAbout) {
        const result = yield rule_model_1.Rule.findOneAndUpdate({ type: 'about' }, { content: payload === null || payload === void 0 ? void 0 : payload.content }, { new: true });
        const message = "About Us Updated successfully";
        return { message, result };
    }
    else {
        const result = yield rule_model_1.Rule.create(Object.assign(Object.assign({}, payload), { type: 'about' }));
        const message = "About Us created successfully";
        return { message, result };
    }
});
const getAboutFromDB = () => __awaiter(void 0, void 0, void 0, function* () {
    const result = yield rule_model_1.Rule.findOne({ type: 'about' });
    if (!result) {
        throw new ApiError_1.default(http_status_codes_1.StatusCodes.BAD_REQUEST, "About doesn't exist!");
    }
    return result;
});
exports.RuleService = {
    createPrivacyPolicyToDB,
    getPrivacyPolicyFromDB,
    createTermsAndConditionToDB,
    getTermsAndConditionFromDB,
    createAboutToDB,
    getAboutFromDB
};
