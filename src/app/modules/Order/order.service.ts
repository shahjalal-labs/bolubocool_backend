import prisma from '../../utils/prisma';
import { Order, OrderStatus, UserRoleEnum } from '@prisma/client';
import { stripeServices } from '../stripe/stripe.service';
import { IPaginationOptions } from '../../interface/pagination.type';
import { calculatePagination } from '../../utils/calculatePagination';
import AppError from '../../errors/AppError';
import httpStatus from 'http-status';
import {
  bookShipmentAsDraft,
  cancelShipment,
  initializeSplitPaymentHelper,
  payForShipment,
} from '../paystack/paystack.service';
import axios from 'axios';

const createOrderIntoDB = async (userData: any, payload: any) => {
  const paymentMethodId = payload.paymentMethodId;
  delete payload.paymentMethodId;

  if (userData.role !== UserRoleEnum.CUSTOMER) {
    throw new AppError(
      httpStatus.BAD_REQUEST,
      'Only customers can place orders.',
    );
  }

  let totalAmount = 0;
  const products = payload.products;
  delete payload.products;

  for (const item of products) {
    const product = await prisma.product.findUnique({
      where: { id: item.id },
    });

    if (!product) {
      throw new AppError(httpStatus.NOT_FOUND, `Product not found: ${item.id}`);
    }

    if (product.stock < item.quantity) {
      throw new AppError(
        httpStatus.BAD_REQUEST,
        `Not enough stock for product: ${product.name}`,
      );
    }

    totalAmount +=
      (product.price - (product.discount / 100) * product.price) *
      item.quantity;
    item.price = product.price;
  }

  const draftData = await bookShipmentAsDraft({
    productId: products[0].id,
    userId: userData.id,
    totalEstimatedCost: payload.totalEstimatedCost,
    pricingTier: payload.pricingTier,
    shipmentCharge: payload.shipmentCharge,
    pickupCharge: payload.pickupCharge,
    pickupPartner: payload.pickupPartner,
    address: payload.address,
  });

  if (!draftData) {
    throw new AppError(400, 'Shipping draft failed');
  }

  const payment = await payForShipment(draftData.id);

  if (!payment) {
    throw new AppError(400, 'Pay for draft failed');
  }

  const newAMount = totalAmount + payload.deliveryCharge;
  const charge = payload.deliveryCharge;

  delete payload.totalEstimatedCost;
  delete payload.pricingTier;
  delete payload.shipmentCharge;
  delete payload.pickupCharge;
  delete payload.pickupPartner;
  delete payload.deliveryCharge;

  const order = await prisma.$transaction(
    async prisma => {
      const newOrder = await prisma.order.create({
        data: {
          userId: userData.id,
          ...payload,
          totalAmount: newAMount,
          trackingId: payment.trackingId,
    
          paymentStatus: true,
          Orderitems: {
            create: products.map((product: any) => ({
              product: { connect: { id: product.id } },
              quantity: product.quantity,
              size: product.size,
            })),
          },
        },
        include: {
          Orderitems: {
            include: {
              product: {
                select: {
                  owner: {
                    select: {
                      id: true,
                      stripeAccountId: true,
                    },
                  },
                },
              },
            },
          },
        },
      });

      const paymentIntent = await stripeServices.createPaymentIntent(
        newAMount,
        userData.id,
        charge,
        newOrder.Orderitems[0].product.owner.stripeAccountId,
        paymentMethodId,
      );

      const updatedOrder = await prisma.order.update({
        where: { id: newOrder.id },
        data: { paymentIntentId: paymentIntent.id },
      });

      for (const item of products) {
        await prisma.product.update({
          where: { id: item.id },
          data: {
            stock: {
              decrement: item.quantity,
            },
          },
        });
      }
      await prisma.transaction.create({
        data: {
          userId: userData.id,
          paymentId: paymentIntent.id,
          amount: newAMount,
          currency: 'usd',
        },
      });

      return updatedOrder;
    },
    { timeout: 10000 },
  );

  return order;
};

