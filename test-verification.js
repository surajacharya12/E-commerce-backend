const express = require("express");
const cors = require("cors");
const bodyParser = require("body-parser");

// Simple test server to verify verification endpoints
const app = express();
app.use(cors({ origin: "*" }));
app.use(bodyParser.json());

// Test route
app.get("/test", (req, res) => {
  res.json({
    success: true,
    message: "Verification server is running!",
    timestamp: new Date().toISOString(),
  });
});

// Mock verification routes for testing
app.post("/verification/send-code", (req, res) => {
  const { email } = req.body;
  console.log("Test: Sending code to", email);

  res.json({
    success: true,
    message: "Test verification code sent (123456)",
    email: email,
  });
});

app.post("/verification/verify-code", (req, res) => {
  const { email, code } = req.body;
  console.log("Test: Verifying code", code, "for", email);

  if (code === "123456") {
    res.json({
      success: true,
      message: "Test code verified successfully",
    });
  } else {
    res.status(400).json({
      success: false,
      message: "Invalid test code. Use 123456",
    });
  }
});

app.post("/verification/reset-password", (req, res) => {
  const { email, code, newPassword } = req.body;
  console.log("Test: Resetting password for", email);

  res.json({
    success: true,
    message: "Test password reset successful",
  });
});

const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
  console.log(`🧪 Test verification server running on port ${PORT}`);
  console.log(`📍 Test endpoint: http://localhost:${PORT}/test`);
  console.log(`📧 Use test code: 123456`);
});
