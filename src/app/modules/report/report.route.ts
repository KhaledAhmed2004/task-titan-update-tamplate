import express, { NextFunction, Request, Response } from 'express';
import validateRequest from '../../middlewares/validateRequest';
import { ReportController } from './report.controller';
import { ReportValidation } from './report.validation';
import auth from '../../middlewares/auth';
import { USER_ROLES } from '../../../enums/user';
import fileUploadHandler from '../../middlewares/fileUploadHandler';

const router = express.Router();

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
router.post(
  '/',
  auth(USER_ROLES.POSTER, USER_ROLES.TASKER, USER_ROLES.SUPER_ADMIN),
  fileUploadHandler(), // Handle image uploads
  (req: Request, res: Response, next: NextFunction) => {
    if (req.body.data) {
      // Parse and validate JSON data from form-data
      req.body = ReportValidation.createReportSchema.parse(JSON.parse(req.body.data));
    }
    return ReportController.createReport(req, res, next);
  }
);

// Get all reports with optional filters & pagination
router.get(
  '/',
  auth(USER_ROLES.SUPER_ADMIN),
  // validateRequest(ReportValidation.getReportsSchema),
  ReportController.getAllReports
);

// Get reports stats (separate API)
router.get(
  '/stats',
  auth(USER_ROLES.SUPER_ADMIN),
  ReportController.getReportStats
);

// Get a single report by ID
router.get(
  '/:reportId',
  auth(USER_ROLES.POSTER, USER_ROLES.TASKER, USER_ROLES.SUPER_ADMIN),
  ReportController.getReportById
);

// Update a report by ID
router.put(
  '/:reportId',
  auth(USER_ROLES.POSTER, USER_ROLES.TASKER),
  // validateRequest(ReportValidation.updateReportSchema),
  ReportController.updateReport
);

// Delete a report by ID
router.delete(
  '/:reportId',
  auth(USER_ROLES.POSTER, USER_ROLES.TASKER),
  ReportController.deleteReport
);
// Resolve a report by ID
router.patch(
  '/:reportId/resolve',
  auth(USER_ROLES.SUPER_ADMIN), // usually only admin can resolve
  ReportController.resolveReport
);

export const ReportRoutes = router;
