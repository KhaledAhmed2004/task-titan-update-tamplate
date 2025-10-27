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
exports.ReportService = void 0;
const report_model_1 = require("./report.model");
const report_interface_1 = require("./report.interface");
const QueryBuilder_1 = __importDefault(require("../../builder/QueryBuilder"));
const AggregationBuilder_1 = __importDefault(require("../../builder/AggregationBuilder"));
// Create a new report
const createReport = (payload) => __awaiter(void 0, void 0, void 0, function* () {
    const report = yield report_model_1.Report.create(payload);
    return report;
});
// const getAllReports = async (query: IQueryReports) => {
//   // ✅ Query builder for search, filter, pagination
//   const reportQuery = new QueryBuilder(
//     Report.find(),
//     query as Record<string, unknown>
//   )
//     .search(['title', 'description'])
//     .filter()
//     .sort()
//     .paginate()
//     .fields()
//     .populate(['reportedBy'], { reportedBy: 'name email role' });
//   const reports = await reportQuery.modelQuery;
//   const paginationInfo = await reportQuery.getPaginationInfo();
//   // ✅ Total counts
//   const totalReports = await Report.countDocuments();
//   const totalPending = await Report.countDocuments({
//     status: REPORT_STATUS.PENDING,
//   });
//   const totalReviewed = await Report.countDocuments({
//     status: REPORT_STATUS.REVIEWED,
//   });
//   const totalResolved = await Report.countDocuments({
//     status: REPORT_STATUS.RESOLVED,
//   });
//   // ✅ Function to calculate monthly growth for a given filter
//   const calculateMonthlyGrowth = async (
//     filter: Record<string, unknown> = {}
//   ) => {
//     const now = new Date();
//     const startOfThisMonth = new Date(now.getFullYear(), now.getMonth(), 1);
//     const startOfLastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
//     const endOfLastMonth = new Date(now.getFullYear(), now.getMonth(), 0);
//     const thisMonthCount = await Report.countDocuments({
//       ...filter,
//       createdAt: { $gte: startOfThisMonth },
//     });
//     const lastMonthCount = await Report.countDocuments({
//       ...filter,
//       createdAt: { $gte: startOfLastMonth, $lte: endOfLastMonth },
//     });
//     let monthlyGrowth = 0;
//     let growthType: 'increase' | 'decrease' | 'no_change' = 'no_change';
//     if (lastMonthCount > 0) {
//       monthlyGrowth =
//         ((thisMonthCount - lastMonthCount) / lastMonthCount) * 100;
//       growthType =
//         monthlyGrowth > 0
//           ? 'increase'
//           : monthlyGrowth < 0
//           ? 'decrease'
//           : 'no_change';
//     } else if (thisMonthCount > 0 && lastMonthCount === 0) {
//       monthlyGrowth = 100;
//       growthType = 'increase';
//     }
//     const formattedGrowth =
//       (monthlyGrowth > 0 ? '+' : '') + monthlyGrowth.toFixed(2) + '%';
//     return {
//       thisMonthCount,
//       lastMonthCount,
//       monthlyGrowth: Math.abs(monthlyGrowth),
//       formattedGrowth,
//       growthType,
//     };
//   };
//   // ✅ Calculate stats for all reports and by status
//   const allReportStats = await calculateMonthlyGrowth();
//   const pendingStats = await calculateMonthlyGrowth({
//     status: REPORT_STATUS.PENDING,
//   });
//   const reviewedStats = await calculateMonthlyGrowth({
//     status: REPORT_STATUS.REVIEWED,
//   });
//   const resolvedStats = await calculateMonthlyGrowth({
//     status: REPORT_STATUS.RESOLVED,
//   });
//   return {
//     pagination: paginationInfo,
//     data: {
//       stats: {
//         allReports: { total: totalReports, ...allReportStats },
//         pending: { total: totalPending, ...pendingStats },
//         reviewed: { total: totalReviewed, ...reviewedStats },
//         resolved: { total: totalResolved, ...resolvedStats },
//       },
//       reports,
//     },
//   };
// };
// Get a single report by ID
// Get all reports (without stats)
const getAllReports = (query) => __awaiter(void 0, void 0, void 0, function* () {
    const reportQuery = new QueryBuilder_1.default(report_model_1.Report.find(), query)
        .search(['title', 'description'])
        .filter()
        .sort()
        .paginate()
        .fields()
        .populate(['reportedBy'], { reportedBy: 'name email role' });
    const reports = yield reportQuery.modelQuery;
    const paginationInfo = yield reportQuery.getPaginationInfo();
    return {
        pagination: paginationInfo,
        reports,
    };
});
// Get only stats
// const getReportStats = async () => {
//   const totalReports = await Report.countDocuments();
//   const totalPending = await Report.countDocuments({
//     status: REPORT_STATUS.PENDING,
//   });
//   const totalReviewed = await Report.countDocuments({
//     status: REPORT_STATUS.REVIEWED,
//   });
//   const totalResolved = await Report.countDocuments({
//     status: REPORT_STATUS.RESOLVED,
//   });
//   const calculateMonthlyGrowth = async (
//     filter: Record<string, unknown> = {}
//   ) => {
//     const now = new Date();
//     const startOfThisMonth = new Date(now.getFullYear(), now.getMonth(), 1);
//     const startOfLastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
//     const endOfLastMonth = new Date(now.getFullYear(), now.getMonth(), 0);
//     const thisMonthCount = await Report.countDocuments({
//       ...filter,
//       createdAt: { $gte: startOfThisMonth },
//     });
//     const lastMonthCount = await Report.countDocuments({
//       ...filter,
//       createdAt: { $gte: startOfLastMonth, $lte: endOfLastMonth },
//     });
//     let monthlyGrowth = 0;
//     let growthType: 'increase' | 'decrease' | 'no_change' = 'no_change';
//     if (lastMonthCount > 0) {
//       monthlyGrowth =
//         ((thisMonthCount - lastMonthCount) / lastMonthCount) * 100;
//       growthType =
//         monthlyGrowth > 0
//           ? 'increase'
//           : monthlyGrowth < 0
//           ? 'decrease'
//           : 'no_change';
//     } else if (thisMonthCount > 0 && lastMonthCount === 0) {
//       monthlyGrowth = 100;
//       growthType = 'increase';
//     }
//     const formattedGrowth =
//       (monthlyGrowth > 0 ? '+' : '') + monthlyGrowth.toFixed(2) + '%';
//     return {
//       thisMonthCount,
//       lastMonthCount,
//       monthlyGrowth: Math.abs(monthlyGrowth),
//       formattedGrowth,
//       growthType,
//     };
//   };
//   const allReportStats = await calculateMonthlyGrowth();
//   const pendingStats = await calculateMonthlyGrowth({
//     status: REPORT_STATUS.PENDING,
//   });
//   const reviewedStats = await calculateMonthlyGrowth({
//     status: REPORT_STATUS.REVIEWED,
//   });
//   const resolvedStats = await calculateMonthlyGrowth({
//     status: REPORT_STATUS.RESOLVED,
//   });
//   return {
//     allReports: { total: totalReports, ...allReportStats },
//     pending: { total: totalPending, ...pendingStats },
//     reviewed: { total: totalReviewed, ...reviewedStats },
//     resolved: { total: totalResolved, ...resolvedStats },
//   };
// };
const getReportStats = () => __awaiter(void 0, void 0, void 0, function* () {
    const builder = new AggregationBuilder_1.default(report_model_1.Report);
    const allReports = yield builder.calculateGrowth({ period: 'month' });
    const pending = yield builder.calculateGrowth({
        filter: { status: report_interface_1.REPORT_STATUS.PENDING },
        period: 'month',
    });
    const reviewed = yield builder.calculateGrowth({
        filter: { status: report_interface_1.REPORT_STATUS.REVIEWED },
        period: 'month',
    });
    const resolved = yield builder.calculateGrowth({
        filter: { status: report_interface_1.REPORT_STATUS.RESOLVED },
        period: 'month',
    });
    return {
        allReports,
        pending,
        reviewed,
        resolved,
    };
});
const getReportById = (reportId) => __awaiter(void 0, void 0, void 0, function* () {
    const report = yield report_model_1.Report.findById(reportId).populate('reportedBy', 'name email role');
    return report;
});
// Update a report
const updateReport = (reportId, payload) => __awaiter(void 0, void 0, void 0, function* () {
    const updatedReport = yield report_model_1.Report.findByIdAndUpdate(reportId, payload, {
        new: true,
        runValidators: true,
    });
    return updatedReport;
});
// Delete a report
const deleteReport = (reportId) => __awaiter(void 0, void 0, void 0, function* () {
    const deletedReport = yield report_model_1.Report.findByIdAndDelete(reportId);
    return deletedReport;
});
// Resolve a report
const resolveReport = (reportId) => __awaiter(void 0, void 0, void 0, function* () {
    const resolvedReport = yield report_model_1.Report.findByIdAndUpdate(reportId, { status: report_interface_1.REPORT_STATUS.RESOLVED }, { new: true, runValidators: true });
    return resolvedReport;
});
exports.ReportService = {
    createReport,
    getAllReports,
    getReportById,
    updateReport,
    deleteReport,
    resolveReport,
    getReportStats,
};
