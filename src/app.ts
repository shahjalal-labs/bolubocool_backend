import cors from 'cors';
import express, { Application, NextFunction, Request, Response } from 'express';
import httpStatus from 'http-status';
import globalErrorHandler from './app/middlewares/globalErrorHandler';
import router from './app/routes';
import { stripeController } from './app/modules/stripe/stripe.controller';
import { accountSuccess, paystackPaymentSuccess, verifyEmailBody } from './app/routes/viewRoute';

const app: Application = express();
app.use(
  cors({
    origin: [
      'http://localhost:3001',
      'http://localhost:3000',
      'http://172.252.13.78:3200',
      'http://172.252.13.78:3001',
      'https://bolubocool-dashboard.vercel.app',
      'https://bolubocool-frontend.vercel.app',
    ],
    credentials: true,
  }),
);

// Stripe webhook
app.post(
  '/webhook',
  express.raw({ type: 'application/json' }),
  stripeController.stripeWebhook,
);

//parser
app.use(express.json({ limit: '100mb' }));
app.use(express.urlencoded({ limit: '100mb', extended: true }));

app.get('/', (req: Request, res: Response) => {
  res.send({
    Message: 'Welcome to Bolubocool API',
  });
});

app.use('/api/v1', router);

app.get('/verify-email', (req, res) => {
  const { token } = req.query;

  res.send(verifyEmailBody(token as string));
});

app.get('/account/connect/success', (req, res) => {
  res.send(accountSuccess());
});
app.get('/payment/success', (req, res) => {
    const { reference } = req.query;
    console.log("int the app ts",reference);
  res.send(paystackPaymentSuccess(reference as string));
});

app.use(globalErrorHandler);

app.use((req: Request, res: Response, next: NextFunction) => {
  res.status(httpStatus.NOT_FOUND).json({
    success: false,
    message: 'API NOT FOUND!',
    error: {
      path: req.originalUrl,
      message: 'Your requested path is not found!',
    },
  });
});

export default app;
