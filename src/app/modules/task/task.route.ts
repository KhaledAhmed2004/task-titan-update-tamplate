import { Router } from 'express';
import { TaskController } from './task.controller';
import { TaskValidation } from './task.validation';
import { USER_ROLES } from '../../../enums/user';
import auth from '../../middlewares/auth';
import fileUploadHandler from '../../middlewares/fileUploadHandler';
import validateRequest from '../../middlewares/validateRequest';
import { NextFunction, Request, Response } from 'express';

const router = Router();

// create task
router.post(
  '/',
  auth(USER_ROLES.POSTER),
  fileUploadHandler(),
  (req: Request, res: Response, next: NextFunction) => {
    if (req.body.data) {
      // Parse JSON from form-data
      req.body = TaskValidation.createTaskZodSchema.parse(
        JSON.parse(req.body.data)
      );
    }
    // Call createTask wrapped in catchAsync, just like updateProfile
    return TaskController.createTask(req, res, next);
  }
);

// get all tasks
router.get(
  '/',
  auth(
    USER_ROLES.POSTER,
    USER_ROLES.TASKER,
    USER_ROLES.GUEST,
    USER_ROLES.SUPER_ADMIN
  ),
  TaskController.getAllTasks
);

// Get task statistics
router.get(
  '/stats',
  auth(USER_ROLES.SUPER_ADMIN),
  TaskController.getTaskStatistics
);

// get tasks of the current user (poster)
router.get('/my-tasks', auth(USER_ROLES.POSTER), TaskController.getMyTasks);

// get a specific task of the current user (poster) by ID
router.get(
  '/my-tasks/:taskId',
  auth(USER_ROLES.POSTER),
  TaskController.getMyTaskById
);

// get task by id
router.get(
  '/:taskId',
  auth(USER_ROLES.SUPER_ADMIN, USER_ROLES.POSTER, USER_ROLES.TASKER),
  TaskController.getTaskById
);

// update task
router.put(
  '/:taskId',
  auth(USER_ROLES.POSTER),
  fileUploadHandler(), // handle taskImage upload
  (req: Request, res: Response, next: NextFunction) => {
    if (req.body.data) {
      // Parse JSON from form-data
      req.body = TaskValidation.updateTaskZodSchema.parse(
        JSON.parse(req.body.data)
      );
    }
    // Call createTask wrapped in catchAsync, just like updateProfile
    return TaskController.updateTask(req, res, next);
  }
);

// delete task
router.delete('/:taskId', auth(USER_ROLES.POSTER), TaskController.deleteTask);

// Get last 6 months completion stats with growth percentage
router.get(
  '/completion-stats/last-6-months',
  auth(USER_ROLES.SUPER_ADMIN, USER_ROLES.POSTER),
  TaskController.getLastSixMonthsCompletionStats
);

// complete task and release payment
router.patch(
  '/:taskId/complete',
  auth(USER_ROLES.POSTER),
  TaskController.completeTask
);

// Cancel task
router.patch(
  '/:taskId/cancel',
  auth(USER_ROLES.POSTER),
  validateRequest(TaskValidation.cancelTaskZodSchema),
  TaskController.cancelTask
);

// Submit delivery for a task (by Tasker)
router.post(
  '/:taskId/submit',
  auth(USER_ROLES.TASKER),
  TaskController.submitDelivery
);

// Get similar tasks by taskId
router.get('/:taskId/similar', TaskController.getSimilarTasks);

export const TaskRoutes = router;
