import { StoreCategory, User, UserRoleEnum, UserStatus } from '@prisma/client';
import * as bcrypt from 'bcrypt';
import prisma from '../../utils/prisma';
import Email from '../../utils/email';
import { verification } from '../../helpers/generateEmailVerificationLink';
import AppError from '../../errors/AppError';
import httpStatus from 'http-status';
import { uploadToS3 } from '../../helpers/fileUploaderToS3';
import QueryBuilder from '../../builder/QueryBuilder';
import { createCustomerStripeAccount } from '../../helpers/creaeteStripeAccont';
import { Secret } from 'jsonwebtoken';
import config from '../../../config';
import Stripe from 'stripe';
import { generateToken } from '../../utils/generateToken';
import { emailBody, sellerApprovalEmail } from '../../helpers/emailBody';
// import { sendEmail } from '../../helpers/brevo';
import sendEmail from '../../helpers/email';
import { sendOTPThroughBrevo } from '../../utils/sendEmailBrevo';

const stripe = new Stripe(config.stripe.STRIPE_SECRET_KEY as string);

interface UserWithOptionalPassword extends Omit<User, 'password'> {
  password?: string;
}
const registerAccountIntoDB = async (
  payload: any,
  files: Express.Multer.File[],
) => {
  const hashedPassword: string = await bcrypt.hash(payload.password, 12);
  const sellerDocs: string[] = [];
  const userData = {
    name: payload.firstName
      ? payload.firstName + ' ' + payload.lastName
      : payload.name,
    ...payload,
    password: hashedPassword,
  };
  delete userData.firstName;
  delete userData.lastName;
  if (payload.role === UserRoleEnum.SELLER) {
    userData.status = UserStatus.PENDING;
  }

  if (files) {
    for (const file of files) {
      const fileBuffer = file.buffer;
      const originalName = file.originalname;
      const mimeType = file.mimetype;
      const fileUrl = await uploadToS3(fileBuffer, originalName, mimeType);
      sellerDocs.push(fileUrl);
    }
  }

  let stripeAccountId: string | null = null;
  let accountLinkData = null;

  if (payload.role === UserRoleEnum.CUSTOMER) {
    const stripeAccount = await createCustomerStripeAccount(
      payload.email,
      userData.name,
    );
    stripeAccountId = stripeAccount.id;
  }

  if (payload.role === UserRoleEnum.SELLER) {
    const account = await stripe.accounts.create({
      type: 'express',
      capabilities: {
        transfers: { requested: true },
      },
    });

    stripeAccountId = account.id;

    accountLinkData = await stripe.accountLinks.create({
      account: account.id,
      refresh_url: 'https://yourdomain.com/reauth',
      return_url:
        'https://bolubocool-ecommerce-server.vercel.app/account/connect/success',
      type: 'account_onboarding',
    });
  }

  if (!stripeAccountId) {
    throw new AppError(404, 'Stripe acccount creation failed');
  }
  const newUser = await prisma.user.create({
    data: {
      ...userData,
      stripeAccountId,
      sellerDocs,
    },
  });
  const accessToken = generateToken(
    {
      id: newUser.id,
      name: userData.name,
      email: userData.email,
      role: newUser.role,
    },
    config.jwt.access_secret as Secret,
    '3m',
  );
  const verificationLink = `https://bolubocool-ecommerce-server.vercel.app/verify-email?token=${accessToken}`;
  const subject = 'Your Account Verification';
  const html = emailBody(userData.name, verificationLink);
  await sendEmail(userData.email, subject, html);
  // await sendOTPThroughBrevo(userData.email, html);

  return {
    newUser,
    accountLink: accountLinkData?.url,
  };
};

//  fetch('https://bolubocool-ecommerce-server.vercel.app/api/v1/order/capture-payment/${token}', {
//             method: 'POST'
//           })

const verifyEmailThroughLink = async (userId: string) => {
  await prisma.user.findFirstOrThrow({
    where: { id: userId },
  });

  await prisma.user.update({
    where: { id: userId },
    data: { isEmailVerified: true },
  });
  return;
};

