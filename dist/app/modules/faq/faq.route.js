"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.FaqRoutes = void 0;
const express_1 = __importDefault(require("express"));
const auth_1 = __importDefault(require("../../middlewares/auth"));
const validateRequest_1 = __importDefault(require("../../middlewares/validateRequest"));
const user_1 = require("../../../enums/user");
const faq_controller_1 = require("./faq.controller");
const faq_validation_1 = require("./faq.validation");
const router = express_1.default.Router();
// Create a new FAQ
router.post('/', (0, validateRequest_1.default)(faq_validation_1.FaqValidation.createFaqZodSchema), (0, auth_1.default)(user_1.USER_ROLES.SUPER_ADMIN), faq_controller_1.FaqController.createFaq);
// Get all FAQs
router.get('/', faq_controller_1.FaqController.getAllFaqs);
// Get a single FAQ by ID
router.get('/:id', faq_controller_1.FaqController.getFaqById);
// Update FAQ
router.patch('/:id', (0, auth_1.default)(user_1.USER_ROLES.SUPER_ADMIN), faq_controller_1.FaqController.updateFaq);
// Delete FAQ
router.delete('/:id', (0, auth_1.default)(user_1.USER_ROLES.SUPER_ADMIN), faq_controller_1.FaqController.deleteFaq);
exports.FaqRoutes = router;
