import express from 'express';
import { OrderControllers } from './order.controller';
import auth from '../../middlewares/auth';

const router = express.Router();

router.post('/', auth(), OrderControllers.createOrder);
router.post('/paystack', auth(), OrderControllers.createPaystackOrder);

router.get('/', OrderControllers.getAllOrder);
router.get('/my-orders', auth(), OrderControllers.getMyOrders);
// router.get('/seller-orders', auth(), OrderControllers.getSellerorders);
router.put('/accept-order/:orderId', auth(), OrderControllers.acceptOrder);

router.get('/:id', OrderControllers.getSingleOrder);

router.put('/:id', OrderControllers.updateOrder);
router.post('/capture-payment/:id', OrderControllers.capturePayment);

router.delete('/:id', OrderControllers.deleteOrder);

export const OrderRoutes = router;
