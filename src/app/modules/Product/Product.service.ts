import httpStatus from 'http-status';
import AppError from '../../errors/AppError';
import { uploadToS3 } from '../../helpers/fileUploaderToS3';
import prisma from '../../utils/prisma';
import { Product } from '@prisma/client';
import { IPaginationOptions } from '../../interface/pagination.type';
import { calculatePagination } from '../../utils/calculatePagination';
import QueryBuilder from '../../builder/QueryBuilder';
import Stripe from 'stripe';
import config from '../../../config';
import {
  subDays,
  subWeeks,
  subMonths,
  subYears,
  differenceInDays,
  format,
} from 'date-fns';

interface TimeStat {
  totalOrders: number;
  totalRevenue: number;
}

interface AnalyticsRange {
  range: 'daily' | 'weekly' | 'monthly' | 'yearly';
}

const stripe = new Stripe(config.stripe.STRIPE_SECRET_KEY as string);

const createProductIntoDB = async (
  userId: string,
  payload: Product,
  files: Express.Multer.File[],
) => {
  const user = await prisma.user.findFirstOrThrow({
    where: {
      id: userId,
    },
  });

  if (!user.paystackAccountCode) {
    throw new AppError(404, 'Your account is not ready for payment');
  }
  const account = await stripe.accounts.retrieve(
    user.stripeAccountId as string,
  );
  if (!account.charges_enabled) {
    const accountLink = await stripe.accountLinks.create({
      account: user.stripeAccountId as string,
      refresh_url: 'https://yourdomain.com/reauth',
      return_url:
        'https://bolubocool-ecommerce-server.vercel.app/account/connect/success',
      type: 'account_onboarding',
    });

    throw new AppError(403, accountLink.url);
  }

  let imageUrls: string[] = [];
  if (files) {
    for (const file of files) {
      const fileBuffer = file.buffer;
      const originalName = file.originalname;
      const mimeType = file.mimetype;
      const fileUrl = await uploadToS3(fileBuffer, originalName, mimeType);
      imageUrls.push(fileUrl);
    }
  }
  const newProduct = await prisma.product.create({
    data: {
      ...payload,
      ownerId: userId,
      imageUrls,
    },
  });
  return newProduct;
};

//  category start
const createCategoryFromDB = async (payload: any) => {
  const categories = await prisma.category.findFirst({
    where: { title: payload.title },
  });

  if (categories) {
    throw new AppError(httpStatus.UNAUTHORIZED, 'Categories already existing');
  }

  const result = await prisma.category.create({
    data: payload,
  });

  return result;
};

const allCategoryFromDB = async () => {
  const result = await prisma.category.findMany();

  return result;
};
const updateCategoryFromDB = async (id: string, payload: any) => {
  const updatedCategory = await prisma.category.update({
    where: { id },
    data: payload,
  });

  return updatedCategory;
};

const deleteCategoryFromDB = async (id: string) => {
  const deletedCategory = await prisma.category.delete({
    where: { id },
  });

  return deletedCategory;
};

// category end
const getAllProducts = async (queryOptions: Record<string, unknown>) => {
  const productQuery = new QueryBuilder(prisma.product, queryOptions);
  const products = await productQuery
    .search(['name', 'description'])
    .sort()
    .filter()
    .paginate()
    .execute();
  const pagination = await productQuery.countTotal();
  return {
    pagination,
    products,
  };
};

const getMyProductsFromDB = async (
  userId: string,
  paginationOptions: IPaginationOptions,
) => {
  const { limit, skip } = calculatePagination(paginationOptions);
  const products = await prisma.product.findMany({
    where: {
      ownerId: userId,
    },
    skip,
    take: limit,
    orderBy: {
      createdAt: 'desc',
    },
  });
  const totalProducts = await prisma.product.count({
    where: {
      ownerId: userId,
    },
  });
  const totalPages = Math.ceil(totalProducts / limit);
  return {
    products,
    pagination: {
      totalProducts,
      totalPages,
      currentPage: Math.floor(skip / limit) + 1,
    },
  };
};

