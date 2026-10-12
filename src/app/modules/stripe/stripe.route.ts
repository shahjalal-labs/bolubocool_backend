import express from 'express';
import { stripeController } from './stripe.controller';
import auth from '../../middlewares/auth';

const router = express.Router();
router
  .route('/connect-account')
  .post(auth(), stripeController.createConnectedAccount);
router
  .route('/refresh-onboarding-link')
  .get(auth(), stripeController.refreshOnboardingLink);

// router.route('/create-customer');
// .post(auth(), stripeController.createStripeCustomer);
// router
//   .route('/:orderId/create-intent')
//   .post(auth(), stripeController.createPaymentIntent);
router
  .route('/:orderId/capture-payment')
  .post(auth(), stripeController.capturePayment);

export const stripeRouter = router;
