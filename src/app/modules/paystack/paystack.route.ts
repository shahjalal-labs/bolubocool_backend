import express from 'express';
import { paystackServices } from './paystack.service';
import { paystackController } from './paystack.controller';

const router = express.Router();

router.post('/initialize-payment', paystackController.paymentIntent);
router.post('/connect-account', paystackController.connectAccount);
router.post('/split-payment', paystackController.splitPayment);
router.post('/create-shipment', paystackController.createShipment);
router.post('/rates', paystackController.getRates);
router.post('/book-draft', paystackController.bookDraft);
router.post('/pay-draft/:id', paystackController.payForDraft);
router.post('/track/:id', paystackController.trackShipment);
router.post('/shipping-cost', paystackController.getShippingCost);

export const paystackRoutes = router;