const getSingleProductFromDB = async (id: string) => {
  return await prisma.product.findUniqueOrThrow({
    where: {
      id: id,
    },
    include: {
      Review: {
        include: {
          Author: {
            select: {
              id: true,
              name: true,
            },
          },
        },
      },
      owner: {
        select: {
          id: true,
          name: true,
          avatarUrl: true,
        },
      },
    },
  });
};

const updateProductIntoDB = async (
  userData: any,
  productId: string,
  payload: Partial<Product>,
) => {
  const product = await prisma.product.findUniqueOrThrow({
    where: {
      id: productId,
    },
  });
  if (product.ownerId !== userData.id) {
    throw new AppError(
      httpStatus.BAD_REQUEST,
      'Only product owner can update their product.',
    );
  }
  const updatedProduct = await prisma.product.update({
    where: { id: productId },
    data: payload,
  });
  return updatedProduct;
};

const deleteProductFromDB = async (id: string) => {
  return await prisma.product.delete({
    where: { id },
  });
};

const getCategoryByUserFromDB = async (userId: string) => {
  const user = await prisma.user.findFirst({ where: { id: userId } });

  console.log();

  if (!user) {
    throw new AppError(httpStatus.UNAUTHORIZED, 'User not found');
  }
  return await prisma.category.findMany({
    where: { userId: userId },
  });
};

