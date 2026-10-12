import { RequestHandler } from 'express';
import httpStatus from 'http-status';
import catchAsync from '../../utils/catchAsync';
import sendResponse from '../../utils/sendResponse';
import { ProductServices } from './Product.service';
import pickValidFields from '../../utils/pickValidFields';

const createProduct: RequestHandler = catchAsync(async (req, res) => {
  const userId = req.user.id;
  const payload = JSON.parse(req.body.bodyData);

  const files = Array.isArray(req.files)
    ? req.files
    : (req.files?.productImages as Express.Multer.File[]);
  const result = await ProductServices.createProductIntoDB(
    userId,
    payload,
    files,
  );
  sendResponse(res, {
    statusCode: httpStatus.CREATED,
    success: true,
    message: 'Product created successfully',
    data: result,
  });
});

const getAllProducts = catchAsync(async (req, res) => {
  const result = await ProductServices.getAllProducts(req.query);
  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: 'Products retrieved successfully.',
    data: result,
  });
});

const createCategory = catchAsync(async (req, res) => {
  req.body.userId = req.user.id;

  const result = await ProductServices.createCategoryFromDB(req.body);
  sendResponse(res, {
    statusCode: httpStatus.CREATED,
    success: true,
    message: 'Category created successfully.',
    data: result,
  });
});
const allCategoryFromDB = catchAsync(async (req, res) => {
  const result = await ProductServices.allCategoryFromDB();
  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: 'Category retrieved successfully.',
    data: result,
  });
});

const updateCategory = catchAsync(async (req, res) => {
  const result = await ProductServices.updateCategoryFromDB(
    req.params.id,
    req.body,
  );
  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: 'Category update successfully.',
    data: result,
  });
});
const deleteCategory = catchAsync(async (req, res) => {
  const result = await ProductServices.deleteCategoryFromDB(req.params.id);
  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: 'Category deleted successfully.',
    data: result,
  });
});

const getMyProducts: RequestHandler = catchAsync(async (req, res) => {
  const paginationOptions = pickValidFields(req.query, ['limit', 'page']);
  const userId = req.user.id;
  const result = await ProductServices.getMyProductsFromDB(
    userId,
    paginationOptions,
  );
  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: 'Products retrieved successfully',
    data: result,
  });
});

const getSingleProduct: RequestHandler = catchAsync(async (req, res) => {
  const result = await ProductServices.getSingleProductFromDB(req.params.id);
  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: 'Product retrieved successfully',
    data: result,
  });
});

const updateProduct: RequestHandler = catchAsync(async (req, res) => {
  const userData = req.user;
  const productId = req.params.id;
  const result = await ProductServices.updateProductIntoDB(
    userData,
    productId,
    req.body,
  );
  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: 'Product updated successfully',
    data: result,
  });
});

const deleteProduct: RequestHandler = catchAsync(async (req, res) => {
  const result = await ProductServices.deleteProductFromDB(req.params.id);
  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: 'Product deleted successfully',
    data: result,
  });
});

const getCategoryByUser: RequestHandler = catchAsync(async (req, res) => {
  const result = await ProductServices.getCategoryByUserFromDB(req.user.id);
  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: 'catrgory get successfully',
    data: result,
  });
});

const getSellerAnalytics = catchAsync(async (req, res) => {
  const sellerId = req.params.sellerId;

  // Validate and parse the query parameters
  const range: any = req.query.range?.toString();

  const analytics = await ProductServices.getSellerAnalytics(sellerId, {
    range,
  });

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: 'Analytics retrieved successfully',
    data: analytics,
  });
});
const getAdminAnalytics = catchAsync(async (req, res) => {
  const sellerId = req.params.sellerId;
  const range: any = req.query.range?.toString();

  const analytics = await ProductServices.getSellerAnalytics(sellerId, {
    range,
  });

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: 'Analytics retrieved successfully',
    data: analytics,
  });
});
const createSubCategory = catchAsync(async (req, res) => {
  const subCategory = await ProductServices.createSubCategoryIntoDB(
    req.body.categoryName,
  );

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: 'Sub Category created successfully',
    data: subCategory,
  });
});
const getSubCategories = catchAsync(async (req, res) => {
  const subCategory = await ProductServices.getSubCategories();

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: 'Sub Categories retrieved successfully',
    data: subCategory,
  });
});
const subcategoryProducts = catchAsync(async (req, res) => {
  const subCategoryProducts =
    await ProductServices.getSubCategoryProductsFromDb(req.query.subCatId as string);

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: 'Sub Category products retrieved successfully',
    data: subCategoryProducts,
  });
});

export const ProductControllers = {
  createProduct,
  getAllProducts,
  getMyProducts,
  getSingleProduct,
  subcategoryProducts,
  getSubCategories,
  updateProduct,
  deleteProduct,
  createCategory,
  updateCategory,
  deleteCategory,
  allCategoryFromDB,
  getSellerAnalytics,
  getCategoryByUser,
  getAdminAnalytics,
  createSubCategory,
};
