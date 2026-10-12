import { Request, Response } from 'express';
import catchAsync from '../../utils/catchAsync';
import sendResponse from '../../utils/sendResponse';
import httpStatus from 'http-status';
import { contactServices } from './contact.service';

const sendContactMessage = catchAsync(async (req: Request, res: Response) => {
  const { data } = req.body;
  const result = await contactServices.sendContactMessage(data);
  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: 'Message received successfully. We will get back to you soon.',
    data: result,
  });
});

export const contactController = {
  sendContactMessage,
};
