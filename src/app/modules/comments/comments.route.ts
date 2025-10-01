import { Router, Request, Response, NextFunction } from 'express';
import auth from '../../middlewares/auth';
import { USER_ROLES } from '../../../enums/user';
import { CommentController } from './comment.controller';
import fileUploadHandler from '../../middlewares/fileUploadHandler';

const router = Router();

// Create comment or reply
router.post(
  '/',
  auth(USER_ROLES.TASKER, USER_ROLES.POSTER),
  fileUploadHandler(),
  (req: Request, res: Response, next: NextFunction) => {
    if (req.body.data) {
      req.body = JSON.parse(req.body.data);
    }
    return CommentController.createComment(req, res, next);
  }
);

// Get comments with replies
router.get('/:postId', CommentController.getCommentsByPost);

// Update comment
router.patch(
  '/:id',
  auth(USER_ROLES.TASKER, USER_ROLES.POSTER),
  fileUploadHandler(),
  (req: Request, res: Response, next: NextFunction) => {
    if (req.body.data) {
      req.body = JSON.parse(req.body.data);
    }
    return CommentController.updateComment(req, res, next);
  }
);

// Delete comment
router.delete(
  '/:id',
  auth(USER_ROLES.TASKER, USER_ROLES.POSTER),
  CommentController.deleteComment
);

export const CommentRoutes = router;
