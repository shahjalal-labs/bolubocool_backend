import httpStatus from 'http-status';
import catchAsync from '../../utils/catchAsync';
import sendResponse from '../../utils/sendResponse';
import { AuthServices } from './auth.service';
import { Request, Response } from 'express';
import config from '../../../config';
import jwt from 'jsonwebtoken';
import { EmailTokenPayload } from '../user/user.controller';

const loginUser = catchAsync(async (req: Request, res: Response) => {
  const result = (await AuthServices.loginUserFromDB(req.body)) as any;
  const cookieOptions = {
    expires: new Date(
      Date.now() +
        Number(config.jwt.jwt_cookie_expires_in) * 24 * 60 * 60 * 1000,
    ),
    httpOnly: true,
    secure: req.secure || req.headers['x-forwarded-proto'] === 'https',
  };
  res.cookie('refreshToken', result.refreshToken, cookieOptions);
  delete result.refreshToken;
  sendResponse(res, {
    statusCode: httpStatus.OK,
    message: 'User logged in successfully',
    data: result,
  });
});

const forgotPassword = catchAsync(async (req: Request, res: Response) => {
  const { email } = req.body;
  const result = await AuthServices.forgotPassword(email);
  sendResponse(res, {
    statusCode: httpStatus.OK,
    message:
      'Please check your email and follow the instructions to reset your password.',
    data: result,
  });
});

const resetPassword = catchAsync(async (req: Request, res: Response) => {
  const { email } = req.body;

  const result = await AuthServices.sendResetPasswordLink(email);
  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: 'Reset password link send successfully.',
    data: result,
  });
});

const createNewPassword = catchAsync(async (req, res) => {
  const { token } = req.query;
  // const newPassword = req.body.newPassword;
  const decoded = jwt.verify(
    token as string,
    config.jwt.access_secret as string,
  ) as EmailTokenPayload;

  const result = await AuthServices.resetNewPassword(decoded.id, '1234567');
  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: 'Password changed successfully.',
    data: result,
  });
});

const subAccount = catchAsync(async (req, res) => { 

  const result = await AuthServices.createSubAccount(req);
  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: 'Paystack sub account created successfully.',
    data: result,
  });
});
const stripeAccountLink = catchAsync(async (req, res) => { 

  const result = await AuthServices.regenerateStripeConnectAccountLink(req.user.id);
  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: 'Account link regenerated successfully.',
    data: result,
  });
});

export const AuthControllers = {
  loginUser,
  forgotPassword,
  resetPassword,
  createNewPassword,
  subAccount,
  stripeAccountLink
};