const getSellerAnalytics = async (sellerId: string, range: AnalyticsRange) => {
  try {
    // Use UTC for all date operations to match database storage
    const now = new Date();
    const today = new Date(
      Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()),
    );

    let startDate: Date;
    let endDate: Date;

    // Set date ranges in UTC
    if (range.range === 'daily') {
      startDate = new Date(
        Date.UTC(
          today.getUTCFullYear(),
          today.getUTCMonth(),
          today.getUTCDate(),
        ),
      );
      endDate = new Date(
        Date.UTC(
          today.getUTCFullYear(),
          today.getUTCMonth(),
          today.getUTCDate(),
          23,
          59,
          59,
          999,
        ),
      );
    } else if (range.range === 'weekly') {
      const day = today.getUTCDay();
      const diff = today.getUTCDate() - day + (day === 0 ? -6 : 1); // Adjust for Sunday
      startDate = new Date(
        Date.UTC(today.getUTCFullYear(), today.getUTCMonth(), diff),
      );
      endDate = new Date(
        Date.UTC(
          startDate.getUTCFullYear(),
          startDate.getUTCMonth(),
          startDate.getUTCDate() + 6,
          23,
          59,
          59,
          999,
        ),
      );
    } else if (range.range === 'monthly') {
      startDate = new Date(
        Date.UTC(today.getUTCFullYear(), today.getUTCMonth(), 1),
      );
      endDate = new Date(
        Date.UTC(
          today.getUTCFullYear(),
          today.getUTCMonth() + 1,
          0,
          23,
          59,
          59,
          999,
        ),
      );
    } else {
      // yearly
      startDate = new Date(Date.UTC(today.getUTCFullYear(), 0, 1));
      endDate = new Date(
        Date.UTC(today.getUTCFullYear(), 11, 31, 23, 59, 59, 999),
      );
    }

    // Debug: Log the dates being used for the query
    console.log('Query date range:', {
      startDate: startDate.toISOString(),
      endDate: endDate.toISOString(),
      range: range.range,
    });

    // Fetch orders with related data
    const orders = await prisma.order.findMany({
      where: {
        sellerId,
        createdAt: {
          gte: startDate,
          lte: endDate,
        },
        status: { not: 'PENDING' }, // Exclude pending orders
      },
      include: {
        Orderitems: {
          include: {
            product: {
              select: {
                id: true,
                name: true,
                category: true,
                price: true,
              },
            },
          },
        },
      },
      orderBy: {
        createdAt: 'asc',
      },
    });

    // Initialize analytics objects
    const timeStats: Record<string, TimeStat> = {};
    const categorySales: Record<string, { quantity: number; revenue: number }> =
      {};
    const productSales: Record<
      string,
      { name: string; quantity: number; revenue: number }
    > = {};
    const orderStatusCounts: Record<string, number> = {
      PROCESSED: 0,
      SHIPPED: 0,
      DELIVERED: 0,
    };

    let totalRevenue = 0;
    let totalOrders = 0;
    let averageOrderValue = 0;
    let bestSellingProduct = { name: '', quantity: 0, revenue: 0 };
    let topCategory = { name: '', revenue: 0 };

    // Process each order
    for (const order of orders) {
      totalOrders++;
      totalRevenue += Number(order.totalAmount);

      // Time-based statistics
      const timeKey =
        range.range === 'daily'
          ? format(order.createdAt, 'HH:mm') // Hour:Minute
          : range.range === 'weekly'
            ? format(order.createdAt, 'EEEE') // Day name
            : range.range === 'monthly'
              ? format(order.createdAt, 'dd') // Day of month
              : format(order.createdAt, 'MMMM'); // Month name

      if (!timeStats[timeKey]) {
        timeStats[timeKey] = { totalOrders: 0, totalRevenue: 0 };
      }
      timeStats[timeKey].totalOrders += 1;
      timeStats[timeKey].totalRevenue += Number(order.totalAmount);

      // Order status counts
      orderStatusCounts[order.status] =
        (orderStatusCounts[order.status] || 0) + 1;

      // Process each item in the order
      for (const item of order.Orderitems) {
        const product = item.product;
        const category = product.category || 'Unknown';
        const itemRevenue = product.price * item.quantity;

        // Category statistics
        if (!categorySales[category]) {
          categorySales[category] = { quantity: 0, revenue: 0 };
        }
        categorySales[category].quantity += item.quantity;
        categorySales[category].revenue += itemRevenue;

        // Product statistics
        if (!productSales[product.id]) {
          productSales[product.id] = {
            name: product.name,
            quantity: 0,
            revenue: 0,
          };
        }
        productSales[product.id].quantity += item.quantity;
        productSales[product.id].revenue += itemRevenue;

        // Track best selling product
        if (productSales[product.id].quantity > bestSellingProduct.quantity) {
          bestSellingProduct = {
            name: product.name,
            quantity: productSales[product.id].quantity,
            revenue: productSales[product.id].revenue,
          };
        }
      }
    }

    // Calculate average order value
    averageOrderValue = totalOrders > 0 ? totalRevenue / totalOrders : 0;

    // Find top category
    Object.entries(categorySales).forEach(([category, stats]) => {
      if (stats.revenue > topCategory.revenue) {
        topCategory = { name: category, revenue: stats.revenue };
      }
    });

    // Prepare time series data in sorted order
    const sortedTimeStats = Object.entries(timeStats)
      .sort(([a], [b]) => {
        if (range.range === 'daily') return a.localeCompare(b);
        if (range.range === 'weekly')
          return dayOfWeekValue2(a) - dayOfWeekValue2(b);
        if (range.range === 'monthly') return parseInt(a) - parseInt(b);
        return 0;
      })
      .reduce((acc, [key, value]) => ({ ...acc, [key]: value }), {});

    // Get comparison metrics
    const comparison = await getComparisonMetric2(
      sellerId,
      startDate,
      endDate,
      range,
    );

    return {
      timeRange: range.range,
      summary: {
        totalRevenue,
        totalOrders,
        averageOrderValue,
        bestSellingProduct,
        topCategory,
      },
      timeStats: sortedTimeStats,
      categorySales,
      productSales: Object.values(productSales)
        .sort((a, b) => b.quantity - a.quantity)
        .slice(0, 5), // Top 5 products
      orderStatusDistribution: orderStatusCounts,
      comparison,
    };
  } catch (error) {
    console.error('Error in getSellerAnalytics:', error);
    throw new Error('Failed to fetch seller analytics');
  }
};

