import multer from 'multer';
import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3';
import config from '../../config';
import { v4 as uuidv4 } from 'uuid';
import { fileFilter } from '../../config/multer.config';
import AppError from '../errors/AppError';
import httpStatus from 'http-status';
import path from 'path';

const s3Client = new S3Client({
  forcePathStyle: false,
  endpoint: config.aws.DO_SPACE_ENDPOINT as string,
  region: 'us-east-1',
  credentials: {
    accessKeyId: config.aws.DO_SPACE_ACCESS_KEY as string,
    secretAccessKey: config.aws.DO_SPACE_SECRET_KEY as string,
  },
});

const uploadToS3 = async (
  fileBuffer: Buffer,
  originalName: string,
  mimeType: string,
) => {
  const bucketName = config.aws.DO_SPACE_BUCKET;
  if (!bucketName) {
    throw new AppError(
      httpStatus.INTERNAL_SERVER_ERROR,
      'Bucket name is missing.',
    );
  }
  const uniquePrefix = `${uuidv4()}-${Date.now()}`;
  const fileExtension = path.extname(originalName);
  const fileName = `${uniquePrefix}${fileExtension}`;

  const command = new PutObjectCommand({
    Bucket: bucketName,
    Key: fileName,
    Body: fileBuffer,
    ContentType: mimeType,
    ACL: 'public-read',
  });
  try {
    await s3Client.send(command);
    return `${config.aws.DO_SPACE_ENDPOINT}/${bucketName}/${fileName}`;
  } catch (err) {
    console.error(err);
    throw new AppError(httpStatus.BAD_REQUEST, 'Failed to upload the file.');
  }
};
const s3Multer = multer({
  fileFilter: fileFilter,
  storage: multer.memoryStorage(),
});
export { uploadToS3, s3Multer };
