import { Router, Request, Response, NextFunction } from 'express';
import auth from '../../middlewares/auth';
import { USER_ROLES } from '../../../enums/user';
import { HomePageEditController } from './homePageEdit.controller';
import { HomePageEditValidation } from './homePageEdit.validation';
import fileUploadHandler from '../../middlewares/fileUploadHandler';

const router = Router();

// ======== READ ==========
router.get('/', HomePageEditController.getHomePageData);

// ======== UPDATE ==========
router.patch(
  '/',
  auth(USER_ROLES.SUPER_ADMIN), // Only Super Admin
  fileUploadHandler(), // Handle image upload
  (req: Request, res: Response, next: NextFunction) => {
    if (req.body.data) {
      req.body = HomePageEditValidation.updateHomePageDataZodSchema.parse(
        JSON.parse(req.body.data)
      );
    }
    return HomePageEditController.updateHomePageData(req, res, next);
  }
);

export const HomePageEditRoutes = router;