const createOrderPaystackIntoDB = async (userData: any, payload: any) => {
  const { email } = payload;
  const seller = await prisma.user.findUnique({
    where: { id: payload.sellerId },
  });
  if (!seller) {
    throw new AppError(404, 'Seller not found');
  }
  const subaccountCode = seller.paystackAccountCode;
  delete payload.paymentMethodId;

  if (userData.role !== UserRoleEnum.CUSTOMER) {
    throw new AppError(
      httpStatus.BAD_REQUEST,
      'Only customers can place orders.',
    );
  }

  let totalAmount = 0;
  const products = payload.products;

  delete payload.products;

  for (const item of products) {
    const product = await prisma.product.findUnique({
      where: { id: item.id },
    });

    if (!product) {
      throw new AppError(httpStatus.NOT_FOUND, `Product not found: ${item.id}`);
    }

    if (product.stock < item.quantity) {
      throw new AppError(
        httpStatus.BAD_REQUEST,
        `Not enough stock for product: ${product.name}`,
      );
    }

    totalAmount +=
      (product.price - (product.discount / 100) * product.price) *
      item.quantity;
    item.price = product.price;
  }

  const newAmount = totalAmount + payload.deliveryCharge

  const {
    pricingTier,
    pickupCharge,
    pickupPartner,
    shipmentCharge,
    totalEstimatedCost,
    deliveryCharge,
    ...newPayload
  } = payload;

  const order = await prisma.$transaction(
    async prisma => {
      const newOrder = await prisma.order.create({
        data: {
          userId: userData.id,
          ...newPayload,
          totalAmount: newAmount,
          paymentStatus: false,
          Orderitems: {
            create: products.map((product: any) => ({
              product: { connect: { id: product.id } },
              quantity: product.quantity,
              size: product.size,
            })),
          },
        },
        include: {
          Orderitems: {
            include: {
              product: {
                select: {
                  owner: {
                    select: {
                      id: true,
                      stripeAccountId: true,
                    },
                  },
                },
              },
            },
          },
        },
      });

      await prisma.draft.create({
        data: {
          productId: products[0].id,
          bookingId: newOrder.id,
          userId: userData.id,
          totalEstimatedCost: payload.totalEstimatedCost,
          pricingTier: payload.pricingTier,
          shipmentCharge: payload.shipmentCharge,
          pickupCharge: payload.pickupCharge,
          pickupPartner: payload.pickupPartner,
          address: payload.address,
        },
      });

      const paystackInit = await initializeSplitPaymentHelper(
        email,
        newAmount,
        subaccountCode as string,
      );

      if (!paystackInit?.data?.reference) {
        throw new AppError(
          httpStatus.INTERNAL_SERVER_ERROR,
          'Failed to initialize Paystack payment',
        );
      }
      const paystackReference = paystackInit.data.reference;

      const updatedOrder = await prisma.order.update({
        where: { id: newOrder.id },
        data: { paystackReference },
      });

      await prisma.transaction.create({
        data: {
          userId: userData.id,
          paymentId: paystackReference,
          amount: newAmount,
          currency: 'usd',
        },
      });

      for (const item of products) {
        await prisma.product.update({
          where: { id: item.id },
          data: {
            stock: {
              decrement: item.quantity,
            },
          },
        });
      }

      return {
        ...updatedOrder,
        paystackCheckoutUrl: paystackInit.data.authorization_url,
      };
    },
    { timeout: 10000 },
  );

  return order;
};

const capturePaystackPayment = async (reference: string) => {
  const response = await axios.get(
    `https://api.paystack.co/transaction/verify/${reference}`,
    {
      headers: {
        Authorization: `Bearer sk_test_a6c7ec575520726e8d247f2ec1a66a4bbf233e95`,
      },
    },
  );

  const result = response.data;

  if (!result.status || result.data.status !== 'success') {
    await prisma.order.deleteMany({
      where: { paystackReference: reference },
    });
    throw new AppError(400, 'Payment not successful');
  }

  const booking = await prisma.order.findFirst({
    where: { paystackReference: reference },
  });
  if (!booking) {
    throw new AppError(404, 'Booking not found');
  }

  const draft = await prisma.draft.findFirst({
    where: { bookingId: booking.id },
  });

  if (!draft) {
    throw new AppError(404, 'Draft not found');
  }

  const draftData = await bookShipmentAsDraft({
    productId: draft.productId,
    userId: draft.userId,
    totalEstimatedCost: draft.totalEstimatedCost,
    pricingTier: draft.pricingTier,
    shipmentCharge: draft.shipmentCharge,
    pickupCharge: draft.pickupCharge,
    pickupPartner: draft.pickupPartner,
    address: draft.address,
  }); 

  if (!draftData) {
    throw new AppError(400, 'Shipping draft failed');
  }

  const payment = await payForShipment(draftData.id);

  const updatedOrder = await prisma.order.updateMany({
    where: { paystackReference: reference },
    data: { paymentStatus: true, trackingId: payment.trackingId },
  });

  return updatedOrder;
};

