import express from 'express';
import { AuthControllers } from './auth.controller';
import auth from '../../middlewares/auth';
import { UserRoleEnum } from '@prisma/client';

const router = express.Router();

router.post(
  '/login',
  // validateRequest(authValidation.loginUser),
  AuthControllers.loginUser,
);

router.post('/forgot-password', AuthControllers.resetPassword);
// router.post('/enter-otp', AuthControllers.enterOTP);
router.get('/reset-password', AuthControllers.resetPassword);
router.patch('/new-password', AuthControllers.createNewPassword);
router.post('/sub-account', AuthControllers.subAccount);
router.post('/regenerate-link',auth(UserRoleEnum.SELLER), AuthControllers.stripeAccountLink);

export const AuthRouter = router;
