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
exports.ReportController = void 0;
const http_status_codes_1 = require("http-status-codes");
const catchAsync_1 = __importDefault(require("../../../shared/catchAsync"));
const sendResponse_1 = __importDefault(require("../../../shared/sendResponse"));
const report_service_1 = require("./report.service");
const getFilePath_1 = require("../../../shared/getFilePath");
// // Create a new report
// const createReport = catchAsync(async (req: Request, res: Response) => {
//   const payload = {
//     ...req.body,
//     reportedBy: (req?.user as JwtPayload).id, // fill from auth middleware
//     // reportedBy: (req.user as { id: string }).id,
//   };
//   const result = await ReportService.createReport(payload);
//   sendResponse<IReport>(res, {
//     success: true,
//     statusCode: StatusCodes.CREATED,
//     message: 'Report created successfully',
//     data: result,
//   });
// });
// Create a new report
const createReport = (0, catchAsync_1.default)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    let images = (0, getFilePath_1.getMultipleFilesPath)(req.files, 'image');
    const payload = Object.assign(Object.assign({}, req.body), { images, reportedBy: req.user.id });
    const result = yield report_service_1.ReportService.createReport(payload);
    (0, sendResponse_1.default)(res, {
        success: true,
        statusCode: http_status_codes_1.StatusCodes.CREATED,
        message: 'Report created successfully',
        data: result,
    });
}));
// const getAllReports = catchAsync(async (req: Request, res: Response) => {
//   const result = await ReportService.getAllReports(req.query);
//   sendResponse(res, {
//     success: true,
//     statusCode: StatusCodes.OK,
//     message: 'Reports retrieved successfully',
//     pagination: result.pagination,
//     data: result.data, // contains { stats, reports }
//   });
// });
// Get a single report by ID
// Get all reports (without stats)
const getAllReports = (0, catchAsync_1.default)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const result = yield report_service_1.ReportService.getAllReports(req.query);
    (0, sendResponse_1.default)(res, {
        success: true,
        statusCode: http_status_codes_1.StatusCodes.OK,
        message: 'Reports retrieved successfully',
        pagination: result.pagination,
        data: result.reports, // ✅ only reports here
    });
}));
// Get report stats (separate API)
const getReportStats = (0, catchAsync_1.default)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const stats = yield report_service_1.ReportService.getReportStats();
    (0, sendResponse_1.default)(res, {
        success: true,
        statusCode: http_status_codes_1.StatusCodes.OK,
        message: 'Report stats retrieved successfully',
        data: stats,
    });
}));
const getReportById = (0, catchAsync_1.default)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { reportId } = req.params;
    const result = yield report_service_1.ReportService.getReportById(reportId);
    if (!result) {
        return (0, sendResponse_1.default)(res, {
            success: false,
            statusCode: http_status_codes_1.StatusCodes.NOT_FOUND,
            message: 'Report not found',
            data: null,
        });
    }
    (0, sendResponse_1.default)(res, {
        success: true,
        statusCode: http_status_codes_1.StatusCodes.OK,
        message: 'Report retrieved successfully',
        data: result,
    });
}));
// Update a report by ID
const updateReport = (0, catchAsync_1.default)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { reportId } = req.params;
    const result = yield report_service_1.ReportService.updateReport(reportId, req.body);
    if (!result) {
        return (0, sendResponse_1.default)(res, {
            success: false,
            statusCode: http_status_codes_1.StatusCodes.NOT_FOUND,
            message: 'Report not found',
            data: null,
        });
    }
    (0, sendResponse_1.default)(res, {
        success: true,
        statusCode: http_status_codes_1.StatusCodes.OK,
        message: 'Report updated successfully',
        data: result,
    });
}));
// Delete a report by ID
const deleteReport = (0, catchAsync_1.default)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { reportId } = req.params;
    const result = yield report_service_1.ReportService.deleteReport(reportId);
    if (!result) {
        return (0, sendResponse_1.default)(res, {
            success: false,
            statusCode: http_status_codes_1.StatusCodes.NOT_FOUND,
            message: 'Report not found',
            data: null,
        });
    }
    (0, sendResponse_1.default)(res, {
        success: true,
        statusCode: http_status_codes_1.StatusCodes.OK,
        message: 'Report deleted successfully',
        data: null,
    });
}));
// Resolve a report
const resolveReport = (0, catchAsync_1.default)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { reportId } = req.params;
    const result = yield report_service_1.ReportService.resolveReport(reportId);
    if (!result) {
        return (0, sendResponse_1.default)(res, {
            success: false,
            statusCode: http_status_codes_1.StatusCodes.NOT_FOUND,
            message: 'Report not found',
            data: null,
        });
    }
    (0, sendResponse_1.default)(res, {
        success: true,
        statusCode: http_status_codes_1.StatusCodes.OK,
        message: 'Report resolved successfully',
        data: result,
    });
}));
exports.ReportController = {
    createReport,
    getAllReports,
    getReportById,
    updateReport,
    deleteReport,
    resolveReport,
    getReportStats,
};
