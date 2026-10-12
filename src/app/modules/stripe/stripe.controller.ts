import httpStatus from 'http-status';
import catchAsync from '../../utils/catchAsync';
import sendResponse from '../../utils/sendResponse';
import { Request, Response } from 'express';
import { stripeServices } from './stripe.service';
import AppError from '../../errors/AppError';

// const createStripeCustomer = catchAsync(async (req: Request, res: Response) => {
//   const userId = req.user.id;
//   const { paymentMethodId } = req.body;
//   const session = await stripeServices.createStripeCustomer(
//     userId,
//     paymentMethodId,
//   );
//   sendResponse(res, {
//     statusCode: httpStatus.CREATED,
//     success: true,
//     message: 'Stripe customer created successfully.',
//     data: session,
//   });
// });

const createPaymentIntent = catchAsync(async (req: Request, res: Response) => {
  const userId = req.user.id;
  const { orderId } = req.params;
  // const paymentIntent = await stripeServices.createPaymentIntent(
  //   orderId,
  //   userId,
  // );
  sendResponse(res, {
    statusCode: httpStatus.CREATED,
    success: true,
    message: 'Payment intent created successfully.',
    data: null,
  });
});

const capturePayment = catchAsync(async (req: Request, res: Response) => {
  const { orderId } = req.params;
  const userId = req.user.id;
  const payment = await stripeServices.capturePayment(orderId, userId);
  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: 'Payment intent captured successfully.',
    data: payment,
  });
});

const createConnectedAccount = catchAsync(
  async (req: Request, res: Response) => {
    if (req.user.role !== 'SELLER') {
      throw new AppError(
        httpStatus.UNAUTHORIZED,
        'You are not authorized to perform this action.',
      );
    }
    const userId = req.user.id;
    const connectAccount = await stripeServices.createConnectedAccount(userId);
    sendResponse(res, {
      statusCode: httpStatus.CREATED,
      success: true,
      message:
        'Connected account created successfully. Please complete the onboarding process.',
      data: connectAccount,
    });
  },
);

const stripeWebhook = catchAsync(async (req: Request, res: Response) => {
  const sig = req.headers['stripe-signature'] as string;
  const result = await stripeServices.stripeWebhook(req.body, sig);

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: 'Account updated event captured successfully.',
    data: result,
  });
});

const refreshOnboardingLink = catchAsync(
  async (req: Request, res: Response) => {
    const userId = req.user.id;

    
    const onboardingLink = await stripeServices.refreshOnboardingLink(userId);
    sendResponse(res, {
      statusCode: httpStatus.OK,
      success: true,
      message: 'Account link generated successfully.',
      data: onboardingLink,
    });
  },
);

export const stripeController = {
  // createStripeCustomer,
  createPaymentIntent,
  capturePayment,
  createConnectedAccount,
  stripeWebhook,
  refreshOnboardingLink,
};