const registerUserIntoDB = async (
  payload: any,
  files: Express.Multer.File[],
) => {
  const hashedPassword: string = await bcrypt.hash(payload.password, 12);
  const sellerDocs: string[] = [];
  const userData = {
    name: payload.firstName
      ? payload.firstName + ' ' + payload.lastName
      : payload.name,
    ...payload,
    password: hashedPassword,
  };
  delete userData.firstName;
  delete userData.lastName;
  if (payload.role === UserRoleEnum.SELLER) {
    userData.status = UserStatus.PENDING;
  }

  if (files) {
    for (const file of files) {
      const fileBuffer = file.buffer;
      const originalName = file.originalname;
      const mimeType = file.mimetype;
      const fileUrl = await uploadToS3(fileBuffer, originalName, mimeType);
      sellerDocs.push(fileUrl);
    }
  }
  const newUser = await prisma.user.create({
    data: {
      ...userData,
      sellerDocs,
    },
  });
  await resendUserVerificationEmail(newUser.email);
  // stripeServices.createConnectedAccount(userData.id).catch(error => {
  //   console.error('Error creating connected account:', error);
  // });
  const userWithOptionalPassword = newUser as UserWithOptionalPassword;
  delete userWithOptionalPassword.password;

  return userWithOptionalPassword;
};

const getAllUsersFromDB = async (queryOptions: any) => {
  const query = new QueryBuilder(prisma.user, queryOptions);
  const result = await query
    .search(['name', 'city', 'country'])
    .sort()
    .filter()
    .paginate()
    .execute();
  const pagination = await query.countTotal();

  return {
    result,
    pagination,
  };
};

const getMyProfileFromDB = async (id: string) => {
  const Profile = await prisma.user.findUniqueOrThrow({
    where: {
      id: id,
    },
  });

  return Profile;
};

const getPendingSellers = async () => {
  const sellers = await prisma.user.findMany({
    where: {
      role: 'SELLER',
      status: 'PENDING',
    },
  });
  return sellers;
};

const getUserDetailsFromDB = async (id: string) => {
  const user = await prisma.user.findUniqueOrThrow({
    where: { id },
  });
  return user;
};

const updateMyProfileIntoDB = async (
  id: string,
  payload: any,
  files: Express.Multer.File[],
) => {
  const userData = payload;
  let fileUrls: string[] = [];
  delete userData.password;
  delete userData.role;
  if (files) {
    for (const file of files) {
      const fileBuffer = file.buffer;
      const originalName = file.originalname;
      const mimeType = file.mimetype;
      const fileUrl = await uploadToS3(fileBuffer, originalName, mimeType);
      fileUrls.push(fileUrl);
    }
    userData.avatarUrl = fileUrls[0];
  }

  // update user data
  const updatedUser = await prisma.user.update({
    where: { id },
    data: userData,
  });

  const userWithOptionalPassword = updatedUser as UserWithOptionalPassword;
  delete userWithOptionalPassword.password;

  return userWithOptionalPassword;
};

const updateUserRoleStatusIntoDB = async (id: string, payload: any) => {
  const result = await prisma.user.update({
    where: {
      id: id,
    },
    data: { role: payload.role },
  });
  return result;
};

const changePassword = async (userId: string, payload: any) => {
  const userData = await prisma.user.findUniqueOrThrow({
    where: {
      id: userId,
      status: 'ACTIVE',
    },
  });

  const isCorrectPassword: boolean = await bcrypt.compare(
    payload.password,
    userData.password,
  );

  if (!isCorrectPassword) {
    throw new AppError(httpStatus.BAD_REQUEST, 'Password incorrect!');
  }

  const hashedPassword: string = await bcrypt.hash(payload.newPassword, 12);

  await prisma.user.update({
    where: {
      id: userData.id,
    },
    data: {
      password: hashedPassword,
    },
  });

  return {
    message: 'Password changed successfully!',
  };
};

