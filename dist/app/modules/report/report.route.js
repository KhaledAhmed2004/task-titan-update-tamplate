"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.ReportRoutes = void 0;
const express_1 = __importDefault(require("express"));
const report_controller_1 = require("./report.controller");
const report_validation_1 = require("./report.validation");
const auth_1 = __importDefault(require("../../middlewares/auth"));
const user_1 = require("../../../enums/user");
const fileUploadHandler_1 = __importDefault(require("../../middlewares/fileUploadHandler"));
const router = express_1.default.Router();
// // Create a new report
// router.post(
//   '/',
//   auth(USER_ROLES.POSTER, USER_ROLES.TASKER, USER_ROLES.SUPER_ADMIN),
//   fileUploadHandler(), // Handle image uploads
//   (req: Request, res: Response, next: NextFunction) => {
//     if (req.body.data) {
//       // Parse and validate JSON data from form-data
//       req.body = JSON.parse(req.body.data);
//     }
//     return validateRequest(ReportValidation.createReportSchema)(req, res, () => {
//       ReportController.createReport(req, res, next);
//     });
//   }
// );
// Create a new report
router.post('/', (0, auth_1.default)(user_1.USER_ROLES.POSTER, user_1.USER_ROLES.TASKER, user_1.USER_ROLES.SUPER_ADMIN), (0, fileUploadHandler_1.default)(), // Handle image uploads
(req, res, next) => {
    if (req.body.data) {
        // Parse and validate JSON data from form-data
        req.body = report_validation_1.ReportValidation.createReportSchema.parse(JSON.parse(req.body.data));
    }
    return report_controller_1.ReportController.createReport(req, res, next);
});
// Get all reports with optional filters & pagination
router.get('/', (0, auth_1.default)(user_1.USER_ROLES.SUPER_ADMIN), 
// validateRequest(ReportValidation.getReportsSchema),
report_controller_1.ReportController.getAllReports);
// Get reports stats (separate API)
router.get('/stats', (0, auth_1.default)(user_1.USER_ROLES.SUPER_ADMIN), report_controller_1.ReportController.getReportStats);
// Get a single report by ID
router.get('/:reportId', (0, auth_1.default)(user_1.USER_ROLES.POSTER, user_1.USER_ROLES.TASKER, user_1.USER_ROLES.SUPER_ADMIN), report_controller_1.ReportController.getReportById);
// Update a report by ID
router.put('/:reportId', (0, auth_1.default)(user_1.USER_ROLES.POSTER, user_1.USER_ROLES.TASKER), 
// validateRequest(ReportValidation.updateReportSchema),
report_controller_1.ReportController.updateReport);
// Delete a report by ID
router.delete('/:reportId', (0, auth_1.default)(user_1.USER_ROLES.POSTER, user_1.USER_ROLES.TASKER), report_controller_1.ReportController.deleteReport);
// Resolve a report by ID
router.patch('/:reportId/resolve', (0, auth_1.default)(user_1.USER_ROLES.SUPER_ADMIN), // usually only admin can resolve
report_controller_1.ReportController.resolveReport);
exports.ReportRoutes = router;
