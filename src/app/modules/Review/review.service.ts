import prisma from '../../utils/prisma';
import { Review } from '@prisma/client';

const createReviewIntoDB = async (
  userId: string,
  productId: string,
  payload: Review,
) => {
  const product = await prisma.product.findFirstOrThrow({
    where: {
      id: productId,
    },
  });
  const newReview = await prisma.review.create({
    data: { ...payload, authorId: userId, productId: product.id },
  });
  return newReview;
};

const getAllReviewFromDB = async (productId: string | null) => {
  if (productId) {
    const productWithReviews = await prisma.product.findFirstOrThrow({
      where: {
        id: productId,
      },
      select: {
        Review: true,
      },
    });
    return productWithReviews?.Review;
  }
  return await prisma.review.findMany({});
};

const getSingleReviewFromDB = async (id: string) => {
  return await prisma.review.findUniqueOrThrow({
    where: {
      id: id,
    },
  });
};

const updateReviewIntoDB = async (id: string, payload: Partial<Review>) => {
  const updatedReview = await prisma.review.update({
    where: { id },
    data: payload,
  });
  return updatedReview;
};

const deleteReviewFromDB = async (id: string) => {
  return await prisma.review.delete({
    where: { id },
  });
};

export const ReviewServices = {
  createReviewIntoDB,
  getAllReviewFromDB,
  getSingleReviewFromDB,
  updateReviewIntoDB,
  deleteReviewFromDB,
};
