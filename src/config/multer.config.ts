import { Request } from 'express';
import AppError from '../app/errors/AppError';
import httpStatus from 'http-status';

export const fileFilter = (req: Request, file: any, cb: any) => {
  const allowedMimeTypes = [
    'image/jpeg',
    'image/png',
    'image/gif',
    'image/bmp',
    'image/tiff',
    'image/webp',
    'audio/mpeg',
    'video/mp4',
    'application/pdf',
  ];

  if (
    allowedMimeTypes.includes(file.mimetype) ||
    file.mimetype.startsWith('image/') ||
    file.mimetype.startsWith('video/')
  ) {
    cb(null, true);
  } else {
    cb(new AppError(httpStatus.BAD_REQUEST, 'Invalid file type.'), false);
  }
};
