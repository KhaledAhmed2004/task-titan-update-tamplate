"use strict";
// import { Schema, model, Types } from 'mongoose';
// import {
//   IDispute,
//   DisputeStatus,
//   DisputeType,
//   DisputeResolution,
//   DisputePriority,
// } from './dispute.interface';
// const DisputeEvidenceSchema = new Schema<IDisputeEvidence>(
//   {
//     type: {
//       type: String,
//       enum: ['file', 'image', 'text', 'link'],
//       required: true,
//     },
//     content: {
//       type: String,
//       required: true,
//       trim: true,
//     },
//     description: {
//       type: String,
//       trim: true,
//       maxlength: 500,
//     },
//     uploadedBy: {
//       type: Schema.Types.ObjectId,
//       ref: 'User',
//       required: true,
//     },
//     uploadedAt: {
//       type: Date,
//       default: Date.now,
//     },
//   },
//   {
//     _id: true,
//     versionKey: false,
//   }
// );
// const DisputeSchema = new Schema<IDispute>(
//   {
//     taskId: {
//       type: Schema.Types.ObjectId,
//       ref: 'Task',
//       required: true,
//       index: true,
//     },
//     posterId: {
//       type: Schema.Types.ObjectId,
//       ref: 'User',
//       required: true,
//       index: true,
//     },
//     freelancerId: {
//       type: Schema.Types.ObjectId,
//       ref: 'User',
//       required: true,
//       index: true,
//     },
//     bidId: {
//       type: Schema.Types.ObjectId,
//       ref: 'Bid',
//       required: true,
//       index: true,
//     },
//     deliveryId: {
//       type: Schema.Types.ObjectId,
//       ref: 'Delivery',
//       index: true,
//     },
//     paymentId: {
//       type: Schema.Types.ObjectId,
//       ref: 'Payment',
//       index: true,
//     },
//     type: {
//       type: String,
//       enum: Object.values(DisputeType),
//       required: true,
//       index: true,
//     },
//     status: {
//       type: String,
//       enum: Object.values(DisputeStatus),
//       default: DisputeStatus.OPEN,
//       index: true,
//     },
//     priority: {
//       type: String,
//       enum: Object.values(DisputePriority),
//       default: DisputePriority.MEDIUM,
//       index: true,
//     },
//     title: {
//       type: String,
//       required: true,
//       trim: true,
//       maxlength: 200,
//     },
//     description: {
//       type: String,
//       required: true,
//       trim: true,
//       maxlength: 2000,
//     },
//     posterClaim: {
//       type: String,
//       required: true,
//       trim: true,
//       maxlength: 2000,
//     },
//     freelancerResponse: {
//       type: String,
//       trim: true,
//       maxlength: 2000,
//     },
//     adminNotes: {
//       type: String,
//       trim: true,
//       maxlength: 2000,
//     },
//     evidence: {
//       type: [DisputeEvidenceSchema],
//       default: [],
//       validate: {
//         validator: function (evidence: IDisputeEvidence[]) {
//           return evidence.length <= 20; // Max 20 pieces of evidence
//         },
//         message: 'Maximum 20 pieces of evidence allowed per dispute',
//       },
//     },
//     resolution: {
//       type: String,
//       enum: Object.values(DisputeResolution),
//     },
//     resolutionDetails: {
//       type: String,
//       trim: true,
//       maxlength: 1000,
//     },
//     refundAmount: {
//       type: Number,
//       min: 0,
//     },
//     releaseAmount: {
//       type: Number,
//       min: 0,
//     },
//     platformFee: {
//       type: Number,
//       min: 0,
//       default: 0,
//     },
//     resolvedBy: {
//       type: Schema.Types.ObjectId,
//       ref: 'User',
//     },
//     resolvedAt: {
//       type: Date,
//     },
//   },
//   {
//     timestamps: true,
//     versionKey: false,
//   }
// );
// // Indexes for better query performance
// DisputeSchema.index({ taskId: 1, status: 1 });
// DisputeSchema.index({ posterId: 1, status: 1 });
// DisputeSchema.index({ freelancerId: 1, status: 1 });
// DisputeSchema.index({ type: 1, status: 1 });
// DisputeSchema.index({ priority: 1, status: 1 });
// DisputeSchema.index({ createdAt: -1 });
// DisputeSchema.index({ resolvedAt: -1 });
// // Compound index for admin dashboard
// DisputeSchema.index({ status: 1, priority: 1, createdAt: -1 });
// // Static methods
// DisputeSchema.statics.findByTaskId = function (taskId: string) {
//   return this.findOne({ taskId: new Types.ObjectId(taskId) })
//     .populate('posterId', 'firstName lastName email')
//     .populate('freelancerId', 'firstName lastName email')
//     .populate('taskId', 'title description taskBudget')
//     .populate('bidId', 'amount message')
//     .populate('deliveryId', 'title description status')
//     .populate('resolvedBy', 'firstName lastName email');
// };
// DisputeSchema.statics.findByUser = function (
//   userId: string,
//   role: 'poster' | 'freelancer',
//   page: number = 1,
//   limit: number = 10
// ) {
//   const skip = (page - 1) * limit;
//   const query =
//     role === 'poster'
//       ? { posterId: new Types.ObjectId(userId) }
//       : { freelancerId: new Types.ObjectId(userId) };
//   return this.find(query)
//     .populate('posterId', 'firstName lastName email')
//     .populate('freelancerId', 'firstName lastName email')
//     .populate('taskId', 'title description taskBudget')
//     .populate('bidId', 'amount message')
//     .populate('deliveryId', 'title description status')
//     .populate('resolvedBy', 'firstName lastName email')
//     .sort({ createdAt: -1 })
//     .skip(skip)
//     .limit(limit);
// };
// DisputeSchema.statics.findPendingDisputes = function (
//   page: number = 1,
//   limit: number = 10
// ) {
//   const skip = (page - 1) * limit;
//   return this.find({
//     status: { $in: [DisputeStatus.OPEN, DisputeStatus.UNDER_REVIEW] },
//   })
//     .populate('posterId', 'firstName lastName email')
//     .populate('freelancerId', 'firstName lastName email')
//     .populate('taskId', 'title description taskBudget')
//     .populate('bidId', 'amount message')
//     .populate('deliveryId', 'title description status')
//     .sort({ priority: 1, createdAt: 1 }) // High priority first, then oldest first
//     .skip(skip)
//     .limit(limit);
// };
// DisputeSchema.statics.findByPriority = function (
//   priority: string,
//   page: number = 1,
//   limit: number = 10
// ) {
//   const skip = (page - 1) * limit;
//   return this.find({
//     priority,
//     status: { $in: [DisputeStatus.OPEN, DisputeStatus.UNDER_REVIEW] },
//   })
//     .populate('posterId', 'firstName lastName email')
//     .populate('freelancerId', 'firstName lastName email')
//     .populate('taskId', 'title description taskBudget')
//     .populate('bidId', 'amount message')
//     .populate('deliveryId', 'title description status')
//     .sort({ createdAt: 1 })
//     .skip(skip)
//     .limit(limit);
// };
// DisputeSchema.statics.updateStatus = function (
//   disputeId: string,
//   status: string,
//   updateData: any = {}
// ) {
//   const update = { status, ...updateData };
//   // Set appropriate timestamp based on status
//   if (status === DisputeStatus.RESOLVED || status === DisputeStatus.CLOSED) {
//     update.resolvedAt = new Date();
//   }
//   return this.findByIdAndUpdate(new Types.ObjectId(disputeId), update, {
//     new: true,
//     runValidators: true,
//   });
// };
// DisputeSchema.statics.addEvidence = function (
//   disputeId: string,
//   evidence: Omit<IDisputeEvidence, '_id'>
// ) {
//   return this.findByIdAndUpdate(
//     new Types.ObjectId(disputeId),
//     { $push: { evidence } },
//     { new: true, runValidators: true }
//   );
// };
// DisputeSchema.statics.getDisputeStats = function (filters: any = {}) {
//   const pipeline = [
//     { $match: filters },
//     {
//       $group: {
//         _id: null,
//         total: { $sum: 1 },
//         byStatus: {
//           $push: {
//             status: '$status',
//             count: 1,
//           },
//         },
//         byType: {
//           $push: {
//             type: '$type',
//             count: 1,
//           },
//         },
//         byPriority: {
//           $push: {
//             priority: '$priority',
//             count: 1,
//           },
//         },
//         avgResolutionTime: {
//           $avg: {
//             $cond: {
//               if: { $and: ['$resolvedAt', '$createdAt'] },
//               then: {
//                 $divide: [
//                   { $subtract: ['$resolvedAt', '$createdAt'] },
//                   1000 * 60 * 60, // Convert to hours
//                 ],
//               },
//               else: null,
//             },
//           },
//         },
//         resolvedCount: {
//           $sum: {
//             $cond: {
//               if: { $eq: ['$status', DisputeStatus.RESOLVED] },
//               then: 1,
//               else: 0,
//             },
//           },
//         },
//       },
//     },
//     {
//       $project: {
//         _id: 0,
//         total: 1,
//         byStatus: {
//           $arrayToObject: {
//             $map: {
//               input: {
//                 $reduce: {
//                   input: '$byStatus',
//                   initialValue: [],
//                   in: {
//                     $concatArrays: [
//                       '$$value',
//                       [{ k: '$$this.status', v: '$$this.count' }],
//                     ],
//                   },
//                 },
//               },
//               as: 'item',
//               in: { k: '$$item.k', v: '$$item.v' },
//             },
//           },
//         },
//         byType: {
//           $arrayToObject: {
//             $map: {
//               input: {
//                 $reduce: {
//                   input: '$byType',
//                   initialValue: [],
//                   in: {
//                     $concatArrays: [
//                       '$$value',
//                       [{ k: '$$this.type', v: '$$this.count' }],
//                     ],
//                   },
//                 },
//               },
//               as: 'item',
//               in: { k: '$$item.k', v: '$$item.v' },
//             },
//           },
//         },
//         byPriority: {
//           $arrayToObject: {
//             $map: {
//               input: {
//                 $reduce: {
//                   input: '$byPriority',
//                   initialValue: [],
//                   in: {
//                     $concatArrays: [
//                       '$$value',
//                       [{ k: '$$this.priority', v: '$$this.count' }],
//                     ],
//                   },
//                 },
//               },
//               as: 'item',
//               in: { k: '$$item.k', v: '$$item.v' },
//             },
//           },
//         },
//         avgResolutionTime: { $ifNull: ['$avgResolutionTime', 0] },
//         resolutionRate: {
//           $cond: {
//             if: { $gt: ['$total', 0] },
//             then: {
//               $multiply: [{ $divide: ['$resolvedCount', '$total'] }, 100],
//             },
//             else: 0,
//           },
//         },
//       },
//     },
//   ];
//   return this.aggregate(pipeline);
// };
// // Pre-save middleware
// DisputeSchema.pre('save', function (next) {
//   if (this.isNew) {
//     // Auto-escalate priority based on dispute type
//     if (this.type === DisputeType.PAYMENT_ISSUE) {
//       this.priority = DisputePriority.HIGH;
//     } else if (this.type === DisputeType.TASK_CANCELLATION) {
//       this.priority = DisputePriority.MEDIUM;
//     }
//   }
//   next();
// });
// // Virtual for checking if dispute is overdue
// DisputeSchema.virtual('isOverdue').get(function () {
//   if (
//     this.status === DisputeStatus.RESOLVED ||
//     this.status === DisputeStatus.CLOSED
//   ) {
//     return false;
//   }
//   const daysSinceCreation = Math.floor(
//     (Date.now() - this.createdAt.getTime()) / (1000 * 60 * 60 * 24)
//   );
//   // Different SLA based on priority
//   const slaHours = {
//     [DisputePriority.URGENT]: 24, // 1 day
//     [DisputePriority.HIGH]: 72, // 3 days
//     [DisputePriority.MEDIUM]: 168, // 7 days
//     [DisputePriority.LOW]: 336, // 14 days
//   };
//   return daysSinceCreation * 24 > slaHours[this.priority];
// });
// // Virtual for resolution time in hours
// DisputeSchema.virtual('resolutionTimeHours').get(function () {
//   if (!this.resolvedAt || !this.createdAt) return null;
//   return Math.floor(
//     (this.resolvedAt.getTime() - this.createdAt.getTime()) / (1000 * 60 * 60)
//   );
// });
// export const DisputeModel = model<IDispute>('Dispute', DisputeSchema);
