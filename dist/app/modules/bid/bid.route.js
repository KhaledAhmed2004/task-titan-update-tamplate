"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.BidRoutes = void 0;
const express_1 = require("express");
const validateRequest_1 = __importDefault(require("../../middlewares/validateRequest"));
const bid_controller_1 = require("./bid.controller");
const bid_validaction_1 = require("./bid.validaction");
const auth_1 = __importDefault(require("../../middlewares/auth"));
const user_1 = require("../../../enums/user");
const router = (0, express_1.Router)();
// ======== CREATE ==============
// Create a new bid for a task (Tasker)
router.post('/tasks/:taskId/bids', (0, auth_1.default)(user_1.USER_ROLES.TASKER), (0, validateRequest_1.default)(bid_validaction_1.BidValidation.createBidZodSchema), bid_controller_1.BidController.createBid);
// ======== READ ==============
// Get all bids for a specific task (Client)
router.get('/tasks/:taskId/bids', (0, auth_1.default)(user_1.USER_ROLES.POSTER), bid_controller_1.BidController.getAllBidsByTaskId);
// Get all tasks a tasker has bid on (with their bids)
router.get('/tasker/bids', (0, auth_1.default)(user_1.USER_ROLES.TASKER), bid_controller_1.BidController.getAllTasksByTaskerBids);
// Retrieve a specific bid by its ID (Tasker or Client)
router.get('/bids/:bidId', (0, auth_1.default)(user_1.USER_ROLES.TASKER, user_1.USER_ROLES.POSTER), bid_controller_1.BidController.getBidById);
// ======== UPDATE ==============
// Update bid by ID (Tasker)
router.put('/bids/:bidId', (0, auth_1.default)(user_1.USER_ROLES.TASKER), (0, validateRequest_1.default)(bid_validaction_1.BidValidation.updateBidZodSchema), bid_controller_1.BidController.updateBid);
// ========= DELETE =============
// Delete bid by ID (Tasker)
router.delete('/bids/:bidId', (0, auth_1.default)(user_1.USER_ROLES.TASKER), bid_controller_1.BidController.deleteBid);
// ========= ACTIONS =============
// Accept a bid (Client)
router.patch('/bids/:bidId/accept', (0, auth_1.default)(user_1.USER_ROLES.POSTER), bid_controller_1.BidController.acceptBid);
exports.BidRoutes = router;
