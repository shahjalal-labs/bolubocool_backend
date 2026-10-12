import express from 'express';
import { ProductControllers } from './Product.controller';
import { s3Multer } from '../../helpers/fileUploaderToS3';
import auth from '../../middlewares/auth';
import { ReviewRoutes } from '../Review/review.route';
import validateRequest from '../../middlewares/validateRequest';
import { ProductValidation } from './Product.validation';

const router = express.Router();

router
  .route('/')
  .get(ProductControllers.getAllProducts)
  .post(
    auth(),
    s3Multer.fields([{ name: 'productImages' }]),
    ProductControllers.createProduct,
  );

router.get('/my', auth(), ProductControllers.getMyProducts);

router
  .route('/:id')
  .get(ProductControllers.getSingleProduct)
  .put(auth(), ProductControllers.updateProduct)
  .delete(
    auth('SUPERADMIN', 'ADMIN', 'SELLER'),
    ProductControllers.deleteProduct,
  );
router.use('/:productId/reviews', ReviewRoutes);

// Category routes
router.get('/category/all', ProductControllers.allCategoryFromDB);
router.post(
  '/category/create',
  validateRequest(ProductValidation.createCategoryValidationSchema),
  auth('SUPERADMIN', 'ADMIN', 'SELLER'),
  ProductControllers.createCategory,
);
router.patch(
  '/category/update/:id',
  auth('SUPERADMIN', 'ADMIN', 'SELLER'),
  ProductControllers.updateCategory,
);
router.delete(
  '/category/delete/:id',
  auth('SUPERADMIN', 'ADMIN', 'SELLER'),
  ProductControllers.deleteCategory,
);
router.get(
  '/category/getCategoryByUser',
  auth('SUPERADMIN', 'ADMIN', 'SELLER'),
  ProductControllers.getCategoryByUser,
);
router.get(
  '/seller/analytics/:sellerId',
  auth('SELLER'),
  ProductControllers.getSellerAnalytics,
);
router.get(
  '/admin/getAdminAnalytics',
  auth('ADMIN', 'SUPERADMIN'),
  ProductControllers.getSellerAnalytics,
);
router.post(
  '/sub-category/create',
  auth('ADMIN', 'SUPERADMIN'),
  ProductControllers.createSubCategory,
);
router.get('/sub-category/all', ProductControllers.getSubCategories);
router.get('/sub-category/products', ProductControllers.subcategoryProducts);

export const ProductRoutes = router;
