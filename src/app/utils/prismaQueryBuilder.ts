import { Prisma } from '@prisma/client';

interface QueryBuilderOptions {
  filters?: Record<string, any>;
  search?: { fields: string[]; value: string };
  sort?: { field: string; order: 'asc' | 'desc' };
  pagination?: { page: number; limit: number };
}

export const queryBuilder = (options: QueryBuilderOptions) => {
  const { filters, search, sort, pagination } = options;

  const where: Prisma.PrismaClientKnownRequestError['meta'] = {};

  // Apply filters
  if (filters) {
    Object.assign(where, filters);
  }

  // Apply search
  if (search && search.value) {
    where.OR = search.fields.map(field => ({
      [field]: { contains: search.value, mode: 'insensitive' },
    }));
  }

  // Apply sorting
  const orderBy = sort ? { [sort.field]: sort.order } : undefined;

  // Apply pagination
  const take = pagination?.limit || 10;
  const skip = pagination?.page ? (pagination.page - 1) * take : 0;

  return { where, orderBy, take, skip };
};
