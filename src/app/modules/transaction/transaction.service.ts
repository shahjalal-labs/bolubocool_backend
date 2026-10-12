import prisma from '../../utils/prisma';

const getAllTransactions = async () => {
  const transactions = await prisma.transaction.findMany({
    orderBy: {
      createdAt: 'desc',
    },
  });
  return transactions;
};

const getUserTransactions = async (userId: string) => {
  const transactions = await prisma.transaction.findMany({
    where: {
      userId: userId,
    },
  });
  return transactions;
};

export const transactionServices = {
  getAllTransactions,
  getUserTransactions,
};
