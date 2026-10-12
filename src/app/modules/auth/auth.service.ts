import * as bcrypt from 'bcrypt';
import httpStatus from 'http-status';
import { Secret } from 'jsonwebtoken';
import config from '../../../config';
import AppError from '../../errors/AppError';
import { generateToken } from '../../utils/generateToken';
import prisma from '../../utils/prisma';
import Stripe from 'stripe';
import Email from '../../utils/email';
import { verification } from '../../helpers/generateEmailVerificationLink';
import { emailBody } from '../../helpers/emailBody';
import sendEmail from '../../helpers/email';
import https from 'https';
import { Request } from 'express';

const stripe = new Stripe(config.stripe.STRIPE_SECRET_KEY as string);

// const loginUserFromDB = async (payload: {
//   email: string;
//   password: string;
// }) => {
//   const userData = await prisma.user.findUniqueOrThrow({
//     where: {
//       email: payload.email,
//     },
//   });
//   const isCorrectPassword: Boolean = await bcrypt.compare(
//     payload.password,
//     userData.password,
//   );

//   if (!isCorrectPassword) {
//     throw new AppError(httpStatus.BAD_REQUEST, 'Password incorrect');
//   }
//   if (userData.role === 'SELLER' && userData.status === 'PENDING') {
//     throw new AppError(
//       httpStatus.BAD_REQUEST,
//       'Your account is pending approval from the admin. Please contact site admin for account approval.',
//     );
//   }
//   if (!userData.isEmailVerified) {
//     const accessToken = generateToken(
//       {
//         id: userData.id,
//         name: userData.name,
//         email: userData.email,
//         role: userData.role,
//       },
//       config.jwt.access_secret as Secret,
//       '3m',
//     );
//     const verificationLink = `https://bolubocool-ecommerce-server.vercel.app/verify-email?token=${accessToken}`;
//     const subject = 'Your Account Verification';
//     const html = emailBody(userData.name, verificationLink);
//     await sendEmail(userData.email, subject, html);
//     // await UserServices.resendUserVerificationEmail(payload.email);
//     throw new AppError(
//       httpStatus.FORBIDDEN,
//       'Your email is not verified, please check your email for the verification link.',
//     );
//   }
//   const refreshToken = await generateToken(
//     {
//       id: userData.id,
//       name: userData.name,
//       email: userData.email,
//       role: userData.role,
//     },
//     config.jwt.access_secret as Secret,
//     config.jwt.access_expires_in as string,
//   );

//   const accessToken = generateToken(
//     {
//       id: userData.id,
//       name: userData.name,
//       email: userData.email,
//       role: userData.role,
//     },
//     config.jwt.access_secret as Secret,
//     config.jwt.access_expires_in as string,
//   );

//   const account = await stripe.accounts.retrieve(
//     userData.stripeAccountId as string,
//   );
//   if (!account.charges_enabled) {
//     const accountLink = await stripe.accountLinks.create({
//       account: userData.stripeAccountId as string,
//       refresh_url: 'https://yourdomain.com/reauth',
//       return_url:
//         'https://eze-ifenna-backend.vercel.app/account/connect/success',
//       type: 'account_onboarding',
//     });

//     throw new AppError(403, accountLink.url);
//   }
//   return {
//     id: userData.id,
//     name: userData.name,
//     email: userData.email,
//     role: userData.role,
//     payStack: userData.paystackAccountCode,
//     accessToken,
//     refreshToken,
//   };
// };
const loginUserFromDB = async (payload: {
  email: string;
  password: string;
}) => {
  const userData = await prisma.user.findUniqueOrThrow({
    where: {
      email: payload.email,
    },
  });

  const isCorrectPassword: boolean = await bcrypt.compare(
    payload.password,
    userData.password,
  );

  if (!isCorrectPassword) {
    throw new AppError(httpStatus.BAD_REQUEST, 'Password incorrect');
  }

  if (userData.role === 'SELLER' && userData.status === 'PENDING') {
    throw new AppError(
      httpStatus.BAD_REQUEST,
      'Your account is pending approval from the admin. Please contact site admin for account approval.',
    );
  }

  if (!userData.isEmailVerified) {
    const accessToken = generateToken(
      {
        id: userData.id,
        name: userData.name,
        email: userData.email,
        role: userData.role,
      },
      config.jwt.access_secret as Secret,
      '3m',
    );
    const verificationLink = `https://bolubocool-ecommerce-server.vercel.app/verify-email?token=${accessToken}`;
    const subject = 'Your Account Verification';
    const html = emailBody(userData.name, verificationLink);
    await sendEmail(userData.email, subject, html);

    throw new AppError(
      httpStatus.FORBIDDEN,
      'Your email is not verified, please check your email for the verification link.',
    );
  }

  const refreshToken = generateToken(
    {
      id: userData.id,
      name: userData.name,
      email: userData.email,
      role: userData.role,
    },
    config.jwt.refresh_secret as Secret,
    config.jwt.refresh_expires_in as string,
  );

  const accessToken = generateToken(
    {
      id: userData.id,
      name: userData.name,
      email: userData.email,
      role: userData.role,
    },
    config.jwt.access_secret as Secret,
    config.jwt.access_expires_in as string,
  );

  let isStripeSetup = true;

  if (userData.role === 'SELLER') {
    const account = await stripe.accounts.retrieve(
      userData.stripeAccountId as string,
    );

    if (!account.charges_enabled) {
      isStripeSetup = false;
    }
  }

  return {
    id: userData.id,
    name: userData.name,
    email: userData.email,
    role: userData.role,
    payStack: userData.paystackAccountCode,
    isStripeSetup,
    accessToken,
    refreshToken,
  };
};

