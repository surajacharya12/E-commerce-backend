const jwt = require("jsonwebtoken");

// Test JWT functionality
try {
  const testToken = jwt.sign(
    { id: "123", email: "test@test.com" },
    process.env.JWT_SECRET || "your-secret-key"
  );
  console.log("Generated test token:", testToken);

  const decoded = jwt.verify(
    testToken,
    process.env.JWT_SECRET || "your-secret-key"
  );
  console.log("Decoded token:", decoded);
} catch (error) {
  console.error("JWT test error:", error);
}
