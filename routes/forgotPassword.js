const express = require("express");
const asyncHandler = require("express-async-handler");
const router = express.Router();
const User = require("../model/user");
const nodemailer = require("nodemailer");

// In-memory storage for verification codes (in production, use Redis or database)
const verificationCodes = new Map();

// Email transporter configuration with better error handling
// Note: nodemailer exports createTransport, not createTransporter
const createTransport = () => {
  try {
    // Check if email credentials are provided
    if (!process.env.EMAIL_USER || !process.env.EMAIL_PASS) {
      console.warn("⚠️  Email credentials not configured. Using test mode.");
      return null;
    }

    // Check if custom SMTP settings are provided
    if (process.env.EMAIL_HOST) {
      return nodemailer.createTransport({
        host: process.env.EMAIL_HOST,
        port: process.env.EMAIL_PORT || 587,
        secure: process.env.EMAIL_SECURE === "true",
        auth: {
          user: process.env.EMAIL_USER,
          pass: process.env.EMAIL_PASS,
        },
      });
    }

    // Default to Gmail with better configuration
    return nodemailer.createTransport({
      service: "gmail",
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS,
      },
      tls: {
        rejectUnauthorized: false,
      },
    });
  } catch (error) {
    console.error("❌ Error creating email transporter:", error);
    return null;
  }
};

// Test email configuration
const testEmailConfig = async () => {
  try {
  const transporter = createTransport();
    if (!transporter) return false;

    await transporter.verify();
    console.log("✅ Email configuration is valid");
    return true;
  } catch (error) {
    console.error("❌ Email configuration test failed:", error.message);
    return false;
  }
};

/**
 * Send forgot password verification code
 */
