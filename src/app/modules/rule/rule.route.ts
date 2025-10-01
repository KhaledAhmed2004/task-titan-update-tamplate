import express from 'express';
import { USER_ROLES } from '../../../enums/user';
import auth from '../../middlewares/auth';
import { RuleController } from './rule.controller';
const router = express.Router();

//about us
router
  .route('/about')
  .post(auth(USER_ROLES.SUPER_ADMIN), RuleController.createAbout)
  .get(RuleController.getAbout);

//privacy policy
router
  .route('/privacy-policy')
  .post(auth(USER_ROLES.SUPER_ADMIN), RuleController.createPrivacyPolicy)
  .get(RuleController.getPrivacyPolicy);

//terms and conditions
router
  .route('/terms-and-conditions')
  .post(auth(USER_ROLES.SUPER_ADMIN), RuleController.createTermsAndCondition)
  .get(RuleController.getTermsAndCondition);

export const RuleRoutes = router;
