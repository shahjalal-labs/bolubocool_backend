import express from 'express';
import auth from '../../middlewares/auth';
import { UserRoleEnum } from '@prisma/client';
import { transactionControllers } from './transaction.controller';
const router = express.Router();
router
  .route('/')
  .get(
    auth(UserRoleEnum.ADMIN, UserRoleEnum.SUPERADMIN),
    transactionControllers.getAllTransactions,
  );

router.get(
  '/my-transactions',
  auth(),
  transactionControllers.getUserTransactions,
);

export const transactionRouter = router;
