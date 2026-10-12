import nodemailer from 'nodemailer';
export default class Email {
  to: string;
  firstName: string;
  from: string;
  subject: any;
  constructor(user: any) {
    this.to = user.email || 'admin@gmail.com';
    this.firstName = user.firstName || 'admin';
    this.from = `Mashrafie Rahim Sheikh <${process.env.EMAIL_FROM}>`;
  }

  newTransport() {
    if (process.env.NODE_ENV === 'production') {
      //Sending real email with Brevo
      return nodemailer.createTransport({
        host: process.env.EMAIL_BREVO_HOST,
        port: process.env.EMAIL_BREVO_PORT,
        secure: false,
        auth: {
          user: process.env.EMAIL_BREVO_USER,
          pass: process.env.EMAIL_BREVO_PASSWORD,
        },
      } as any);
    }

    //Sending dummy emails to mailtrap for development
    return nodemailer.createTransport({
      host: process.env.MAILTRAP_HOST,
      port: process.env.MAILTRAP_PORT,
      auth: {
        user: process.env.MAILTRAP_USER,
        pass: process.env.MAILTRAP_PASSWORD,
      },
    } as any);
  }

  //Send the actual email

  async send(template: string, subject: string) {
    //01. Render HTML using the PUG template from the arguments
    const html = template;
    //02. Define mail options
    const mailOptions = {
      from: this.from,
      to: this.to,
      subject,
      html,
    };
    //03. Create a transporter and send the mail
    await this.newTransport().sendMail(mailOptions);
  }
  async sendEmailVerificationLink(subject: string, link: string) {
    //01. Render HTML using the PUG template from the arguments
    const html = `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Verify Your Email - Brandnova</title>
    <style>
        body {
            margin: 0;
            padding: 0;
            font-family: 'Arial', sans-serif;
            background-color: #f5f5f5;
            -webkit-font-smoothing: antialiased;
        }
        .container {
            max-width: 600px;
            margin: 20px auto;
            background: #ffffff;
            box-shadow: 0 2px 10px rgba(0,0,0,0.1);
            border-radius: 8px;
            overflow: hidden;
        }
        .header {
            padding: 25px 30px;
            background-color: #161616;
            text-align: center;
            border-bottom: 2px solid #D6001C;
        }
        .logo {
            width: 150px;
            height: auto;
        }
        .promo-banner {
            background-color: #D6001C;
            color: #ffffff;
            text-align: center;
            padding: 12px;
            font-size: 15px;
            font-weight: bold;
            letter-spacing: 0.5px;
        }
        .content {
            padding: 40px 30px;
            background: #ffffff;
        }
        .title {
            color: #161616;
            font-size: 26px;
            font-weight: 700;
            margin: 0 0 25px;
            text-align: center;
        }
        .text {
            color: #161616;
            font-size: 16px;
            line-height: 1.6;
            margin: 0 0 25px;
            text-align: center;
        }
        .button-container {
            text-align: center;
            margin: 30px 0;
        }
        .button {
            display: inline-block;
            background-color: #D6001C;
            color: #ffffff;
            text-decoration: none;
            padding: 14px 32px;
            border-radius: 5px;
            font-weight: bold;
            font-size: 16px;
            transition: background-color 0.3s ease;
        }
        .button:hover {
            background-color: #B30016;
        }
        .footer {
            background-color: #D6001C;
            padding: 25px 20px;
            text-align: center;
        }
        .footer-links {
            margin-bottom: 15px;
        }
        .footer-link {
            color: #ffffff;
            text-decoration: none;
            margin: 0 12px;
            font-size: 14px;
            transition: opacity 0.3s ease;
        }
        .footer-link:hover {
            opacity: 0.9;
        }
        .footer-text {
            color: #ffffff;
            font-size: 12px;
            margin: 15px 0 0;
            opacity: 0.9;
        }
        .disclaimer {
            font-size: 13px;
            color: #777777;
            text-align: center;
            line-height: 1.5;
            margin-top: 25px;
        }
    </style>
</head>
<body>
    <div class="container">
        <div class="promo-banner">
            LIMITED TIME OFFER: 25% OFF SITEWIDE
        </div>
        <div class="header">
            <img src="https://hebbkx1anhila5yf.public.blob.vercel-storage.com/Group%201-th5uZFF5vWbJeQ3P8Xx8mWeMIr76qU.png" alt="Brandnova" class="logo">
        </div>
        <div class="content">
            <h1 class="title">Verify Your Email Address</h1>
            <p class="text">Welcome to Brandnova! We're excited to have you join our premium college apparel community.</p>
            <p class="text">Please verify your email address to activate your account and enjoy seamless access to our exclusive collections.</p>
            
            <div class="button-container">
                <a href="${link}" class="button">Verify Email Address</a>
            </div>

            <p class="disclaimer">
                This verification link expires in 24 hours. If you didn't create an account with Brandnova, please disregard this email.<br>
                Need help? Contact our support team at support@brandnova.com
            </p>
        </div>
        <div class="footer">
            <div class="footer-links">
                <a href="#" class="footer-link">Home</a>
                <a href="#" class="footer-link">About Us</a>
                <a href="#" class="footer-link">Media</a>
                <a href="#" class="footer-link">Events</a>
                <a href="#" class="footer-link">Careers</a>
                <a href="#" class="footer-link">Contact</a>
            </div>
            <p class="footer-text">&copy; 2024 Brandnova. All Rights Reserved.<br>123 College Avenue, Campus Town, CA 98765</p>
        </div>
    </div>
</body>
</html>`;
    //02. Define mail options
    const mailOptions = {
      from: this.from,
      to: this.to,
      subject,
      html,
    };
    //03. Create a transporter and send the mail
    await this.newTransport().sendMail(mailOptions);
  }

