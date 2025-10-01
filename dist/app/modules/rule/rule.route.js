"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.RuleRoutes = void 0;
const express_1 = __importDefault(require("express"));
const user_1 = require("../../../enums/user");
const auth_1 = __importDefault(require("../../middlewares/auth"));
const rule_controller_1 = require("./rule.controller");
const router = express_1.default.Router();
//about us
router
    .route('/about')
    .post((0, auth_1.default)(user_1.USER_ROLES.SUPER_ADMIN), rule_controller_1.RuleController.createAbout)
    .get(rule_controller_1.RuleController.getAbout);
//privacy policy
router
    .route('/privacy-policy')
    .post((0, auth_1.default)(user_1.USER_ROLES.SUPER_ADMIN), rule_controller_1.RuleController.createPrivacyPolicy)
    .get(rule_controller_1.RuleController.getPrivacyPolicy);
//terms and conditions
router
    .route('/terms-and-conditions')
    .post((0, auth_1.default)(user_1.USER_ROLES.SUPER_ADMIN), rule_controller_1.RuleController.createTermsAndCondition)
    .get(rule_controller_1.RuleController.getTermsAndCondition);
exports.RuleRoutes = router;
