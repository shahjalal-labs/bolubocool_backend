// import nodemailer from "nodemailer";
// import SMTPTransport from "nodemailer/lib/smtp-transport";
// import dotenv from "dotenv";

// dotenv.config();

// const transporter = nodemailer.createTransport({
//   host: process.env.EMAIL_BREVO_HOST,
//   port: Number(process.env.EMAIL_BREVO_PORT),
//   secure: false, 
//   auth: {
//     user: process.env.EMAIL_BREVO_USER,
//     pass: process.env.EMAIL_BREVO_PASSWORD,
//   },
// } as SMTPTransport.Options); 

// export const sendOTPThroughBrevo = async (to: string, html:string) => {
//   try {
//     const mailOptions = {
//       from: `"BRANDNOVA" <noreply@brandnova.com>`,
//       // from: `"BRANDNOVA" <${process.env.EMAIL_BREVO_USER}>`,
//       to,
//       subject: "Account verification link",
//       html:html,
//     };

//     const result = await transporter.sendMail(mailOptions);
//     console.log(result);
//     console.log("✅ OTP sent successfully to:", to);
//   } catch (error: any) {
//     console.error("❌ Error sending OTP:", error.message);
//   }
// };
import nodemailer from "nodemailer";
import SMTPTransport from "nodemailer/lib/smtp-transport";
import dotenv from "dotenv";

dotenv.config();

const transporter = nodemailer.createTransport({
  host: process.env.EMAIL_BREVO_HOST,
  port: Number(process.env.EMAIL_BREVO_PORT),
  secure: false,
  auth: {
    user: process.env.EMAIL_BREVO_USER,
    pass: process.env.EMAIL_BREVO_PASSWORD,
  },
} as SMTPTransport.Options);

export const sendOTPThroughBrevo = async (to: string, html: string) => {
  try {
    const mailOptions = {
      from: `"BRANDNOVA" <${process.env.EMAIL_SENDER}>`,
      to,
      subject: "Account verification link",
      html,
    };

    const result = await transporter.sendMail(mailOptions);
    console.log(result);
    console.log("✅ OTP sent successfully to:", to);
  } catch (error: any) {
    console.error("❌ Error sending OTP:", error.message);
  }
};