  async sendWelcome() {
    await this.send('welcome', 'Welcome to XYZ');
  }

  async sendPasswordReset(link: string) {
    const html = `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Password Reset - Brandnova</title>
    <style>
        body {
            margin: 0;
            padding: 0;
            font-family: 'Arial', sans-serif;
            background-color: #f5f5f5;
            -webkit-font-smoothing: antialiased;
        }
        .container {
            max-width: 600px;
            margin: 20px auto;
            background: #ffffff;
            box-shadow: 0 2px 10px rgba(0,0,0,0.1);
            border-radius: 8px;
            overflow: hidden;
        }
        .header {
            padding: 25px 30px;
            background-color: #161616;
            text-align: center;
            border-bottom: 2px solid #D6001C;
        }
        .logo {
            width: 150px;
            height: auto;
        }
        .promo-banner {
            background-color: #D6001C;
            color: #ffffff;
            text-align: center;
            padding: 12px;
            font-size: 15px;
            font-weight: bold;
            letter-spacing: 0.5px;
        }
        .content {
            padding: 40px 30px;
            background: #ffffff;
        }
        .title {
            color: #161616;
            font-size: 26px;
            font-weight: 700;
            margin: 0 0 25px;
            text-align: center;
        }
        .text {
            color: #161616;
            font-size: 16px;
            line-height: 1.6;
            margin: 0 0 25px;
            text-align: center;
        }
        .button-container {
            text-align: center;
            margin: 30px 0;
        }
        .button {
            display: inline-block;
            background-color: #D6001C;
            color: #ffffff;
            text-decoration: none;
            padding: 14px 32px;
            border-radius: 5px;
            font-weight: bold;
            font-size: 16px;
            transition: background-color 0.3s ease;
        }
        .button:hover {
            background-color: #B30016;
        }
        .footer {
            background-color: #D6001C;
            padding: 25px 20px;
            text-align: center;
        }
        .footer-links {
            margin-bottom: 15px;
        }
        .footer-link {
            color: #ffffff;
            text-decoration: none;
            margin: 0 12px;
            font-size: 14px;
            transition: opacity 0.3s ease;
        }
        .footer-link:hover {
            opacity: 0.9;
        }
        .footer-text {
            color: #ffffff;
            font-size: 12px;
            margin: 15px 0 0;
            opacity: 0.9;
        }
        .disclaimer {
            font-size: 13px;
            color: #777777;
            text-align: center;
            line-height: 1.5;
            margin-top: 25px;
        }
    </style>
</head>
<body>
    <div class="container">
        <div class="promo-banner">
            LIMITED TIME OFFER: 25% OFF SITEWIDE
        </div>
        <div class="header">
            <img src="https://hebbkx1anhila5yf.public.blob.vercel-storage.com/Group%201-th5uZFF5vWbJeQ3P8Xx8mWeMIr76qU.png" alt="Brandnova" class="logo">
        </div>
        <div class="content">
            <h1 class="title">Reset Your Password</h1>
            <p class="text">We received a request to reset your Brandnova account password.</p>
            <p class="text">Click the button below to securely create a new password. This link will expire in 24 hours.</p>
            
            <div class="button-container">
                <a href="${link}" class="button">Reset Password</a>
            </div>

            <p class="disclaimer">
                If you didn't request this password reset, you can safely ignore this email.<br>
                For security reasons, we recommend never sharing your password with anyone.<br>
                Need immediate assistance? Contact us at support@brandnova.com
            </p>
        </div>
        <div class="footer">
            <div class="footer-links">
                <a href="#" class="footer-link">Home</a>
                <a href="#" class="footer-link">About Us</a>
                <a href="#" class="footer-link">Media</a>
                <a href="#" class="footer-link">Events</a>
                <a href="#" class="footer-link">Careers</a>
                <a href="#" class="footer-link">Contact</a>
            </div>
            <p class="footer-text">&copy; 2024 Brandnova. All Rights Reserved.<br>123 College Avenue, Campus Town, CA 98765</p>
        </div>
    </div>
</body>
</html>`;
    await this.send(html, 'Reset your password');
  }

  async sendContactMail(data: any) {
    const template = `<h1 style="background-color: #f9f9f9; padding: 10px; text-align: center; font-size: 12px; color: #999999;">
            <p style="margin: 0;">Hello I want to send you a message.</p>
        </h1>`;
    await this.send(template, 'Contact Message');
  }
}
