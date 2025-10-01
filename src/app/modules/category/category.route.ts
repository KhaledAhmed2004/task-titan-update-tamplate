import { Router } from 'express';
import auth from '../../middlewares/auth';
import { USER_ROLES } from '../../../enums/user';
import validateRequest from '../../middlewares/validateRequest';
import { CategoryController } from './category.controller';
import { CategoryValidation } from './category.validation';

const router = Router();

// Create category
router.post(
  '/',
  auth(USER_ROLES.SUPER_ADMIN),
  validateRequest(CategoryValidation.createCategoryZodSchema),
  CategoryController.createCategory
);

// Get all categories
router.get('/', CategoryController.getAllCategories);

// Update category
router.patch(
  '/:id',
  auth(USER_ROLES.SUPER_ADMIN),
  validateRequest(CategoryValidation.updateCategoryZodSchema),
  CategoryController.updateCategory
);

// Delete category
router.delete(
  '/:id',
  auth(USER_ROLES.SUPER_ADMIN),
  CategoryController.deleteCategory
);

router.get(
  '/top-category',
  auth(USER_ROLES.SUPER_ADMIN),
  CategoryController.getTopCategory
);

export const CategoryRoutes = router;