// Helper function for weekly sorting
function dayOfWeekValue2(dayName: string): number {
  const days = [
    'Sunday',
    'Monday',
    'Tuesday',
    'Wednesday',
    'Thursday',
    'Friday',
    'Saturday',
  ];
  return days.indexOf(dayName);
}

// Helper function to get comparison metrics
async function getComparisonMetric2(
  sellerId: string,
  startDate: Date,
  endDate: Date,
  range: AnalyticsRange,
) {
  let previousStartDate: Date;
  let previousEndDate: Date;
  const duration = differenceInDays(endDate, startDate);

  if (range.range === 'daily') {
    previousStartDate = subDays(startDate, 1);
    previousEndDate = subDays(endDate, 1);
  } else if (range.range === 'weekly') {
    previousStartDate = subWeeks(startDate, 1);
    previousEndDate = subWeeks(endDate, 1);
  } else if (range.range === 'monthly') {
    previousStartDate = subMonths(startDate, 1);
    previousEndDate = subMonths(endDate, 1);
  } else {
    previousStartDate = subYears(startDate, 1);
    previousEndDate = subYears(endDate, 1);
  }

  const currentStats = await prisma.order.aggregate({
    where: {
      sellerId,
      createdAt: { gte: startDate, lte: endDate },
      status: { not: 'PENDING' },
    },
    _sum: { totalAmount: true },
    _count: true,
  });

  const previousStats = await prisma.order.aggregate({
    where: {
      sellerId,
      createdAt: { gte: previousStartDate, lte: previousEndDate },
      status: { not: 'PENDING' },
    },
    _sum: { totalAmount: true },
    _count: true,
  });

  const currentRevenue = currentStats._sum.totalAmount || 0;
  const previousRevenue = previousStats._sum.totalAmount || 0;
  const revenueChange =
    previousRevenue !== 0
      ? ((currentRevenue - previousRevenue) / previousRevenue) * 100
      : currentRevenue > 0
        ? 100
        : 0;

  const currentOrders = currentStats._count || 0;
  const previousOrders = previousStats._count || 0;
  const ordersChange =
    previousOrders !== 0
      ? ((currentOrders - previousOrders) / previousOrders) * 100
      : currentOrders > 0
        ? 100
        : 0;

  return {
    revenueChange,
    ordersChange,
    previousPeriod: {
      start: previousStartDate,
      end: previousEndDate,
      revenue: previousRevenue,
      orders: previousOrders,
    },
  };
}

// Example usage
// const analytics = await getSellerAnalytics('some-seller-id', { range: 'daily' });
// console.log(analytics);

interface TimeStat {
  totalOrders: number;
  totalRevenue: number;
}

interface AnalyticsRange {
  range: 'daily' | 'weekly' | 'monthly' | 'yearly';
}

