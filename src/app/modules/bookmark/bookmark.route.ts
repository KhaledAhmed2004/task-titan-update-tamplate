import express from 'express';
import auth from '../../middlewares/auth';
import validateRequest from '../../middlewares/validateRequest';
import { USER_ROLES } from '../../../enums/user';
import { BookmarkController } from './bookmark.controller';
import { BookmarkValidation } from './bookmark.validation';

const router = express.Router();

// Toggle bookmark (add if not exists, remove if exists)
router.post(
  '/',
  auth(USER_ROLES.TASKER),
  validateRequest(BookmarkValidation.toggle),
  BookmarkController.toggleBookmark
);

// Get all bookmarks of the current user
router.get(
  '/my-bookmarks',
  auth(USER_ROLES.TASKER, USER_ROLES.POSTER),
  validateRequest(BookmarkValidation.getUserBookmarksQuery),
  BookmarkController.getUserBookmarks
);

export const BookmarkRoutes = router;
