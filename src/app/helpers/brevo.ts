import nodemailer from 'nodemailer';

const transporter = nodemailer.createTransport({
  host: 'smtp-relay.brevo.com',
  port: 587,
  secure: false, 
  auth: {
    user: '7aad79001@smtp-brevo.com', 
    pass: 'MNY0FpSyR6LdZamC',     
  },
});

export const sendEmail = async (to: string, subject: string, htmlContent: string) => {
  try {
    const mailOptions = {
      from: 'BrandNova <7aad79001@smtp-brevo.com>',
      to,
      subject,
      html: htmlContent,
    };

    const info = await transporter.sendMail(mailOptions);
    console.log('✅ Email sent successfully:', info.messageId);
    return info;
  } catch (error: any) {
    console.error('❌ Error sending email:', error.message);
    throw new Error('Failed to send email');
  }
};
