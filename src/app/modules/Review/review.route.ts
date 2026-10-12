import express from 'express';
import { ReviewControllers } from './review.controller';
import validateRequest from '../../middlewares/validateRequest';
import { ReviewValidation } from './review.validation';
import auth from '../../middlewares/auth';

const router = express.Router({
  mergeParams: true,
});

router.post('/', auth(), ReviewControllers.createReview);

router.get('/', ReviewControllers.getAllReview);

router.get('/:id', ReviewControllers.getSingleReview);

router.put(
  '/:id',
  validateRequest(ReviewValidation.createReviewValidationSchema),
  ReviewControllers.updateReview,
);

router.delete('/:id', ReviewControllers.deleteReview);

export const ReviewRoutes = router;
