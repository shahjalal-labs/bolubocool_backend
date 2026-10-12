import express from 'express';
import { contactController } from './contact.controller';
const router = express.Router();

router.route('/').post(contactController.sendContactMessage);

export const contactRouter = router;
