export const emailBody = (fullName: string, link: string) => {
  const html = `
<div style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background-color: #f4f6f8; padding: 20px; color: #333;">
  <div style="max-width: 500px; margin: auto; background: #ffffff; border-radius: 10px; overflow: hidden; box-shadow: 0 4px 8px rgba(0,0,0,0.05);">
    <div style="background: linear-gradient(90deg, #007BFF, #FF6B35); padding: 15px 20px; color: white; text-align: center;">
      <h2 style="margin: 0;">Account Verification</h2>
    </div>
    <div style="padding: 20px;">
      <p style="font-size: 16px;">Hi <b>${fullName}</b>,</p>
      <p style="font-size: 15px;">Please click the button below to verify your account:</p>
      <div style="text-align: center; margin: 25px 0;">
        <a href="${link}" style="display: inline-block; font-size: 18px; font-weight: bold; color: white; background-color: #007BFF; padding: 12px 25px; border-radius: 8px; text-decoration: none; letter-spacing: 1px;">
          Verify My Account
        </a>
      </div>
      <p style="font-size: 14px; color: #555;">This link is active for <b>3 minute</b>⚠ If you didn’t request this, you can safely ignore this email.</p>
      <p style="font-size: 14px; margin-top: 20px;">Thanks,<br><b>The BRANDNOVA Team</b></p>
    </div>
    <div style="background-color: #f0f0f0; padding: 10px; text-align: center; font-size: 12px; color: #777;">
      &copy; ${new Date().getFullYear()} BRANDNOVA. All rights reserved.
    </div>
  </div>
</div>
`;
  return html;
};
export const emailBodyOtp = (fullName: string, otp: string) => {
  const html = `
<div style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background-color: #f4f6f8; padding: 20px; color: #333;">
  <div style="max-width: 500px; margin: auto; background: #ffffff; border-radius: 10px; overflow: hidden; box-shadow: 0 4px 8px rgba(0,0,0,0.05);">
    
    <!-- Header -->
    <div style="background: linear-gradient(90deg, #007BFF, #FF6B35); padding: 15px 20px; color: white; text-align: center;">
      <h2 style="margin: 0;">Password Reset Request</h2>
    </div>
    
    <!-- Body -->
    <div style="padding: 20px;">
      <p style="font-size: 16px;">Hi <b>${fullName}</b>,</p>
      <p style="font-size: 15px;">Your OTP for password reset is:</p>
      
      <div style="text-align: center; margin: 25px 0;">
        <span style="display: inline-block; font-size: 28px; font-weight: bold; color: #007BFF; background-color: #eaf3ff; padding: 10px 20px; border-radius: 8px; letter-spacing: 3px;">
          ${otp}
        </span>
      </div>
      
      <p style="font-size: 14px; color: #555;">⚠ This OTP is valid for <b style="color: #FF6B35;">5 minutes</b>. If you did not request this, please ignore this email.</p>
      <p style="font-size: 14px; margin-top: 20px;">Thanks,<br><b>The BRANDNOVA Team</b></p>
    </div>
    
    <!-- Footer -->
    <div style="background-color: #f0f0f0; padding: 10px; text-align: center; font-size: 12px; color: #777;">
      &copy; ${new Date().getFullYear()} Your Company. All rights reserved.
    </div>
  </div>
</div>
`;

  return html;
};

export const sellerApprovalEmail = (fullName: string, website: string) => {
  const html = `
<div style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background-color: #f4f6f8; padding: 20px; color: #333;">
  <div style="max-width: 500px; margin: auto; background: #ffffff; border-radius: 10px; overflow: hidden; box-shadow: 0 4px 8px rgba(0,0,0,0.05);">
    <div style="background: linear-gradient(90deg, #28a745, #20c997); padding: 15px 20px; color: white; text-align: center;">
      <h2 style="margin: 0;">Your Account Has Been Approved 🎉</h2>
    </div>
    <div style="padding: 20px;">
      <p style="font-size: 16px;">Hi <b>${fullName}</b>,</p>
      <p style="font-size: 15px;">
        Great news! Your seller account has been <b>verified and approved</b> by our team.  
        You can now start managing your listings, connecting with customers, and growing your business.
      </p>

      <div style="text-align: center; margin: 25px 0;">
        <a href="${website}" style="display: inline-block; font-size: 18px; font-weight: bold; color: white; background-color: #28a745; padding: 12px 25px; border-radius: 8px; text-decoration: none; letter-spacing: 1px;">
          Visit Your Store
        </a>
      </div>

      <p style="font-size: 14px; color: #555;">
        Your store is now live at:<br>
        <a href="${website}" style="color: #007BFF; text-decoration: none;">${website}</a>
      </p>

      <p style="font-size: 14px; margin-top: 20px;">Wishing you great success,<br><b>The BRANDNOVA Team</b></p>
    </div>
    <div style="background-color: #f0f0f0; padding: 10px; text-align: center; font-size: 12px; color: #777;">
      &copy; ${new Date().getFullYear()} BRANDNOVA. All rights reserved.
    </div>
  </div>
</div>
`;
  return html;
};
