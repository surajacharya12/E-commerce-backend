const express = require("express");
const bodyParser = require("body-parser");
const cors = require("cors");
const asyncHandler = require("express-async-handler");
const dotenv = require("dotenv");
const mongoose = require("mongoose");
const connectToDatabase = require("./utils/mongo");
const {
  startNotificationCleanupScheduler,
} = require("./services/notificationCleanup");
const OrderCleanupService = require("./services/orderCleanup");

// Load environment variables
dotenv.config();

const app = express();
const PORT = process.env.PORT || 3001;

// --- Middleware ---
app.use(bodyParser.json({ limit: "10mb" }));
app.use(bodyParser.urlencoded({ extended: true, limit: "10mb" }));

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

// Static files
app.use("/image/products", express.static("public/products"));
app.use("/image/category", express.static("public/category"));
app.use("/image/poster", express.static("public/posters"));

// --- Lazy Mongo connection middleware for all requests ---
app.use(async (req, res, next) => {
  try {
    await connectToDatabase(process.env.MONGO_URL);
    next();
  } catch (err) {
    next(err);
  }
});

// --- Routes ---
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

// --- Health Check ---
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

app.get(
  "/health",
  asyncHandler(async (req, res) => {
    const dbState =
      mongoose.connection.readyState === 1 ? "connected" : "disconnected";
    res.status(200).json({
      uptime: process.uptime(),
      message: "OK",
      timestamp: new Date().toISOString(),
      database: dbState,
      environment: process.env.NODE_ENV || "development",
    });
  })
);

// --- 404 handler ---
app.all("*", (req, res) => {
  res.status(404).json({
    success: false,
    message: "Route not found",
    path: req.originalUrl,
  });
});

// --- Error handler ---
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

// --- Start schedulers in production ---
if (process.env.NODE_ENV === "production") {
  startNotificationCleanupScheduler();
  OrderCleanupService.scheduleCleanup(24, 5);
}

// --- Export for Vercel ---
module.exports = app;

// --- Local development ---
if (require.main === module) {
  app.listen(PORT, () => {
    console.log(`🚀 Server running on port ${PORT}`);
  });
}
