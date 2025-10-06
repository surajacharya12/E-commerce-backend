const express = require("express");
const asyncHandler = require("express-async-handler");
const router = express.Router();
const User = require("../model/user");
const nodemailer = require("nodemailer");

// In-memory storage for verification codes (in production, use Redis or database)
const verificationCodes = new Map();

// Email transporter configuration
const createTransporter = () => {
  // Check if custom SMTP settings are provided
  if (process.env.EMAIL_HOST) {
    return nodemailer.createTransporter({
      host: process.env.EMAIL_HOST,
      port: process.env.EMAIL_PORT || 587,
      secure: process.env.EMAIL_SECURE === "true",
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS,
      },
    });
  }

  // Default to Gmail
  return nodemailer.createTransporter({
    service: process.env.EMAIL_SERVICE || "gmail",
    auth: {
      user: process.env.EMAIL_USER || "your-email@gmail.com",
      pass: process.env.EMAIL_PASS || "your-app-password",
    },
  });
};

/**
 * Send verification code for password reset
 */
router.post(
  "/send-code",
  asyncHandler(async (req, res) => {
    const { email } = req.body;

    console.log("Received forgot password request for:", email);

    if (!email) {
      return res.status(400).json({
        success: false,
        message: "Email is required.",
      });
    }

    // Check if user exists
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(404).json({
        success: false,
        message: "No account found with this email address.",
      });
    }

    // Generate 6-digit verification code
    const verificationCode = Math.floor(
      100000 + Math.random() * 900000
    ).toString();

    console.log(
      "Generated verification code:",
      verificationCode,
      "for email:",
      email
    );

    // Store code with expiration (5 minutes)
    verificationCodes.set(email, {
      code: verificationCode,
      expires: Date.now() + 5 * 60 * 1000, // 5 minutes
      attempts: 0,
    });

    try {
      // Send email
      const transporter = createTransporter();

      const mailOptions = {
        from: process.env.EMAIL_USER || "noreply@shopease.com",
        to: email,
        subject: "Password Reset Verification Code - ShopEase",
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
            <div style="text-align: center; margin-bottom: 30px;">
              <h1 style="color: #4F46E5; margin: 0;">ShopEase</h1>
              <p style="color: #6B7280; margin: 5px 0;">Password Reset Request</p>
            </div>
            
            <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 30px; border-radius: 15px; text-align: center; margin-bottom: 30px;">
              <h2 style="color: white; margin: 0 0 15px 0;">Verification Code</h2>
              <div style="background: white; padding: 20px; border-radius: 10px; display: inline-block;">
                <span style="font-size: 32px; font-weight: bold; color: #4F46E5; letter-spacing: 5px;">${verificationCode}</span>
              </div>
            </div>
            
            <div style="background: #F9FAFB; padding: 20px; border-radius: 10px; margin-bottom: 20px;">
              <h3 style="color: #374151; margin: 0 0 15px 0;">Reset Your Password</h3>
              <p style="color: #6B7280; margin: 0 0 15px 0;">
                You requested to reset your password. Enter the verification code above in the app to continue.
              </p>
              <p style="color: #6B7280; margin: 0;">
                <strong>This code will expire in 5 minutes.</strong>
              </p>
            </div>
            
            <div style="text-align: center; padding: 20px; border-top: 1px solid #E5E7EB;">
              <p style="color: #9CA3AF; font-size: 14px; margin: 0;">
                If you didn't request this, please ignore this email.
              </p>
              <p style="color: #9CA3AF; font-size: 14px; margin: 5px 0 0 0;">
                © 2024 ShopEase. All rights reserved.
              </p>
            </div>
          </div>
        `,
      };

      await transporter.sendMail(mailOptions);

      console.log("Verification email sent successfully to:", email);

      res.json({
        success: true,
        message: "Verification code sent to your email address.",
      });
    } catch (error) {
      console.error("Email sending error:", error);

      // Remove the code if email failed
      verificationCodes.delete(email);

      res.status(500).json({
        success: false,
        message: "Failed to send verification email. Please try again.",
      });
    }
  })
);

/**
 * Verify the reset code
 */
router.post(
  "/verify-code",
  asyncHandler(async (req, res) => {
    const { email, code } = req.body;

    console.log("Verifying code:", code, "for email:", email);

    if (!email || !code) {
      return res.status(400).json({
        success: false,
        message: "Email and verification code are required.",
      });
    }

    const storedData = verificationCodes.get(email);

    if (!storedData) {
      return res.status(400).json({
        success: false,
        message: "No verification code found. Please request a new one.",
      });
    }

    // Check if code expired
    if (Date.now() > storedData.expires) {
      verificationCodes.delete(email);
      return res.status(400).json({
        success: false,
        message: "Verification code has expired. Please request a new one.",
      });
    }

    // Check attempts (max 3 attempts)
    if (storedData.attempts >= 3) {
      verificationCodes.delete(email);
      return res.status(400).json({
        success: false,
        message: "Too many failed attempts. Please request a new code.",
      });
    }

    // Verify code
    if (storedData.code !== code) {
      storedData.attempts += 1;
      console.log(
        "Invalid code attempt. Expected:",
        storedData.code,
        "Received:",
        code
      );
      return res.status(400).json({
        success: false,
        message: `Invalid verification code. ${
          3 - storedData.attempts
        } attempts remaining.`,
      });
    }

    console.log("Code verified successfully for:", email);

    res.json({
      success: true,
      message: "Verification code confirmed successfully.",
    });
  })
);

/**
 * Reset password with verified code
 */
router.post(
  "/reset-password",
  asyncHandler(async (req, res) => {
    const { email, code, newPassword } = req.body;

    console.log("Resetting password for:", email);

    if (!email || !code || !newPassword) {
      return res.status(400).json({
        success: false,
        message: "Email, verification code, and new password are required.",
      });
    }

    if (newPassword.length < 6) {
      return res.status(400).json({
        success: false,
        message: "Password must be at least 6 characters long.",
      });
    }

    const storedData = verificationCodes.get(email);

    if (!storedData) {
      return res.status(400).json({
        success: false,
        message: "No verification code found. Please start the process again.",
      });
    }

    // Check if code expired
    if (Date.now() > storedData.expires) {
      verificationCodes.delete(email);
      return res.status(400).json({
        success: false,
        message:
          "Verification code has expired. Please start the process again.",
      });
    }

    // Verify code one more time
    if (storedData.code !== code) {
      return res.status(400).json({
        success: false,
        message: "Invalid verification code.",
      });
    }

    try {
      // Find user and update password
      const user = await User.findOne({ email });
      if (!user) {
        return res.status(404).json({
          success: false,
          message: "User not found.",
        });
      }

      // Update password (will be hashed by the pre-save middleware)
      user.password = newPassword;
      user.updatedAt = new Date();
      await user.save();

      // Remove verification code
      verificationCodes.delete(email);

      console.log("Password reset successfully for:", email);

      res.json({
        success: true,
        message:
          "Password reset successfully. You can now login with your new password.",
      });
    } catch (error) {
      console.error("Password reset error:", error);
      res.status(500).json({
        success: false,
        message: "Failed to reset password. Please try again.",
      });
    }
  })
);

/**
 * Cleanup expired codes (run this periodically)
 */
const cleanupExpiredCodes = () => {
  const now = Date.now();
  for (const [email, data] of verificationCodes.entries()) {
    if (now > data.expires) {
      verificationCodes.delete(email);
    }
  }
};

// Run cleanup every 5 minutes
setInterval(cleanupExpiredCodes, 5 * 60 * 1000);

module.exports = router;