router.post(
  "/send-code",
  asyncHandler(async (req, res) => {
    const { email } = req.body;

    console.log("📧 Received forgot password request for:", email);

    if (!email) {
      return res.status(400).json({
        success: false,
        message: "Email is required.",
      });
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return res.status(400).json({
        success: false,
        message: "Please enter a valid email address.",
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

    console.log("🔢 Generated verification code for email:", email);

    // Store code with expiration (10 minutes for better UX)
    verificationCodes.set(email, {
      code: verificationCode,
      expires: Date.now() + 10 * 60 * 1000, // 10 minutes
      attempts: 0,
      createdAt: new Date(),
    });

    // Check if email is configured
  const transporter = createTransport();
    if (!transporter) {
      // For development/testing - log the code but don't send email
      console.log("🧪 Development mode: Email not configured");
      console.log("📧 Verification code for", email, ":", verificationCode);

      return res.json({
        success: true,
        message:
          "Verification code generated. Check server console for the code (development mode).",
      });
    }

    try {
      // Test email configuration first
      const isEmailValid = await testEmailConfig();
      if (!isEmailValid) {
        throw new Error("Email configuration is invalid");
      }

      const mailOptions = {
        from: {
          name: "ShopEase",
          address: process.env.EMAIL_USER,
        },
        to: email,
        subject: "🔐 Password Reset Code - ShopEase",
        html: `
          <!DOCTYPE html>
          <html>
          <head>
            <meta charset="utf-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>Password Reset - ShopEase</title>
          </head>
          <body style="margin: 0; padding: 0; font-family: Arial, sans-serif; background-color: #f7fafc;">
            <div style="max-width: 600px; margin: 0 auto; background-color: white;">
              <!-- Header -->
              <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 40px 20px; text-align: center;">
                <h1 style="color: white; margin: 0; font-size: 28px; font-weight: bold;">ShopEase</h1>
                <p style="color: rgba(255,255,255,0.9); margin: 10px 0 0 0; font-size: 16px;">Password Reset Request</p>
              </div>
              
              <!-- Content -->
              <div style="padding: 40px 20px;">
                <h2 style="color: #2d3748; margin: 0 0 20px 0; font-size: 24px;">Reset Your Password</h2>
                <p style="color: #4a5568; margin: 0 0 30px 0; font-size: 16px; line-height: 1.5;">
                  We received a request to reset your password. Use the verification code below to continue:
                </p>
                
                <!-- Verification Code -->
                <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); border-radius: 15px; padding: 40px; text-align: center; margin: 30px 0;">
                  <p style="color: white; margin: 0 0 20px 0; font-size: 16px; text-transform: uppercase; letter-spacing: 2px; opacity: 0.9;">Your Verification Code</p>
                  <div style="background: white; border-radius: 12px; padding: 25px; display: inline-block; box-shadow: 0 8px 25px rgba(0,0,0,0.15);">
                    <span style="font-size: 42px; font-weight: bold; color: #667eea; letter-spacing: 10px; font-family: 'Courier New', monospace;">${verificationCode}</span>
                  </div>
                  <p style="color: rgba(255,255,255,0.9); margin: 20px 0 0 0; font-size: 14px;">Enter this code in the app to reset your password</p>
                </div>
                
                <!-- Instructions -->
                <div style="background: #fff5f5; border-left: 4px solid #f56565; padding: 20px; margin: 30px 0; border-radius: 0 8px 8px 0;">
                  <h3 style="color: #c53030; margin: 0 0 10px 0; font-size: 16px;">🔒 Security Information:</h3>
                  <ul style="color: #4a5568; margin: 0; padding-left: 20px; font-size: 14px; line-height: 1.6;">
                    <li>This code will expire in <strong>10 minutes</strong></li>
                    <li>You have <strong>3 attempts</strong> to enter the correct code</li>
                    <li><strong>Never share this code</strong> with anyone</li>
                    <li>If you didn't request this, please ignore this email and consider changing your password</li>
                    <li>ShopEase will never ask for this code via phone or other means</li>
                  </ul>
                </div>
                
                <!-- Button -->
                <div style="text-align: center; margin: 40px 0;">
                  <a href="#" style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 15px 30px; text-decoration: none; border-radius: 8px; font-weight: bold; display: inline-block;">Continue Password Reset</a>
                </div>
              </div>
              
              <!-- Footer -->
              <div style="background: #f7fafc; padding: 30px 20px; text-align: center; border-top: 1px solid #e2e8f0;">
                <p style="color: #718096; margin: 0; font-size: 14px;">
                  This email was sent by ShopEase. If you have any questions, please contact our support team.
                </p>
                <p style="color: #a0aec0; margin: 10px 0 0 0; font-size: 12px;">
                  © 2024 ShopEase. All rights reserved.
                </p>
              </div>
            </div>
          </body>
          </html>
        `,
      };

      console.log("📤 Sending email to:", email);
      const result = await transporter.sendMail(mailOptions);
      console.log("✅ Email sent successfully. Message ID:", result.messageId);

      res.json({
        success: true,
        message:
          "Verification code sent to your email address. Please check your inbox and spam folder.",
      });
    } catch (error) {
      console.error("❌ Email sending error:", error);

      // Remove the code if email failed
      verificationCodes.delete(email);

      // Provide specific error messages
      let errorMessage = "Failed to send verification email. Please try again.";

      if (error.code === "EAUTH") {
        errorMessage = "Email authentication failed. Please contact support.";
      } else if (error.code === "ENOTFOUND") {
        errorMessage = "Email service unavailable. Please try again later.";
      } else if (error.message.includes("Invalid login")) {
        errorMessage = "Email configuration error. Please contact support.";
      }

      res.status(500).json({
        success: false,
        message: errorMessage,
        error:
          process.env.NODE_ENV === "development" ? error.message : undefined,
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

    console.log("🔍 Verifying code:", code, "for email:", email);

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
    if (storedData.code !== code.toString()) {
      storedData.attempts += 1;
      console.log(
        "❌ Invalid code attempt. Expected:",
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

    console.log("✅ Code verified successfully for:", email);

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

    console.log("🔄 Resetting password for:", email);

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
    if (storedData.code !== code.toString()) {
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

      console.log("✅ Password reset successfully for:", email);

      res.json({
        success: true,
        message:
          "Password reset successfully. You can now login with your new password.",
      });
    } catch (error) {
      console.error("❌ Password reset error:", error);
      res.status(500).json({
        success: false,
        message: "Failed to reset password. Please try again.",
      });
    }
  })
);

/**
 * Resend verification code
 */
router.post(
  "/resend-code",
  asyncHandler(async (req, res) => {
    const { email } = req.body;

    console.log("🔄 Resending code for:", email);

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

    // Check if there's an existing code that's not expired
    const existingData = verificationCodes.get(email);
    if (existingData && Date.now() < existingData.expires) {
      const timeLeft = Math.ceil(
        (existingData.expires - Date.now()) / 1000 / 60
      );
      return res.status(400).json({
        success: false,
        message: `Please wait ${timeLeft} minutes before requesting a new code.`,
      });
    }

    // Generate new code and send (reuse the send-code logic)
    const sendCodeReq = { body: { email } };
    const sendCodeRes = {
      status: (code) => ({ json: (data) => res.status(code).json(data) }),
      json: (data) => res.json(data),
    };

    // Call the send-code endpoint logic
    return router.handle(sendCodeReq, sendCodeRes);
  })
);

/**
 * Get verification status
 */
router.get(
  "/status/:email",
  asyncHandler(async (req, res) => {
    const { email } = req.params;

    const storedData = verificationCodes.get(email);

    if (!storedData) {
      return res.json({
        success: true,
        hasCode: false,
        message: "No active verification code.",
      });
    }

    const isExpired = Date.now() > storedData.expires;
    const timeLeft = Math.max(
      0,
      Math.ceil((storedData.expires - Date.now()) / 1000 / 60)
    );

    res.json({
      success: true,
      hasCode: !isExpired,
      timeLeft: timeLeft,
      attempts: storedData.attempts,
      maxAttempts: 3,
      createdAt: storedData.createdAt,
    });
  })
);

/**
 * Cleanup expired codes (run this periodically)
 */
const cleanupExpiredCodes = () => {
  const now = Date.now();
  let cleanedCount = 0;

  for (const [email, data] of verificationCodes.entries()) {
    if (now > data.expires) {
      verificationCodes.delete(email);
      cleanedCount++;
    }
  }

  if (cleanedCount > 0) {
    console.log(`🧹 Cleaned up ${cleanedCount} expired verification codes`);
  }
};

// Run cleanup every 5 minutes
setInterval(cleanupExpiredCodes, 5 * 60 * 1000);

// Test email configuration on startup
setTimeout(async () => {
  console.log("🧪 Testing email configuration...");
  await testEmailConfig();
}, 2000);

module.exports = router;
