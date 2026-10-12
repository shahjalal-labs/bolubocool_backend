import { RequestHandler } from 'express';
import httpStatus from 'http-status';
import catchAsync from '../../utils/catchAsync';
import sendResponse from '../../utils/sendResponse';
import { ReviewServices } from './review.service';

const createReview: RequestHandler = catchAsync(async (req, res) => {
  const { productId }: { productId?: string } = req.params;
  const userId = req.user.id;
  const result = await ReviewServices.createReviewIntoDB(
    userId,
    productId,
    req.body,
  );
  sendResponse(res, {
    statusCode: httpStatus.CREATED,
    success: true,
    message: 'Review created successfully',
    data: result,
  });
});

const getAllReview: RequestHandler = catchAsync(async (req, res) => {
  const { productId }: { productId?: string } = req.params;
  const result = await ReviewServices.getAllReviewFromDB(productId);
  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: 'Reviews retrieved successfully',
    // meta: result.meta,
    data: result,
  });
});

const getSingleReview: RequestHandler = catchAsync(async (req, res) => {
  const result = await ReviewServices.getSingleReviewFromDB(req.params.id);
  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: 'Review retrieved successfully',
    data: result,
  });
});

const updateReview: RequestHandler = catchAsync(async (req, res) => {
  const result = await ReviewServices.updateReviewIntoDB(
    req.params.id,
    req.body,
  );
  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: 'Review updated successfully',
    data: result,
  });
});

const deleteReview: RequestHandler = catchAsync(async (req, res) => {
  const result = await ReviewServices.deleteReviewFromDB(req.params.id);
  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: 'Review deleted successfully',
    data: result,
  });
});

export const ReviewControllers = {
  createReview,
  getAllReview,
  getSingleReview,
  updateReview,
  deleteReview,
};
