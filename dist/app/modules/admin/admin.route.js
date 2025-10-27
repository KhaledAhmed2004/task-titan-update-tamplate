"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.DashboardRoutes = void 0;
const express_1 = require("express");
const admin_controller_1 = require("./admin.controller");
const auth_1 = __importDefault(require("../../middlewares/auth"));
const user_1 = require("../../../enums/user");
const validateRequest_1 = __importDefault(require("../../middlewares/validateRequest"));
const admin_validation_1 = require("./admin.validation");
const router = (0, express_1.Router)();
// Get dashboard statistics
router.get('/stats', (0, auth_1.default)(user_1.USER_ROLES.SUPER_ADMIN), (0, validateRequest_1.default)(admin_validation_1.AdminValidation.getDashboardStatsSchema), admin_controller_1.DashboardController.getDashboardStats);
router.get('/revenue/monthly', (0, auth_1.default)(user_1.USER_ROLES.SUPER_ADMIN), admin_controller_1.DashboardController.getMonthlyRevenue);
exports.DashboardRoutes = router;