const verifyUserEmail = async (token: string) => {
  const hashedToken = verification.generateHashedToken(token);
  const user = await prisma.user.findFirst({
    where: {
      emailVerificationToken: hashedToken,
    },
  });

  if (!user) {
    throw new AppError(
      httpStatus.BAD_REQUEST,
      'Invalid email verification token.',
    );
  }
  if (
    user.emailVerificationTokenExpires &&
    user.emailVerificationTokenExpires < new Date(Date.now())
  ) {
    throw new AppError(
      httpStatus.BAD_REQUEST,
      'Email verification token has expired. Please try resending the verification email again.',
    );
  }
  const updatedUser = await prisma.user.update({
    where: { id: user.id },
    data: {
      isEmailVerified: true,
      emailVerificationToken: null,
      emailVerificationTokenExpires: null,
    },
  });
  return updatedUser;
};

const resendUserVerificationEmail = async (email: string) => {
  const [emailVerificationLink, hashedToken] =
    verification.generateEmailVerificationLink();
  const user = await prisma.user.update({
    where: { email: email },
    data: {
      emailVerificationToken: hashedToken,
      emailVerificationTokenExpires: new Date(Date.now() + 3600 * 1000),
    },
  });
  console.log(emailVerificationLink);

  const emailSender = new Email(user);
  await emailSender.sendEmailVerificationLink(
    'Email verification link',
    emailVerificationLink,
  );
  return user;
};

const deleteSellerRequest = async (userId: string) => {
  const sponsorshipRequests = await prisma.user.delete({
    where: {
      id: userId,
    },
  });
  return sponsorshipRequests;
};

const approveSellerRequest = async (userId: string) => {
  const user = await prisma.user.findUniqueOrThrow({
    where: { id: userId },
  });

  const sponsorshipRequests = await prisma.user.update({
    where: {
      id: userId,
    },
    data: {
      status: 'ACTIVE',
    },
  });
  const category = user.storeCategory == "UNIVERSITY" ? "universities" : "secondary-school"
  const subject = 'Account verified by admin';
  const website = `https://bolubocool-frontend.vercel.app/${category}/${user.name}?id=${user.id}`;
  const html = sellerApprovalEmail(user.name, website);
  await sendEmail(user.email, subject, html);

  return sponsorshipRequests;
};

const getStoreCategoryIntoDB = async () => {
  const secondarySchool = await prisma.user.findMany({
    where: {
      storeCategory: 'SECONDARY_SCHOOL',
    },
  });
  const university = await prisma.user.findMany({
    where: {
      storeCategory: 'UNIVERSITY',
    },
  });
  const others = await prisma.user.findMany({
    where: {
      storeCategory: 'OTHERS',
    },
  });
  return { secondarySchool, university, others };
};

const getAllCountsFromDB = async () => {
  const [totalUsers, totalCustomers, totalSellers, revenueResult] =
    await Promise.all([
      prisma.user.count(),
      prisma.user.count({ where: { role: 'CUSTOMER' } }),
      prisma.user.count({ where: { role: 'SELLER' } }),
      prisma.order.aggregate({
        _sum: {
          totalAmount: true,
        },
      }),
    ]);

  return {
    data: {
      user: totalUsers,
      customer: totalCustomers,
      seller: totalSellers,
      revenue: revenueResult._sum.totalAmount ?? 0,
    },
    message: 'All counts retrieved successfully',
  };
};

export const UserServices = {
  registerUserIntoDB,
  getAllUsersFromDB,
  getPendingSellers,
  getMyProfileFromDB,
  getUserDetailsFromDB,
  updateMyProfileIntoDB,
  updateUserRoleStatusIntoDB,
  changePassword,
  verifyUserEmail,
  resendUserVerificationEmail,
  deleteSellerRequest,
  approveSellerRequest,
  getAllCountsFromDB,
  getStoreCategoryIntoDB,
  registerAccountIntoDB,
  verifyEmailThroughLink,
};
