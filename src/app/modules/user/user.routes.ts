import express from 'express';
import auth from '../../middlewares/auth';
import validateRequest from '../../middlewares/validateRequest';
import { UserControllers } from './user.controller';
import { UserValidations } from './user.validation';
import { UserRoleEnum } from '@prisma/client';
import { s3Multer } from '../../helpers/fileUploaderToS3';
const router = express.Router();

router.post(
  '/register',
  s3Multer.fields([{ name: 'sellerDocs' }]),
  UserControllers.registerUser,
);
router.get('/verify', UserControllers.verifyEmail);
router.get('/pending', auth(), UserControllers.getPendingSellers);
router.post(
  '/resend-verification-email',
  UserControllers.resendUserVerificationEmail,
);
router.get('/', UserControllers.getAllUsers);

router.get('/me', auth(), UserControllers.getMyProfile);
router.patch(
  '/approve-seller/:userId',
  auth(UserRoleEnum.ADMIN, UserRoleEnum.SUPERADMIN),
  UserControllers.approveSellerRequest,
);

router.delete(
  '/reject-seller/:userId',
  auth(UserRoleEnum.ADMIN, UserRoleEnum.SUPERADMIN),
  UserControllers.deleteSellerRequest,
);

router.get('/:id', auth(), UserControllers.getUserDetails);
router.put(
  '/update-profile',
  auth(),
  s3Multer.fields([{ name: 'profileImage', maxCount: 1 }]),
  UserControllers.updateMyProfile,
);

router.put(
  '/update-user/:id',
  auth('ADMIN'),
  UserControllers.updateUserRoleStatus,
);

router.put(
  '/change-password',
  auth('USER', 'ADMIN'),
  UserControllers.changePassword,
);

router.get(
  '/getAll/Counts',
  auth('ADMIN', 'SUPERADMIN'),
  UserControllers.getAllCounts,
);
router.get(
  '/getAll/StoreCategory',
  // auth('ADMIN','SUPERADMIN'),
  UserControllers.getStoreCategory,
);

export const UserRouter = router;
