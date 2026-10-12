import crypto from 'crypto';
const generateHashedToken = (token: string) => {
  const hashedToken = crypto.createHash('sha256').update(token).digest('hex');
  return hashedToken;
};
const generateEmailVerificationLink = () => {
  const token = crypto.randomBytes(32).toString('hex');
  const emailVerificationLink = `${process.env.BACKEND_BASE_URL}/user/verify-email/${token}`;
  const hashedToken = generateHashedToken(token);
  return [emailVerificationLink, hashedToken];
};

const generateForgotPasswordLink = () => {
  const token = crypto.randomBytes(32).toString('hex');
  const forgotPasswordLink = `${process.env.BACKEND_BASE_URL}/auth/forgot-password/${token}`;
  const hashedToken = generateHashedToken(token);
  return { forgotPasswordLink, hashedToken };
};
export const verification = {
  generateEmailVerificationLink,
  generateHashedToken,
  generateForgotPasswordLink,
};
