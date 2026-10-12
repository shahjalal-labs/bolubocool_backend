import Stripe from 'stripe';
import prisma from '../../utils/prisma';
import AppError from '../../errors/AppError';
import httpStatus from 'http-status';
import config from '../../../config';

const stripe = new Stripe(config.stripe.STRIPE_SECRET_KEY as string);

const createPaymentIntent = async (
  totalAmount: number,
  userId: string,
  charge: number,
  sellerStripeAccountId: string | null,
  paymentMethodId: string,
) => {
  if (!sellerStripeAccountId) {
    throw new AppError(
      httpStatus.BAD_REQUEST,
      'The seller cannot receive payments now.',
    );
  }
  const user = await prisma.user.findFirstOrThrow({
    where: {
      id: userId,
    },
    select: {
      id: true,
      stripeAccountId: true,
    },
  });
  if (!user.stripeAccountId) {
    throw new AppError(
      httpStatus.BAD_REQUEST,
      'Payment information unavailable. Please attach your card information.',
    );
  }
  // const customer = await findOrCreateCustomer(userId, paymentMethodId);

  // if (!customer.invoice_settings.default_payment_method) {
  //   throw new AppError(
  //     httpStatus.BAD_REQUEST,
  //     'Default payment method not found for customer.',
  //   );
  // }

  const APP_FEE_RATE = 0.1;
  const amountInCents = Math.round(totalAmount * 100);

  const newC = charge *100

  const applicationFeeAmount = Math.floor(
    amountInCents * APP_FEE_RATE + newC,
  );

  const paymentIntent = await stripe.paymentIntents.create({
    amount: totalAmount * 100,
    currency: 'usd',
    customer: user.stripeAccountId,
    payment_method: paymentMethodId as string,
    off_session: true,
    confirm: true,
    // capture_method: 'manual',
    application_fee_amount: applicationFeeAmount,
    transfer_data: {
      destination: sellerStripeAccountId,
    },
  });

  return paymentIntent;
};

const capturePayment = async (orderId: string, userId: string) => {
  let transaction;
  const order = await prisma.order.findUniqueOrThrow({
    where: {
      id: orderId,
    },
  });

  const paymentIntent = await stripe.paymentIntents.capture(
    order.paymentIntentId as string,
  );

  if (paymentIntent.status === 'succeeded') {
    transaction = await prisma.transaction.create({
      data: {
        userId,
        paymentId: paymentIntent.id,
        amount: order.totalAmount,
        currency: 'usd',
      },
    });
  }

  return { paymentIntent, transaction };
};

const createConnectedAccount = async (userId: string) => {
  const account = await stripe.accounts.create({
    type: 'express',
    capabilities: {
      card_payments: { requested: true },
      transfers: { requested: true },
    },
  });
  const user = await prisma.user.update({
    where: { id: userId },
    data: {
      stripeAccountId: account.id,
    },
  });
  return user;
};

const refreshOnboardingLink = async (userId: string) => {
  let user = await prisma.user.findFirst({
    where: {
      id: userId,
    },
  });

  if (!user) {
    throw new AppError(
      httpStatus.NOT_FOUND,
      'This user is not available anymore.',
    );
  }

  if (user.role !== 'SELLER') {
    throw new AppError(httpStatus.BAD_REQUEST, 'User is not a seller.');
  }

  // if (user.chargesEnabled === true) {
  //   throw new AppError(
  //     httpStatus.BAD_REQUEST,
  //     'User is already verified.',
  //   );
  // }

  if (!user.stripeAccountId) {
    user = await createConnectedAccount(user.id);
  }

  const onboardingLink = await stripe.accountLinks.create({
    account: user.stripeAccountId!,
    refresh_url: 'http://localhost:5198',
    return_url: 'https://facebook.com',
    type: 'account_onboarding',
  });

  return onboardingLink;
};

const stripeWebhook = async (payload: any, sig: string) => {
  try {
    const event = stripe.webhooks.constructEvent(
      payload,
      sig,
      config.stripe.STRIPE_WEBHOOK_SECRET,
    );

    switch (event.type) {
      case 'account.updated':
        const account = event.data.object;
        const user = await prisma.user.findFirst({
          where: {
            stripeAccountId: account.id,
          },
        });
        if (!user) {
          throw new AppError(
            httpStatus.NOT_FOUND,
            'This user is not available anymore.',
          );
        }
        // await prisma.user.update({
        //   where: {
        //     id: user.id,
        //   },
        //   data: {
        //     chargesEnabled: account.charges_enabled,
        //   },
        // });
        break;
      default:
        console.log(`Unhandled event type ${event.type}`);
    }
  } catch (error) {
    console.error('Stripe webhook error:', error);
    throw error;
  }
};

export const stripeServices = {
  createPaymentIntent,
  capturePayment,
  createConnectedAccount,
  stripe,
  stripeWebhook,
  refreshOnboardingLink,
};
