import { Router } from 'express';
import validateRequest from '../../middlewares/validateRequest';
import { BidController } from './bid.controller';
import { BidValidation } from './bid.validaction';
import auth from '../../middlewares/auth';
import { USER_ROLES } from '../../../enums/user';

const router = Router();

// ======== CREATE ==============

// Create a new bid for a task (Tasker)
router.post(
  '/tasks/:taskId/bids',
  auth(USER_ROLES.TASKER),
  validateRequest(BidValidation.createBidZodSchema),
  BidController.createBid
);

// ======== READ ==============
// Get all bids for a specific task (Client)
router.get(
  '/tasks/:taskId/bids',
  auth(USER_ROLES.POSTER),
  BidController.getAllBidsByTaskId
);

// Get all tasks a tasker has bid on (with their bids)
router.get(
  '/tasker/bids',
  auth(USER_ROLES.TASKER),
  BidController.getAllTasksByTaskerBids
);

// Retrieve a specific bid by its ID (Tasker or Client)
router.get(
  '/bids/:bidId',
  auth(USER_ROLES.TASKER, USER_ROLES.POSTER),
  BidController.getBidById
);

// ======== UPDATE ==============

// Update bid by ID (Tasker)
router.put(
  '/bids/:bidId',
  auth(USER_ROLES.TASKER),
  validateRequest(BidValidation.updateBidZodSchema),
  BidController.updateBid
);

// ========= DELETE =============

// Delete bid by ID (Tasker)
router.delete('/bids/:bidId', auth(USER_ROLES.TASKER), BidController.deleteBid);

// ========= ACTIONS =============

// Accept a bid (Client)
router.patch(
  '/bids/:bidId/accept',
  auth(USER_ROLES.POSTER),
  BidController.acceptBid
);

export const BidRoutes = router;