export const getAdminAnalytics = async (range: AnalyticsRange) => {
  const now = new Date();
  const today = new Date(
    Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()),
  );

  let startDate: Date;
  let endDate: Date;

  if (range.range === 'daily') {
    startDate = new Date(
      Date.UTC(today.getUTCFullYear(), today.getUTCMonth(), today.getUTCDate()),
    );
    endDate = new Date(
      Date.UTC(
        today.getUTCFullYear(),
        today.getUTCMonth(),
        today.getUTCDate(),
        23,
        59,
        59,
        999,
      ),
    );
  } else if (range.range === 'weekly') {
    const day = today.getUTCDay();
    const diff = today.getUTCDate() - day + (day === 0 ? -6 : 1);
    startDate = new Date(
      Date.UTC(today.getUTCFullYear(), today.getUTCMonth(), diff),
    );
    endDate = new Date(
      Date.UTC(
        startDate.getUTCFullYear(),
        startDate.getUTCMonth(),
        startDate.getUTCDate() + 6,
        23,
        59,
        59,
        999,
      ),
    );
  } else if (range.range === 'monthly') {
    startDate = new Date(
      Date.UTC(today.getUTCFullYear(), today.getUTCMonth(), 1),
    );
    endDate = new Date(
      Date.UTC(
        today.getUTCFullYear(),
        today.getUTCMonth() + 1,
        0,
        23,
        59,
        59,
        999,
      ),
    );
  } else {
    startDate = new Date(Date.UTC(today.getUTCFullYear(), 0, 1));
    endDate = new Date(
      Date.UTC(today.getUTCFullYear(), 11, 31, 23, 59, 59, 999),
    );
  }

  const orders = await prisma.order.findMany({
    where: {
      createdAt: { gte: startDate, lte: endDate },
      status: { not: 'PENDING' },
    },
    include: {
      Orderitems: {
        include: {
          product: {
            select: {
              id: true,
              name: true,
              category: true,
              price: true,
            },
          },
        },
      },
    },
    orderBy: { createdAt: 'asc' },
  });

  const timeStats: Record<string, TimeStat> = {};
  const categorySales: Record<string, { quantity: number; revenue: number }> =
    {};
  const productSales: Record<
    string,
    { name: string; quantity: number; revenue: number }
  > = {};
  const orderStatusCounts: Record<string, number> = {
    PROCESSED: 0,
    SHIPPED: 0,
    DELIVERED: 0,
  };

  let totalRevenue = 0;
  let totalOrders = 0;
  let averageOrderValue = 0;
  let bestSellingProduct = { name: '', quantity: 0, revenue: 0 };
  let topCategory = { name: '', revenue: 0 };

  for (const order of orders) {
    totalOrders++;
    totalRevenue += Number(order.totalAmount);

    const timeKey =
      range.range === 'daily'
        ? format(order.createdAt, 'HH:mm')
        : range.range === 'weekly'
          ? format(order.createdAt, 'EEEE')
          : range.range === 'monthly'
            ? format(order.createdAt, 'dd')
            : format(order.createdAt, 'MMMM');

    if (!timeStats[timeKey]) {
      timeStats[timeKey] = { totalOrders: 0, totalRevenue: 0 };
    }
    timeStats[timeKey].totalOrders += 1;
    timeStats[timeKey].totalRevenue += Number(order.totalAmount);

    orderStatusCounts[order.status] =
      (orderStatusCounts[order.status] || 0) + 1;

    for (const item of order.Orderitems) {
      const product = item.product;
      const category = product.category || 'Unknown';
      const itemRevenue = product.price * item.quantity;

      if (!categorySales[category]) {
        categorySales[category] = { quantity: 0, revenue: 0 };
      }
      categorySales[category].quantity += item.quantity;
      categorySales[category].revenue += itemRevenue;

      if (!productSales[product.id]) {
        productSales[product.id] = {
          name: product.name,
          quantity: 0,
          revenue: 0,
        };
      }
      productSales[product.id].quantity += item.quantity;
      productSales[product.id].revenue += itemRevenue;

      if (productSales[product.id].quantity > bestSellingProduct.quantity) {
        bestSellingProduct = {
          name: product.name,
          quantity: productSales[product.id].quantity,
          revenue: productSales[product.id].revenue,
        };
      }
    }
  }

  averageOrderValue = totalOrders > 0 ? totalRevenue / totalOrders : 0;

  Object.entries(categorySales).forEach(([category, stats]) => {
    if (stats.revenue > topCategory.revenue) {
      topCategory = { name: category, revenue: stats.revenue };
    }
  });

  const sortedTimeStats = Object.entries(timeStats)
    .sort(([a], [b]) => {
      if (range.range === 'daily') return a.localeCompare(b);
      if (range.range === 'weekly')
        return dayOfWeekValue(a) - dayOfWeekValue(b);
      if (range.range === 'monthly') return parseInt(a) - parseInt(b);
      return 0;
    })
    .reduce((acc, [key, value]) => ({ ...acc, [key]: value }), {});

  const comparison = await getComparisonMetrics(startDate, endDate, range);

  return {
    timeRange: range.range,
    summary: {
      totalRevenue,
      totalOrders,
      averageOrderValue,
      bestSellingProduct,
      topCategory,
    },
    timeStats: sortedTimeStats,
    categorySales,
    productSales: Object.values(productSales)
      .sort((a, b) => b.quantity - a.quantity)
      .slice(0, 5),
    orderStatusDistribution: orderStatusCounts,
    comparison,
  };
};

