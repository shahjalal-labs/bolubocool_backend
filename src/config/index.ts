import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.join(process.cwd(), '.env') });

export default {
  env: process.env.NODE_ENV,
  port: process.env.PORT,
  super_admin_password: process.env.SUPER_ADMIN_PASSWORD,
  bcrypt_salt_rounds: process.env.BCRYPT_SALT_ROUNDS,
  BASE_URL: process.env.BASE_URL,
  jwt: {
    access_secret: process.env.JWT_ACCESS_SECRET,
    access_expires_in: process.env.JWT_ACCESS_EXPIRES_IN,
    refresh_secret: process.env.JWT_REFRESH_SECRET,
    refresh_expires_in: process.env.JWT_REFRESH_EXPIRES_IN,
    jwt_cookie_expires_in: process.env.JWT_COOKIE_EXPIRES_IN,
  },
  aws: {
    DO_SPACE_ENDPOINT: process.env.DO_SPACE_ENDPOINT,
    DO_SPACE_ACCESS_KEY: process.env.DO_SPACE_ACCESS_KEY,
    DO_SPACE_SECRET_KEY: process.env.DO_SPACE_SECRET_KEY,
    DO_SPACE_BUCKET: process.env.DO_SPACE_BUCKET,
  },
  emailSender: {
    email: process.env.EMAIL,
    app_pass: process.env.APP_PASS,
  },
  stripe: {
    STRIPE_SECRET_KEY: process.env.STRIPE_SECRET_KEY,
    STRIPE_WEBHOOK_SECRET: process.env.STRIPE_WEBHOOK_SECRET as string,
  },
  topship: {
    topshipAPiKey: process.env.TOPSHIP_API_KEY,
    topShipBase: process.env.TOPSHIP_BASE_URL,
  },
};
