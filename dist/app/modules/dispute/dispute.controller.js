"use strict";
// import { Request, Response } from 'express';
// import { DisputeService } from './dispute.service';
// import { IDisputeCreate, DisputeStatusType } from './dispute.interface';
// import catchAsync from '../../../shared/catchAsync';
// import { JwtPayload } from 'jsonwebtoken';
// import sendResponse from '../../../shared/sendResponse';
// // Create a new dispute
// const createDispute = catchAsync(async (req: Request, res: Response) => {
//   const user = req.user as JwtPayload;
//   const userId = user.id;
//   const disputeData: IDisputeCreate = {
//     ...req.body,
//     posterId: req.body.type === 'poster_complaint' ? userId : req.body.posterId,
//     freelancerId:
//       req.body.type === 'freelancer_complaint' ? userId : req.body.freelancerId,
//   };
//   const dispute = await DisputeService.createDispute(disputeData);
//   sendResponse(res, {
//     success: true,
//     statusCode: 201,
//     message: 'Dispute created successfully',
//     data: dispute,
//   });
// });
// // Get dispute by ID
// const getDisputeById = catchAsync(async (req: Request, res: Response) => {
//   const { disputeId } = req.params;
//   const user = req.user as JwtPayload;
//   const userId = user.id;
//   const dispute = await DisputeService.getDisputeById(disputeId, userId);
//   if (!dispute) {
//     return sendResponse(res, {
//       success: false,
//       statusCode: 404,
//       message: 'Dispute not found',
//     });
//   }
//   sendResponse(res, {
//     success: true,
//     statusCode: 200,
//     data: dispute,
//   });
// });
// // Get user's disputes
// const getUserDisputes = catchAsync(async (req: Request, res: Response) => {
//   const user = req.user as JwtPayload;
//   const userId = user.id;
//   if (!userId) {
//     return sendResponse(res, {
//       success: false,
//       statusCode: 401,
//       message: 'Authentication required',
//     });
//   }
//   const { status } = req.query;
//   const disputes = await DisputeService.getDisputesByUser(
//     userId,
//     status as DisputeStatusType
//   );
//   sendResponse(res, {
//     success: true,
//     statusCode: 200,
//     data: disputes,
//   });
// });
// // Update dispute status (Admin only)
// const updateDisputeStatus = catchAsync(async (req: Request, res: Response) => {
//   const { disputeId } = req.params;
//   const { status } = req.body;
//   const user = req.user as JwtPayload;
//   const adminId = user.id;
//   const dispute = await DisputeService.updateDisputeStatus(
//     disputeId,
//     status,
//     adminId
//   );
//   sendResponse(res, {
//     success: true,
//     statusCode: 200,
//     message: 'Dispute status updated successfully',
//     data: dispute,
//   });
// });
// // Resolve dispute (Admin only)
// const resolveDispute = catchAsync(async (req: Request, res: Response) => {
//   const { disputeId } = req.params;
//   const { resolution, adminNotes, refundPercentage } = req.body;
//   const user = req.user as JwtPayload;
//   const adminId = user.id;
//   const dispute = await DisputeService.resolveDispute(
//     disputeId,
//     resolution,
//     adminId,
//     adminNotes,
//     refundPercentage
//   );
//   sendResponse(res, {
//     success: true,
//     statusCode: 200,
//     message: 'Dispute resolved successfully',
//     data: dispute,
//   });
// });
// // Get dispute statistics (Admin only)
// const getDisputeStats = catchAsync(async (req: Request, res: Response) => {
//   const stats = await DisputeService.getDisputeStats();
//   sendResponse(res, {
//     success: true,
//     statusCode: 200,
//     data: stats,
//   });
// });
// // Get all disputes (Admin only)
// const getAllDisputes = catchAsync(async (req: Request, res: Response) => {
//   const { status, page = 1, limit = 10 } = req.query;
//   const disputes = await DisputeService.getDisputesByUser(
//     '',
//     status as DisputeStatusType
//   );
//   sendResponse(res, {
//     success: true,
//     statusCode: 200,
//     data: disputes.slice(
//       (Number(page) - 1) * Number(limit),
//       Number(page) * Number(limit)
//     ),
//     pagination: {
//       page: Number(page),
//       limit: Number(limit),
//       totalPage: Math.ceil(disputes.length / Number(limit)),
//       total: disputes.length,
//     },
//   });
// });
// export const DisputeController = {
//   createDispute,
//   getDisputeById,
//   getUserDisputes,
//   updateDisputeStatus,
//   resolveDispute,
//   getDisputeStats,
//   getAllDisputes,
// };