const forgotPassword = async (email: string) => {
  const tokenExpiry = new Date(Date.now() + 30 * 60 * 1000);
  const { forgotPasswordLink, hashedToken } =
    verification.generateForgotPasswordLink();
  const user = await prisma.user.update({
    where: {
      email: email,
    },
    data: {
      forgotPasswordToken: hashedToken,
      forgotPasswordTokenExpires: tokenExpiry,
    },
  });
  await new Email(user).sendPasswordReset(forgotPasswordLink);

  return;
};

const resetPassword = async (token: string, password: string) => {
  const hashedToken = verification.generateHashedToken(token);
  const user = await prisma.user.findFirstOrThrow({
    where: {
      forgotPasswordToken: hashedToken,
    },
  });
  if (
    user.forgotPasswordTokenExpires &&
    user.forgotPasswordTokenExpires < new Date(Date.now())
  ) {
    throw new AppError(
      httpStatus.BAD_REQUEST,
      'Password reset token has expired, please try forget password again.',
    );
  }
  const hashedPassword = await bcrypt.hash(
    password,
    Number(config.bcrypt_salt_rounds) || 12,
  );

  const updatedUser = await prisma.user.update({
    where: {
      id: user.id,
    },
    data: {
      password: hashedPassword,
      forgotPasswordToken: null,
      forgotPasswordTokenExpires: null,
    },
  });

  return updatedUser;
};

const sendResetPasswordLink = async (email: string) => {
  const user = await prisma.user.findUnique({
    where: { email: email },
  });
  if (!user) {
    throw new AppError(404, 'User not found');
  }

  const accessToken = generateToken(
    {
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
    },
    config.jwt.access_secret as Secret,
    '3m',
  );

  const verificationLink = `https://bolubocool-ecommerce-server.vercel.app/send-link?token=${accessToken}`;
  const subject = 'Reset your password';
  const html = emailBody(user.name, verificationLink);
  await sendEmail(user.email, subject, html);

  return;
};

const resetNewPassword = async (userId: string, newPassword: string) => {
  const existingUser = await prisma.user.findUnique({
    where: { id: userId },
  });
  if (!existingUser) {
    throw new AppError(404, 'User not found');
  }

  const hashedPassword = await bcrypt.hash(
    newPassword,
    Number(config.bcrypt_salt_rounds) || 12,
  );

  await prisma.user.update({
    where: {
      id: existingUser.id,
    },
    data: {
      password: hashedPassword,
    },
  });
  return;
};

const createSubAccount = async (req: Request) => {
  const { vendor } = req.body;
  const existingUser = await prisma.user.findUnique({
    where: { email: vendor.email },
  });
  if (!existingUser) {
    throw new AppError(404, 'User not found');
  }

  const params = JSON.stringify({
    business_name: vendor.business_name,
    bank_code: vendor.bank_code,
    account_number: vendor.account_number,
    percentage_charge: 90,
    primary_contact_email: existingUser.email,
    primary_contact_name: existingUser.name,
    settlement_bank: vendor.bank_name,
    metadata: {
      vendor_id: vendor.id,
    },
  });

  const options = {
    hostname: 'api.paystack.co',
    port: 443,
    path: '/subaccount',
    method: 'POST',
    headers: {
      Authorization: 'Bearer sk_test_a6c7ec575520726e8d247f2ec1a66a4bbf233e95',
      'Content-Type': 'application/json',
    },
  };

  return new Promise(async (resolve, reject) => {
    const reqs = https.request(options, (res: any) => {
      let data = '';

      res.on('data', (chunk: Buffer | string) => {
        data += chunk.toString();
      });

      res.on('end', async () => {
        try {
          const parsed = JSON.parse(data);

          if (parsed.status && parsed.data && parsed.data.subaccount_code) {
            const updatedUser = await prisma.user.update({
              where: { email: vendor.email },
              data: { paystackAccountCode: parsed.data.subaccount_code },
            });
            resolve({ paystackResponse: parsed, updatedUser });
          } else {
            reject(new Error('Invalid response from Paystack'));
          }
        } catch (err) {
          reject(new Error('Failed to parse Paystack response'));
        }
      });
    });

    reqs.on('error', error => {
      reject(error);
    });

    reqs.write(params);
    reqs.end();
  });
};

const regenerateStripeConnectAccountLink = async (sellerId: string) => {
  const existingSeller = await prisma.user.findUnique({
    where: { id: sellerId, role: 'SELLER' },
  });
  if (!existingSeller) {
    throw new AppError(404, 'Seller Not found');
  }
  if (!existingSeller.stripeAccountId) {
    throw new AppError(400, 'Stripe account not found for this seller');
  }
  const account = await stripe.accounts.retrieve(
    existingSeller?.stripeAccountId as string,
  );
  if (!account.charges_enabled) {
    const accountLink = await stripe.accountLinks.create({
      account: existingSeller.stripeAccountId as string,
      refresh_url: 'https://yourdomain.com/reauth',
      return_url:
        'https://bolubocool-ecommerce-server.vercel.app/account/connect/success',
      // return_url: "https://admin.staylocal.online",
      type: 'account_onboarding',
    });

    return accountLink.url;
  } else {
    throw new AppError(409, 'Your account is already connected');
  }
};

export const AuthServices = {
  loginUserFromDB,
  forgotPassword,
  resetPassword,
  sendResetPasswordLink,
  resetNewPassword,
  createSubAccount,
  regenerateStripeConnectAccountLink,
};