function dayOfWeekValue(dayName: string): number {
  const days = [
    'Sunday',
    'Monday',
    'Tuesday',
    'Wednesday',
    'Thursday',
    'Friday',
    'Saturday',
  ];
  return days.indexOf(dayName);
}

async function getComparisonMetrics(
  startDate: Date,
  endDate: Date,
  range: AnalyticsRange,
) {
  let previousStartDate: Date;
  let previousEndDate: Date;

  if (range.range === 'daily') {
    previousStartDate = subDays(startDate, 1);
    previousEndDate = subDays(endDate, 1);
  } else if (range.range === 'weekly') {
    previousStartDate = subWeeks(startDate, 1);
    previousEndDate = subWeeks(endDate, 1);
  } else if (range.range === 'monthly') {
    previousStartDate = subMonths(startDate, 1);
    previousEndDate = subMonths(endDate, 1);
  } else {
    previousStartDate = subYears(startDate, 1);
    previousEndDate = subYears(endDate, 1);
  }

  const currentStats = await prisma.order.aggregate({
    where: {
      createdAt: { gte: startDate, lte: endDate },
      status: { not: 'PENDING' },
    },
    _sum: { totalAmount: true },
    _count: true,
  });

  const previousStats = await prisma.order.aggregate({
    where: {
      createdAt: { gte: previousStartDate, lte: previousEndDate },
      status: { not: 'PENDING' },
    },
    _sum: { totalAmount: true },
    _count: true,
  });

  const currentRevenue = currentStats._sum.totalAmount || 0;
  const previousRevenue = previousStats._sum.totalAmount || 0;
  const revenueChange =
    previousRevenue !== 0
      ? ((currentRevenue - previousRevenue) / previousRevenue) * 100
      : currentRevenue > 0
        ? 100
        : 0;

  const currentOrders = currentStats._count || 0;
  const previousOrders = previousStats._count || 0;
  const ordersChange =
    previousOrders !== 0
      ? ((currentOrders - previousOrders) / previousOrders) * 100
      : currentOrders > 0
        ? 100
        : 0;

  return {
    revenueChange,
    ordersChange,
    previousPeriod: {
      start: previousStartDate,
      end: previousEndDate,
      revenue: previousRevenue,
      orders: previousOrders,
    },
  };
}

const createSubCategoryIntoDB = async (categoryName: string) => {
  const existingSubCategory = await prisma.subCategory.findUnique({
    where: { categoryName },
  });
  if (existingSubCategory) {
    throw new AppError(409, 'This sub category already exists');
  }
  await prisma.subCategory.create({
    data: {
      categoryName,
    },
  });
  return;
};

const getSubCategories = async () => {
  const subCategories = await prisma.subCategory.findMany();

  return subCategories;
};

const getSubCategoryProductsFromDb = async (subCategoryId?: string) => {
  const products = await prisma.product.findMany({
    where: {
      subCatId: subCategoryId ? subCategoryId : { not: null },
    },
  });

  return products;
};

export const ProductServices = {
  createSubCategoryIntoDB,
  createProductIntoDB,
  getAllProducts,
  getMyProductsFromDB,
  getSingleProductFromDB,
  getSubCategories,
  updateProductIntoDB,
  deleteProductFromDB,
  createCategoryFromDB,
  updateCategoryFromDB,
  deleteCategoryFromDB,
  allCategoryFromDB,
  getSellerAnalytics,
  getSubCategoryProductsFromDb,
  getCategoryByUserFromDB,
  getAdminAnalytics,
};
