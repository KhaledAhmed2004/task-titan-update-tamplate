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
exports.DashboardService = void 0;
const ApiError_1 = __importDefault(require("../../../errors/ApiError"));
const payment_model_1 = require("../payment/payment.model");
const user_model_1 = require("../user/user.model");
const task_model_1 = require("../task/task.model");
const http_status_1 = __importDefault(require("http-status"));
const AggregationBuilder_1 = __importStar(require("../../builder/AggregationBuilder"));
const report_model_1 = require("../report/report.model");
const getDashboardStats = () => __awaiter(void 0, void 0, void 0, function* () {
    try {
        // 1st step: Validate models exist
        if (!user_model_1.User || !task_model_1.TaskModel || !payment_model_1.PaymentModel || !report_model_1.Report) {
            throw new ApiError_1.default(http_status_1.default.INTERNAL_SERVER_ERROR, 'Required models are not available');
        }
        // 2nd step: Use dynamic growth calculation for different models
        const [allUsersStats, postsStats, revenueStats, reportStats] = yield Promise.all([
            (0, AggregationBuilder_1.calculateGrowthDynamic)(user_model_1.User, { period: 'month' }),
            (0, AggregationBuilder_1.calculateGrowthDynamic)(task_model_1.TaskModel, { period: 'month' }),
            (0, AggregationBuilder_1.calculateGrowthDynamic)(payment_model_1.PaymentModel, {
                period: 'month',
                sumField: 'platformFee',
            }),
            (0, AggregationBuilder_1.calculateGrowthDynamic)(report_model_1.Report, { period: 'month' }),
        ]);
        // 3rd step: Pick only total, formattedGrowth & growthType
        const pickStats = (stats) => ({
            total: stats.total,
            formattedGrowth: stats.formattedGrowth,
            growthType: stats.growthType,
        });
        return {
            allUsers: pickStats(allUsersStats),
            posts: pickStats(postsStats),
            revenue: pickStats(revenueStats),
            reports: pickStats(reportStats),
        };
    }
    catch (error) {
        if (error instanceof ApiError_1.default) {
            throw error;
        }
        const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
        throw new ApiError_1.default(http_status_1.default.INTERNAL_SERVER_ERROR, `Failed to fetch dashboard statistics: ${errorMessage}`);
    }
});
const getMonthlyRevenue = () => __awaiter(void 0, void 0, void 0, function* () {
    const aggregationBuilder = new AggregationBuilder_1.default(payment_model_1.PaymentModel);
    // Monthly revenue
    const monthlyRevenue = yield aggregationBuilder.getTimeTrends({
        sumField: 'platformFee',
        timeUnit: 'month',
    });
    return monthlyRevenue;
});
exports.DashboardService = {
    getDashboardStats,
    getMonthlyRevenue,
};
