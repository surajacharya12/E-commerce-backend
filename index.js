const express = require("express");
const bodyParser = require("body-parser");
const cors = require("cors");
const asyncHandler = require("express-async-handler");
const dotenv = require("dotenv");
const connectDB = require("./utils/db");
const {
  startNotificationCleanupScheduler,
} = require("./services/notificationCleanup");
const OrderCleanupService = require("./services/orderCleanup");

// Load environment variables
dotenv.config();

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(bodyParser.json({ limit: "10mb" }));
app.use(bodyParser.urlencoded({ extended: true, limit: "10mb" }));

// Security headers
app.use((req, res, next) => {
  res.header("X-Content-Type-Options", "nosniff");
  res.header("X-Frame-Options", "DENY");
  res.header("X-XSS-Protection", "1; mode=block");
  next();
});

// CORS
const corsOptions = {
  origin: process.env.CORS_ORIGIN || "*",
  methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization"],
};
app.use(cors(corsOptions));

// Static file serving
app.use("/image/products", express.static("public/products"));
app.use("/image/category", express.static("public/category"));
app.use("/image/poster", express.static("public/posters"));

// Routes
app.use("/categories", require("./routes/category"));
app.use("/subCategories", require("./routes/subCategory"));
app.use("/brands", require("./routes/brand"));
app.use("/variantTypes", require("./routes/variantType"));
app.use("/variants", require("./routes/variant"));
app.use("/products", require("./routes/product"));
app.use("/couponCodes", require("./routes/couponCode"));
app.use("/posters", require("./routes/poster"));
app.use("/users", require("./routes/user"));
app.use("/auth", require("./routes/auth"));
app.use("/forgot-password", require("./routes/forgotPassword"));
app.use("/orders", require("./routes/order"));
app.use("/payment", require("./routes/payment"));
app.use("/notification", require("./routes/notification"));
app.use("/stores", require("./routes/store"));
app.use("/discounts", require("./routes/discount"));
app.use("/favorites", require("./routes/favorite"));
app.use("/ratings", require("./routes/rating"));
app.use("/chats", require("./routes/chat"));
app.use("/cart", require("./routes/cart"));

// Health check endpoint
app.get(
  "/",
  asyncHandler(async (req, res) => {
    res.json({
      success: true,
      message: "API working successfully",
      environment: process.env.NODE_ENV || "development",
      timestamp: new Date().toISOString(),
      data: null,
    });
  })
);

// Monitoring health endpoint
app.get(
  "/health",
  asyncHandler(async (req, res) => {
    res.status(200).json({
      uptime: process.uptime(),
      message: "OK",
      timestamp: new Date().toISOString(),
      database:
        require("mongoose").connection.readyState === 1
          ? "connected"
          : "disconnected",
      environment: process.env.NODE_ENV || "development",
    });
  })
);

// Error handling
app.use((err, req, res, next) => {
  console.error("❌ Error occurred:", {
    message: err.message,
    stack: err.stack,
    url: req.url,
    method: req.method,
    timestamp: new Date().toISOString(),
  });

  if (err.status === 404 || err.name === "NotFoundError") {
    return res.status(404).json({
      success: false,
      message: "Route not found",
      path: req.originalUrl,
    });
  }

  const isProd = process.env.NODE_ENV === "production";
  res.status(err.status || 500).json({
    success: false,
    message: isProd ? "Internal server error" : err.message,
    ...(isProd ? {} : { stack: err.stack }),
  });
});

// Handle 404 (any unmatched route)
app.use("*", (req, res) => {
  res.status(404).json({
    success: false,
    message: "Route not found",
    path: req.originalUrl,
  });
});

// Start schedulers (only when connected)
connectDB(process.env.MONGO_URL).then(() => {
  if (process.env.NODE_ENV === "production") {
    startNotificationCleanupScheduler();
    OrderCleanupService.scheduleCleanup(24, 5);
  }
  console.log("✅ Schedulers started (if in production)");
});

// Export app for Vercel
module.exports = app;

// Local development mode
if (require.main === module) {
  app.listen(PORT, () => {
    console.log(`🚀 Server running on port ${PORT}`);
  });
}
