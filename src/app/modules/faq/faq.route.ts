import express from 'express';
import auth from '../../middlewares/auth';
import validateRequest from '../../middlewares/validateRequest';
import { USER_ROLES } from '../../../enums/user';
import { FaqController } from './faq.controller';
import { FaqValidation } from './faq.validation';

const router = express.Router();

// Create a new FAQ
router.post(
  '/',
  validateRequest(FaqValidation.createFaqZodSchema),
  auth(USER_ROLES.SUPER_ADMIN),
  FaqController.createFaq
);

// Get all FAQs
router.get('/', FaqController.getAllFaqs);

// Get a single FAQ by ID
router.get('/:id', FaqController.getFaqById);

// Update FAQ
router.patch('/:id', auth(USER_ROLES.SUPER_ADMIN), FaqController.updateFaq);

// Delete FAQ
router.delete('/:id', auth(USER_ROLES.SUPER_ADMIN), FaqController.deleteFaq);

export const FaqRoutes = router;
