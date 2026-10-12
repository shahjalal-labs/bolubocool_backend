import { RequestHandler } from 'express';
import httpStatus from 'http-status';
import catchAsync from '../../utils/catchAsync';
import sendResponse from '../../utils/sendResponse';
import { OrderServices } from './order.service';
import pickValidFields from '../../utils/pickValidFields';
import { UserRoleEnum } from '@prisma/client';

const createOrder: RequestHandler = catchAsync(async (req, res) => {
  const payload = req.body;
  const result = await OrderServices.createOrderIntoDB(req.user, payload);
  sendResponse(res, {
    statusCode: httpStatus.CREATED,
    success: true,
    message: 'Order created successfully',
    data: result,
  });
});
const createPaystackOrder: RequestHandler = catchAsync(async (req, res) => {
  const payload = req.body;
  const result = await OrderServices.createOrderPaystackIntoDB(
    req.user,
    payload,
  );
  sendResponse(res, {
    statusCode: httpStatus.CREATED,
    success: true,
    message: 'Order created successfully',
    data: result,
  });
});

const getAllOrder: RequestHandler = catchAsync(async (req, res) => {
  const paginationOptions = pickValidFields(req.query, ['limit', 'page']);
  const result = await OrderServices.getAllOrderFromDB(paginationOptions);
  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: 'Orders retrieved successfully',
    // meta: result.meta,
    data: result,
  });
});

// const getSellerorders: RequestHandler = catchAsync(async (req, res) => {
//   const userId = req.user.id;
//   const pagination = pickValidFields(req.query, ['limit', 'page']);
//   const orders = await OrderServices.getSellerOrders(userId, pagination);
//   sendResponse(res, {
//     statusCode: httpStatus.OK,
//     success: true,
//     message: 'Orders retrieved successfully.',
//     data: orders,
//   });
// });

const getMyOrders = catchAsync(async (req, res) => {
  const userId = req.user.id;
  const userRole = req.user.role as UserRoleEnum;
  const paginationOptions = pickValidFields(req.query, ['limit', 'page']);
  const orders = await OrderServices.getMyOrders(
    userId,
    userRole,
    paginationOptions,
  );
  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: 'Orders retrieved successfully.',
    data: orders,
  });
});

const getSingleOrder: RequestHandler = catchAsync(async (req, res) => {
  const result = await OrderServices.getSingleOrderFromDB(req.params.id);
  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: 'Order retrieved successfully',
    data: result,
  });
});

const updateOrder: RequestHandler = catchAsync(async (req, res) => {
  const result = await OrderServices.updateOrderIntoDB(req.params.id, req.body);
  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: 'Order updated successfully',
    data: result,
  });
});

const deleteOrder: RequestHandler = catchAsync(async (req, res) => {
  const result = await OrderServices.deleteOrderFromDB(req.params.id);
  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: 'Order deleted successfully',
    data: result,
  });
});

const capturePayment: RequestHandler = catchAsync(async (req, res) => {

  const reference = req.params.id;    
  const result = await OrderServices.capturePaystackPayment(reference);
  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: 'Payment captured successfully.',
    data: result,
  });
});
const acceptOrder: RequestHandler = catchAsync(async (req, res) => {
  const { orderId } = req.params;
  const userId = req.user.id;
  const order = await OrderServices.acceptOrder(userId, orderId);
  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: 'Order accepted successfully.',
    data: order,
  });
});

export const OrderControllers = {
  createOrder,
  getAllOrder,
  getMyOrders,
  // getSellerorders,
  getSingleOrder,
  updateOrder,
  deleteOrder,
  acceptOrder,
  createPaystackOrder,
  capturePayment
};
