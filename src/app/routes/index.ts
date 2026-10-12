import express from 'express';
import { AuthRouter } from '../modules/auth/auth.routes';
import { UserRouter } from '../modules/user/user.routes';
import { contactRouter } from '../modules/contact/contact.route';
import { transactionRouter } from '../modules/transaction/transaction.route';
import { ProductRoutes } from '../modules/Product/Product.route';
import { OrderRoutes } from '../modules/Order/order.route';
import { stripeRouter } from '../modules/stripe/stripe.route';
import { paystackRoutes } from '../modules/paystack/paystack.route';
const router = express.Router();

const moduleRoutes = [
  {
    path: '/auth',
    route: AuthRouter,
  },  
  {
    path: '/user',
    route: UserRouter,
  },

  {
    path: '/contact',
    route: contactRouter,
  },
  {
    path: '/product',
    route: ProductRoutes,
  },
  {
    path: '/order',
    route: OrderRoutes,
  },
  {
    path: '/stripe',
    route: stripeRouter,
  },
  {
    path: '/transaction',
    route: transactionRouter,
  },
  {
    path: '/paystack',
    route: paystackRoutes,
  },
];

moduleRoutes.forEach(route => router.use(route.path, route.route));

export default router;
