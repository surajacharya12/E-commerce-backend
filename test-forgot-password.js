const express = require("express");
const cors = require("cors");
const bodyParser = require("body-parser");

// Test server for forgot password functionality
const app = express();
app.use(cors({ origin: "*" }));
app.use(bodyParser.json());

// Mock verification codes storage
const testCodes = new Map();

console.log("🧪 Starting Forgot Password Test Server...");

// Test endpoint
app.get("/test", (req, res) => {
  res.json({
    success: true,
    message: "Forgot Password Test Server is running!",
    timestamp: new Date().toISOString(),
    endpoints: [
      "POST /forgot-password/send-code",
      "POST /forgot-password/verify-code",
      "POST /forgot-password/reset-password",
    ],
  });
});

// Mock send code endpoint
app.post("/forgot-password/send-code", (req, res) => {
  const { email } = req.body;
  console.log("📧 Test: Sending code to", email);

  if (!email) {
    return res.status(400).json({
      success: false,
      message: "Email is required.",
    });
  }

  // Generate test code
  const testCode = Math.floor(100000 + Math.random() * 900000).toString();

  // Store test code
  testCodes.set(email, {
    code: testCode,
    expires: Date.now() + 10 * 60 * 1000, // 10 minutes
    attempts: 0,
  });

  console.log(`🔢 Generated test code: ${testCode} for ${email}`);

  res.json({
    success: true,
    message:
      "Test verification code sent to email (check console for test code).",
    email: email,
  });
});

// Mock verify code endpoint
app.post("/forgot-password/verify-code", (req, res) => {
  const { email, code } = req.body;
  console.log("🔍 Test: Verifying code", code, "for", email);

  if (!email || !code) {
    return res.status(400).json({
      success: false,
      message: "Email and code are required.",
    });
  }

  const storedData = testCodes.get(email);

  if (!storedData) {
    return res.status(400).json({
      success: false,
      message: "No verification code found. Please request a new one.",
    });
  }

  // Check expiration
  if (Date.now() > storedData.expires) {
    testCodes.delete(email);
    return res.status(400).json({
      success: false,
      message: "Verification code has expired.",
    });
  }

  // Check code
  if (storedData.code !== code.toString()) {
    storedData.attempts += 1;
    if (storedData.attempts >= 3) {
      testCodes.delete(email);
      return res.status(400).json({
        success: false,
        message: "Too many failed attempts. Please request a new code.",
      });
    }
    return res.status(400).json({
      success: false,
      message: `Invalid code. ${3 - storedData.attempts} attempts remaining.`,
    });
  }

  console.log("✅ Test: Code verified successfully");

  res.json({
    success: true,
    message: "Test code verified successfully!",
  });
});

// Mock reset password endpoint
app.post("/forgot-password/reset-password", (req, res) => {
  const { email, code, newPassword } = req.body;
  console.log("🔄 Test: Resetting password for", email);

  if (!email || !code || !newPassword) {
    return res.status(400).json({
      success: false,
      message: "Email, code, and new password are required.",
    });
  }

  if (newPassword.length < 6) {
    return res.status(400).json({
      success: false,
      message: "Password must be at least 6 characters long.",
    });
  }

  const storedData = testCodes.get(email);

  if (!storedData || storedData.code !== code.toString()) {
    return res.status(400).json({
      success: false,
      message: "Invalid verification code.",
    });
  }

  // Remove test code
  testCodes.delete(email);

  console.log("✅ Test: Password reset successful");

  res.json({
    success: true,
    message: "Test password reset successful!",
  });
});

// Status endpoint
app.get("/forgot-password/status/:email", (req, res) => {
  const { email } = req.params;
  const storedData = testCodes.get(email);

  if (!storedData) {
    return res.json({
      success: true,
      hasCode: false,
      message: "No active test code.",
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
    // Code is not exposed for security
  });
});

const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
  console.log(`🧪 Test server running on port ${PORT}`);
  console.log(`📍 Test endpoint: http://localhost:${PORT}/test`);
  console.log(`📧 Test with any email - codes will be shown in response`);
  console.log(`🔢 All generated codes are displayed for easy testing`);
  console.log("");
  console.log("🚀 Ready for testing forgot password flow!");
});
