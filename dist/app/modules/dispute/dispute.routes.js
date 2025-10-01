"use strict";
// import { Router } from 'express';
// import auth from '../../middlewares/auth';
// import { USER_ROLES } from '../../../enums/user';
// import validateRequest from '../../middlewares/validateRequest';
// import { DisputeValidation } from './dispute.validation';
// import { DisputeController } from './dispute.controller';
// const router = Router();
// // Create a new dispute
// router.post(
//   '/',
//   auth(USER_ROLES.POSTER, USER_ROLES.TASKER),
//   validateRequest(DisputeValidation.createDisputeSchema),
//   DisputeController.createDispute
// );
// // Get dispute by ID
// router.get(
//   '/:disputeId',
//   auth(USER_ROLES.POSTER, USER_ROLES.TASKER, USER_ROLES.SUPER_ADMIN),
//   DisputeController.getDisputeById
// );
// // Get user's disputes
// router.get(
//   '/user/my-disputes',
//   auth(USER_ROLES.POSTER, USER_ROLES.TASKER),
//   DisputeController.getUserDisputes
// );
// // Update dispute status (Admin only)
// router.patch(
//   '/:disputeId/status',
//   auth(USER_ROLES.POSTER, USER_ROLES.TASKER),
//   validateRequest(DisputeValidation.updateDisputeStatusSchema),
//   DisputeController.updateDisputeStatus
// );
// // Resolve dispute (Admin only)
// router.post(
//   '/:disputeId/resolve',
//   auth(USER_ROLES.POSTER, USER_ROLES.TASKER),
//   validateRequest(DisputeValidation.resolveDisputeSchema),
//   DisputeController.resolveDispute
// );
// // Get dispute statistics (Admin only)
// router.get(
//   '/admin/stats',
//   auth(USER_ROLES.POSTER, USER_ROLES.TASKER),
//   DisputeController.getDisputeStats
// );
// // Get all disputes (Admin only)
// router.get(
//   '/admin/all',
//   auth(USER_ROLES.POSTER, USER_ROLES.TASKER),
//   validateRequest(DisputeValidation.getDisputesSchema)
// );
// export default router;
