import { Request, Response } from 'express';
import { StatusCodes } from 'http-status-codes';
import catchAsync from '../../../shared/catchAsync';
import sendResponse from '../../../shared/sendResponse';
import { IReport } from './report.interface';
import { ReportService } from './report.service';
import { JwtPayload } from 'jsonwebtoken';
import {
  getMultipleFilesPath,
  getSingleFilePath,
} from '../../../shared/getFilePath';

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
const createReport = catchAsync(async (req: Request, res: Response) => {
  let images = getMultipleFilesPath(req.files, 'image');

  const payload = {
    ...req.body,
    images,
    reportedBy: (req.user as any).id,
  };

  const result = await ReportService.createReport(payload);

  sendResponse<IReport>(res, {
    success: true,
    statusCode: StatusCodes.CREATED,
    message: 'Report created successfully',
    data: result,
  });
});

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
const getAllReports = catchAsync(async (req: Request, res: Response) => {
  const result = await ReportService.getAllReports(req.query);

  sendResponse(res, {
    success: true,
    statusCode: StatusCodes.OK,
    message: 'Reports retrieved successfully',
    pagination: result.pagination,
    data: result.reports, // ✅ only reports here
  });
});

// Get report stats (separate API)
const getReportStats = catchAsync(async (req: Request, res: Response) => {
  const stats = await ReportService.getReportStats();

  sendResponse(res, {
    success: true,
    statusCode: StatusCodes.OK,
    message: 'Report stats retrieved successfully',
    data: stats,
  });
});

const getReportById = catchAsync(async (req: Request, res: Response) => {
  const { reportId } = req.params;
  const result = await ReportService.getReportById(reportId);

  if (!result) {
    return sendResponse(res, {
      success: false,
      statusCode: StatusCodes.NOT_FOUND,
      message: 'Report not found',
      data: null,
    });
  }

  sendResponse<IReport>(res, {
    success: true,
    statusCode: StatusCodes.OK,
    message: 'Report retrieved successfully',
    data: result,
  });
});

// Update a report by ID
const updateReport = catchAsync(async (req: Request, res: Response) => {
  const { reportId } = req.params;
  const result = await ReportService.updateReport(reportId, req.body);

  if (!result) {
    return sendResponse(res, {
      success: false,
      statusCode: StatusCodes.NOT_FOUND,
      message: 'Report not found',
      data: null,
    });
  }

  sendResponse<IReport>(res, {
    success: true,
    statusCode: StatusCodes.OK,
    message: 'Report updated successfully',
    data: result,
  });
});

// Delete a report by ID
const deleteReport = catchAsync(async (req: Request, res: Response) => {
  const { reportId } = req.params;
  const result = await ReportService.deleteReport(reportId);

  if (!result) {
    return sendResponse(res, {
      success: false,
      statusCode: StatusCodes.NOT_FOUND,
      message: 'Report not found',
      data: null,
    });
  }

  sendResponse<null>(res, {
    success: true,
    statusCode: StatusCodes.OK,
    message: 'Report deleted successfully',
    data: null,
  });
});

// Resolve a report
const resolveReport = catchAsync(async (req: Request, res: Response) => {
  const { reportId } = req.params;
  const result = await ReportService.resolveReport(reportId);

  if (!result) {
    return sendResponse(res, {
      success: false,
      statusCode: StatusCodes.NOT_FOUND,
      message: 'Report not found',
      data: null,
    });
  }

  sendResponse<IReport>(res, {
    success: true,
    statusCode: StatusCodes.OK,
    message: 'Report resolved successfully',
    data: result,
  });
});

export const ReportController = {
  createReport,
  getAllReports,
  getReportById,
  updateReport,
  deleteReport,
  resolveReport,
  getReportStats,
};
