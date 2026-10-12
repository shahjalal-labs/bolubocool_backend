import { RequestHandler } from 'express';
import catchAsync from '../../utils/catchAsync';
import { paystackServices } from './paystack.service';
import sendResponse from '../../utils/sendResponse';
import httpStatus from 'http-status';

const paymentIntent: RequestHandler = catchAsync(async (req, res) => {
  const result = await paystackServices.createPaymentIntent(req);
  sendResponse(res, {
    statusCode: httpStatus.CREATED,
    success: true,
    message: 'Payment intent created successfully',
    data: result,
  });
});
const connectAccount: RequestHandler = catchAsync(async (req, res) => {
  const result = await paystackServices.createSubAccount(req);
  sendResponse(res, {
    statusCode: httpStatus.CREATED,
    success: true,
    message: 'Sub account created successfully',
    data: result,
  });
});
const splitPayment: RequestHandler = catchAsync(async (req, res) => {
  const result = await paystackServices.initializeSplitPayment(req);
  sendResponse(res, {
    statusCode: httpStatus.CREATED,
    success: true,
    message: 'Authorization URL created',
    data: result,
  });
});
const createShipment: RequestHandler = catchAsync(async (req, res) => {
  const result = await paystackServices.createShipmentIntoDB(req.body);
  sendResponse(res, {
    statusCode: httpStatus.CREATED,
    success: true,
    message: 'Shipment created',
    data: result,
  });
});
const bookDraft: RequestHandler = catchAsync(async (req, res) => {
  const result = await paystackServices.bookShipmentAsDraft(req.body);
  sendResponse(res, {
    statusCode: httpStatus.CREATED,
    success: true,
    message: 'Draft created',
    data: result,
  });
});
const payForDraft: RequestHandler = catchAsync(async (req, res) => {
  const result = await paystackServices.payForShipment(req.params.id);
  sendResponse(res, {
    statusCode: httpStatus.CREATED,
    success: true,
    message: 'payment completed for draft',
    data: result,
  });
});
const getShippingCost: RequestHandler = catchAsync(async (req, res) => {
  const payload = req.body
  const result = await paystackServices.getShippingCost(payload);
  sendResponse(res, {
    statusCode: httpStatus.CREATED,
    success: true,
    message: 'Shipping cost retrieved',
    data: result,
  });
});
const trackShipment: RequestHandler = catchAsync(async (req, res) => {
  const result = await paystackServices.trackShipmentInfo(req.params.id);
  sendResponse(res, {
    statusCode: httpStatus.CREATED,
    success: true,
    message: 'shipment track result',
    data: result,
  });
});
const getRates: RequestHandler = catchAsync(async (req, res) => {
  const result = await paystackServices.getRates(req.body);
  sendResponse(res, {
    statusCode: httpStatus.CREATED,
    success: true,
    message: 'Shipment created',
    data: result,
  });
});

export const paystackController = {
  paymentIntent,
  trackShipment,
  getRates,
  connectAccount,
  createShipment,
  payForDraft,
  splitPayment,
  getShippingCost,
  bookDraft,
};