const getAllOrderFromDB = async (paginationOptions: IPaginationOptions) => {
  const { limit, skip } = calculatePagination(paginationOptions);
  const orders = await prisma.order.findMany({
    where: { paymentStatus: true },
    take: limit,
    skip,
    include: {
      Orderitems: {
        select: {
          product: {
            select: {
              owner: {
                select: {
                  name: true,
                },
              },
            },
          },
        },
      },
    },
  });
  const totalOrders = await prisma.order.count({
    take: limit,
    skip,
  });
  const totalPages = Math.ceil(totalOrders / limit);
  return {
    orders,
    pagination: {
      totalOrders,
      totalPages,
      currentPage: Math.floor(skip / limit) + 1,
    },
  };
};

// const getSellerOrders = async (
//   userId: string,
//   paginationOptions: IPaginationOptions,
// ) => {
//   const { limit, skip } = calculatePagination(paginationOptions);
//   const orders = await prisma.order.findMany({
//     where: {
//       sellerId: userId,
//     },
//     include: {
//       user: {
//         select: {
//           name: true,
//           phone: true,
//         },
//       },
//     },
//     take: limit,
//     skip,
//   });
//   return { orders, pagination: {} };
// };

const getMyOrders = async (
  userId: string,
  userRole: UserRoleEnum,
  paginationOptions: IPaginationOptions,
) => {
  const { skip, limit } = calculatePagination(paginationOptions);
  // const whereCondition =
  //   userRole === UserRoleEnum.CUSTOMER ? { userId } : { sellerId: userId };
  const whereCondition = {
    paymentStatus: true,
    ...(userRole === UserRoleEnum.CUSTOMER ? { userId } : { sellerId: userId }),
  };
  const orders = await prisma.order.findMany({
    where: whereCondition,
    include: {
      Orderitems: {
        include: {
          product: true,
        },
      },
    },
    orderBy: {
      createdAt: 'desc',
    },
    take: limit,
    skip,
  });
  const totalOrders = await prisma.order.count({
    where: whereCondition,
  });
  const totalPages = Math.ceil(totalOrders / limit);
  return {
    orders,
    totalOrders,
    totalPages,
    currentPage: Math.floor(skip / limit) + 1,
  };
};
const getSingleOrderFromDB = async (orderId: string) => {
  return await prisma.order.findUniqueOrThrow({
    where: {
      id: orderId,
    },
    include: {
      Orderitems: {
        include: {
          product: {
            select: {
              id: true,
              name: true,
              price: true,
              discount: true,
            },
          },
        },
      },
    },
  });
};

const updateOrderIntoDB = async (id: string, payload: Partial<Order>) => {
  const updatedOrder = await prisma.order.update({
    where: { id },
    data: payload,
  });
  return updatedOrder;
};

const deleteOrderFromDB = async (id: string) => {
  const order = await prisma.order.findUniqueOrThrow({
    where: { id },
  });
  const response = await cancelShipment(order.trackingId as string);
  console.log(response);
  await prisma.order.delete({
    where: { id },
  });
  return;
};

const acceptOrder = async (userId: string, orderId: string) => {
  const order = await prisma.order.findUniqueOrThrow({
    where: {
      id: orderId,
    },
  });
  if (order.sellerId !== userId) {
    throw new AppError(
      httpStatus.UNAUTHORIZED,
      'You cannot accept orders from other sellers.',
    );
  }
  if (order.status !== OrderStatus.PENDING) {
    throw new AppError(
      httpStatus.BAD_REQUEST,
      'This offer is already accepted.',
    );
  }
  const updatedOrder = await prisma.order.update({
    where: {
      id: orderId,
    },
    data: {
      status: 'PROCESSED',
    },
  });
  return updatedOrder;
};

export const OrderServices = {
  createOrderIntoDB,
  getAllOrderFromDB,
  getMyOrders,
  createOrderPaystackIntoDB,
  getSingleOrderFromDB,
  updateOrderIntoDB,
  deleteOrderFromDB,
  acceptOrder,
  capturePaystackPayment,
};
