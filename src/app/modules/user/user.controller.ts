import httpStatus from 'http-status';
import { UserServices } from './user.service';
import sendResponse from '../../utils/sendResponse';
import catchAsync from '../../utils/catchAsync';
import {  Request, Response } from 'express';
import { JwtPayload } from 'jsonwebtoken';
import config from '../../../config';
import jwt from 'jsonwebtoken';

export interface EmailTokenPayload extends JwtPayload {
  id: string;
}

const registerUser = catchAsync(async (req: Request, res: Response) => {
  const payload = JSON.parse(req.body.bodyData);
  const files = Array.isArray(req.files)
    ? req.files
    : (req.files?.sellerDocs as Express.Multer.File[]);
  const result = await UserServices.registerAccountIntoDB(payload, files);

  sendResponse(res, {
    statusCode: httpStatus.CREATED,
    message:
      'User registered successfully. Please check your email for the verification link.',
    data: result,
  });
});
const verifyEmail = catchAsync(async (req: Request, res: Response) => {
  const { token } = req.query;
  const decoded = jwt.verify(
    token as string,
    config.jwt.access_secret as string,
  ) as EmailTokenPayload;
  const result = await UserServices.verifyEmailThroughLink(decoded.id);

  sendResponse(res, {
    statusCode: httpStatus.CREATED,
    message:
      'User registered successfully. Please check your email for the verification link.',
    data: result,
  });
});


const getAllUsers = catchAsync(async (req, res) => {
  const result = await UserServices.getAllUsersFromDB(req.query);

  sendResponse(res, {
    statusCode: httpStatus.OK,
    message: 'Users Retrieve successfully',
    data: result,
  });
});

const getPendingSellers = catchAsync(async (req: Request, res: Response) => {
  const sellers = await UserServices.getPendingSellers();
  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: 'Sellers retrieved successfully.',
    data: sellers,
  });
});

const getMyProfile = catchAsync(async (req, res) => {
  const id = req.user.id;
  const result = await UserServices.getMyProfileFromDB(id);

  sendResponse(res, {
    statusCode: httpStatus.OK,
    message: 'Profile retrieved successfully',
    data: result,
  });
});

const getUserDetails = catchAsync(async (req, res) => {
  const { id } = req.params;
  const result = await UserServices.getUserDetailsFromDB(id);

  sendResponse(res, {
    statusCode: httpStatus.OK,
    message: 'User details retrieved successfully',
    data: result,
  });
});

const updateMyProfile = catchAsync(async (req, res) => {
  const payload = JSON.parse(req.body.bodyData);
  const id = req.user.id;
  const files = Array.isArray(req.files)
    ? req.files
    : (req.files?.profileImage as Express.Multer.File[]);
  const result = await UserServices.updateMyProfileIntoDB(id, payload, files);

  sendResponse(res, {
    statusCode: httpStatus.OK,
    message: 'User profile updated successfully',
    data: result,
  });
});

const updateUserRoleStatus = catchAsync(async (req, res) => {
  const { id } = req.params;
  const result = await UserServices.updateUserRoleStatusIntoDB(id, req.body);

  sendResponse(res, {
    statusCode: httpStatus.OK,
    message: 'User updated successfully',
    data: result,
  });
});

const changePassword = catchAsync(async (req, res) => {
  const userId = req.user.id;
  const result = await UserServices.changePassword(userId, req.body);

  sendResponse(res, {
    statusCode: httpStatus.OK,
    message: 'Password changed successfully',
    data: result,
  });
});

const resendUserVerificationEmail = catchAsync(
  async (req: Request, res: Response) => {
    const { email } = req.body;
    const result = await UserServices.resendUserVerificationEmail(email);
    sendResponse(res, {
      statusCode: httpStatus.OK,
      message: 'Verification email sent successfully',
      data: result,
    });
  },
);

const deleteSellerRequest = catchAsync(async (req: Request, res: Response) => {
  const { userId } = req.params;
  const sponsorshipRequests = await UserServices.deleteSellerRequest(userId);
  sendResponse(res, {
    statusCode: httpStatus.OK,
    message: 'Seller Request deleted successfully.',
    data: sponsorshipRequests,
  });
});

const approveSellerRequest = catchAsync(async (req: Request, res: Response) => {
  
  const { userId } = req.params;
  console.log("here",userId);
  const sponsorshipRequests = await UserServices.approveSellerRequest(userId);
  sendResponse(res, {
    statusCode: httpStatus.OK,
    message: 'Seller Request approved successfully.',
    data: sponsorshipRequests,
  });
});

const getAllCounts = catchAsync(async (req: Request, res: Response) => {
  const { data, message }: any = await UserServices.getAllCountsFromDB();
  sendResponse(res, {
    statusCode: httpStatus.OK,
    message: message,
    data: data,
  });
});

const getStoreCategory = catchAsync(async (req: Request, res: Response) => {
  const data = await UserServices.getStoreCategoryIntoDB();
  sendResponse(res, {
    statusCode: httpStatus.OK,
    message: 'StoreCategory retrieved successfully',
    data: data,
  });
});
export const UserControllers = {
  registerUser,
  getAllUsers,
  getMyProfile,
  getUserDetails,
  updateMyProfile,
  getPendingSellers,
  updateUserRoleStatus,
  changePassword,
  verifyEmail,
  resendUserVerificationEmail,
  deleteSellerRequest,
  approveSellerRequest,
  getAllCounts,
  getStoreCategory,
};
