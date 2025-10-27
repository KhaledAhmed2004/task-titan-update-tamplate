"use strict";
// import { Types } from 'mongoose';
// import { NotificationService } from '../notification/notification.service';
// import {
//   IDispute,
//   IDisputeCreate,
//   DisputeStatus,
//   DisputeResolution,
//   DisputeStatusType,
//   DisputeResolutionType,
// } from './dispute.interface';
// import { TaskModel } from '../task/task.model';
// import { DisputeModel } from './dispute.model';
// // Create a new dispute
// const createDispute = async (
//   disputeData: IDisputeCreate
// ): Promise<IDispute> => {
//   try {
//     const task = await TaskModel.findById(disputeData.taskId);
//     if (!task) throw new Error('Task not found');
//     const existingDispute = await DisputeModel.findOne({
//       taskId: disputeData.taskId,
//       status: { $in: [DisputeStatus.OPEN, DisputeStatus.UNDER_REVIEW] },
//     });
//     if (existingDispute)
//       throw new Error('An active dispute already exists for this task');
//     const dispute = new DisputeModel({
//       ...disputeData,
//       status: DisputeStatus.OPEN,
//       createdAt: new Date(),
//       updatedAt: new Date(),
//     });
//     await dispute.save();
//     await TaskModel.findByIdAndUpdate(disputeData.taskId, { status: 'disputed' });
//     await sendDisputeNotifications(dispute, 'created');
//     return dispute;
//   } catch (error: any) {
//     throw new Error(`Failed to create dispute: ${error.message}`);
//   }
// };
// // Get dispute by ID
// const getDisputeById = async (
//   disputeId: string,
//   userId?: string
// ): Promise<IDispute | null> => {
//   try {
//     const query: any = { _id: disputeId };
//     if (userId) {
//       query.$or = [{ posterId: userId }, { freelancerId: userId }];
//     }
//     const dispute = await DisputeModel.findOne(query)
//       .populate('taskId', 'title description taskBudget')
//       .populate('posterId', 'firstName lastName email')
//       .populate('freelancerId', 'firstName lastName email');
//     return dispute;
//   } catch (error: any) {
//     throw new Error(`Failed to get dispute: ${error.message}`);
//   }
// };
// // Get disputes by user
// const getUserDisputes = async (
//   userId: string,
//   status?: DisputeStatusType
// ): Promise<IDispute[]> => {
//   try {
//     const query: any = {
//       $or: [{ posterId: userId }, { freelancerId: userId }],
//     };
//     if (status) query.status = status;
//     const disputes = await DisputeModel.find(query)
//       .populate('taskId', 'title description taskBudget')
//       .populate('posterId', 'firstName lastName email')
//       .populate('freelancerId', 'firstName lastName email')
//       .sort({ createdAt: -1 });
//     return disputes;
//   } catch (error: any) {
//     throw new Error(`Failed to get user disputes: ${error.message}`);
//   }
// };
// // Get disputes by task
// const getTaskDisputes = async (taskId: string): Promise<IDispute[]> => {
//   try {
//     const disputes = await DisputeModel.find({ taskId })
//       .populate('posterId', 'firstName lastName email')
//       .populate('freelancerId', 'firstName lastName email')
//       .sort({ createdAt: -1 });
//     return disputes;
//   } catch (error: any) {
//     throw new Error(`Failed to get task disputes: ${error.message}`);
//   }
// };
// // Add evidence to dispute
// const addEvidence = async (
//   disputeId: string,
//   userId: string,
//   evidence: any
// ): Promise<IDispute> => {
//   try {
//     const dispute = await DisputeModel.findById(disputeId);
//     if (!dispute) throw new Error('Dispute not found');
//     if (
//       dispute.posterId.toString() !== userId &&
//       dispute.freelancerId.toString() !== userId
//     ) {
//       throw new Error('Unauthorized to add evidence to this dispute');
//     }
//     dispute.evidence.push({
//       ...evidence,
//       submittedBy: new Types.ObjectId(userId),
//       submittedAt: new Date(),
//     });
//     dispute.updatedAt = new Date();
//     await dispute.save();
//     await sendDisputeNotifications(dispute, 'evidence_added');
//     return dispute;
//   } catch (error: any) {
//     throw new Error(`Failed to add evidence: ${error.message}`);
//   }
// };
// // Update dispute status (Admin only)
// const updateDisputeStatus = async (
//   disputeId: string,
//   status: DisputeStatusType,
//   adminId: string
// ): Promise<IDispute> => {
//   try {
//     const dispute = await DisputeModel.findById(disputeId);
//     if (!dispute) throw new Error('Dispute not found');
//     dispute.status = status;
//     dispute.updatedAt = new Date();
//     if (status === DisputeStatus.UNDER_REVIEW) {
//       dispute.reviewStartedAt = new Date();
//       dispute.reviewedBy = new Types.ObjectId(adminId);
//     }
//     await dispute.save();
//     await sendDisputeNotifications(dispute, 'status_updated');
//     return dispute;
//   } catch (error: any) {
//     throw new Error(`Failed to update dispute status: ${error.message}`);
//   }
// };
// // Resolve dispute (Admin only)
// const resolveDispute = async (
//   disputeId: string,
//   resolution: DisputeResolutionType,
//   adminId: string,
//   adminNotes?: string,
//   refundPercentage?: number
// ): Promise<IDispute> => {
//   try {
//     const dispute = await DisputeModel.findById(disputeId).populate('taskId');
//     if (!dispute) throw new Error('Dispute not found');
//     if (dispute.status === DisputeStatus.RESOLVED)
//       throw new Error('Dispute already resolved');
//     dispute.status = DisputeStatus.RESOLVED;
//     dispute.resolution = {
//       decision: resolution,
//       resolvedBy: new Types.ObjectId(adminId),
//       resolvedAt: new Date(),
//       adminNotes: adminNotes || '',
//       refundPercentage: refundPercentage || 0,
//     };
//     dispute.updatedAt = new Date();
//     await dispute.save();
//     await handleDisputePayment(dispute, resolution, refundPercentage);
//     await TaskModel.findByIdAndUpdate(dispute.taskId, {
//       status:
//         resolution === DisputeResolution.RELEASE_TO_FREELANCER
//           ? 'completed'
//           : 'cancelled',
//     });
//     await sendDisputeNotifications(dispute, 'resolved');
//     return dispute;
//   } catch (error: any) {
//     throw new Error(`Failed to resolve dispute: ${error.message}`);
//   }
// };
// // Handle payment based on dispute resolution
// const handleDisputePayment = async (
//   dispute: IDispute,
//   resolution: DisputeResolution,
//   refundPercentage?: number
// ) => {
//   try {
//     const task = dispute.taskId as any;
//     switch (resolution) {
//       case DisputeResolution.FULL_REFUND:
//         await PaymentService.refundEscrowPayment(
//           task.paymentIntentId,
//           dispute.posterId.toString()
//         );
//         break;
//       case DisputeResolution.RELEASE_TO_FREELANCER:
//         await PaymentService.releaseEscrowPayment(
//           task.paymentIntentId,
//           dispute.freelancerId.toString()
//         );
//         break;
//       case DisputeResolution.PARTIAL_REFUND:
//         if (
//           refundPercentage &&
//           refundPercentage > 0 &&
//           refundPercentage < 100
//         ) {
//           // TODO: Implement partial refund logic
//           await PaymentService.refundEscrowPayment(
//             task.paymentIntentId,
//             dispute.posterId.toString()
//           );
//         }
//         break;
//       default:
//         throw new Error('Invalid dispute resolution');
//     }
//   } catch (error: any) {
//     throw new Error(`Failed to handle dispute payment: ${error.message}`);
//   }
// };
// // Send dispute notifications
// const sendDisputeNotifications = async (dispute: IDispute, action: string) => {
//   try {
//     const task = dispute.taskId as any;
//     switch (action) {
//       case 'created':
//         await NotificationService.createNotification({
//           userId: dispute.posterId.toString(),
//           title: 'Dispute Created',
//           message: `A dispute has been created for task: ${task.title}`,
//           type: 'dispute',
//           relatedId: dispute._id.toString(),
//         });
//         await NotificationService.createNotification({
//           userId: dispute.freelancerId.toString(),
//           title: 'Dispute Created',
//           message: `A dispute has been created for task: ${task.title}`,
//           type: 'dispute',
//           relatedId: dispute._id.toString(),
//         });
//         break;
//       case 'evidence_added':
//         const lastEvidence = dispute.evidence[dispute.evidence.length - 1];
//         const otherPartyId =
//           dispute.posterId.toString() === lastEvidence.submittedBy.toString()
//             ? dispute.freelancerId.toString()
//             : dispute.posterId.toString();
//         await NotificationService.createNotification({
//           userId: otherPartyId,
//           title: 'New Evidence Added',
//           message: `New evidence has been added to the dispute for task: ${task.title}`,
//           type: 'dispute',
//           relatedId: dispute._id.toString(),
//         });
//         break;
//       case 'resolved':
//         await NotificationService.createNotification({
//           userId: dispute.posterId.toString(),
//           title: 'Dispute Resolved',
//           message: `The dispute for task "${task.title}" has been resolved`,
//           type: 'dispute',
//           relatedId: dispute._id.toString(),
//         });
//         await NotificationService.createNotification({
//           userId: dispute.freelancerId.toString(),
//           title: 'Dispute Resolved',
//           message: `The dispute for task "${task.title}" has been resolved`,
//           type: 'dispute',
//           relatedId: dispute._id.toString(),
//         });
//         break;
//     }
//   } catch (error) {
//     console.error('Failed to send dispute notifications:', error);
//   }
// };
// // Get dispute statistics
// const getDisputeStats = async () => {
//   try {
//     const stats = await DisputeModel.aggregate([
//       { $group: { _id: '$status', count: { $sum: 1 } } },
//     ]);
//     const totalDisputes = await DisputeModel.countDocuments();
//     const resolvedDisputes = await DisputeModel.countDocuments({
//       status: DisputeStatus.RESOLVED,
//     });
//     const avgResolutionTime = await DisputeModel.aggregate([
//       {
//         $match: {
//           status: DisputeStatus.RESOLVED,
//           'resolution.resolvedAt': { $exists: true },
//         },
//       },
//       {
//         $project: {
//           resolutionTime: {
//             $subtract: ['$resolution.resolvedAt', '$createdAt'],
//           },
//         },
//       },
//       { $group: { _id: null, avgTime: { $avg: '$resolutionTime' } } },
//     ]);
//     return {
//       totalDisputes,
//       resolvedDisputes,
//       resolutionRate:
//         totalDisputes > 0 ? (resolvedDisputes / totalDisputes) * 100 : 0,
//       avgResolutionTimeHours:
//         avgResolutionTime.length > 0
//           ? avgResolutionTime[0].avgTime / (1000 * 60 * 60)
//           : 0,
//       statusBreakdown: stats,
//     };
//   } catch (error: any) {
//     throw new Error(`Failed to get dispute stats: ${error.message}`);
//   }
// };
// export const DisputeService = {
//   createDispute,
//   getDisputeById,
//   getUserDisputes,
//   getTaskDisputes,
//   addEvidence,
//   updateDisputeStatus,
//   resolveDispute,
//   getDisputeStats,
// };
