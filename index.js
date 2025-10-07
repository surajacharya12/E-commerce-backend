const express = require("express");
const bodyParser = require("body-parser");
const cors = require("cors");
const mongoose = require("mongoose");
const asyncHandler = require("express-async-handler");
const dotenv = require("dotenv");
const {
  startNotificationCleanupScheduler,
} = require("./services/notificationCleanup");

// Load environment variables
dotenv.config();

const app = express();

// Production-ready CORS configuration
const corsOptions = {
  origin:
    process.env.NODE_ENV === "production"
      ? [process.env.FRONTEND_URL, "https://your-dashboard-domain.vercel.app"]
      : "*",
  credentials: true,
  optionsSuccessStatus: 200,
};

app.use(cors(corsOptions));

// Body parsing middleware with limits
app.use(bodyParser.json({ limit: "10mb" }));
app.use(bodyParser.urlencoded({ extended: true, limit: "10mb" }));

// Security headers
app.use((req, res, next) => {
  res.header("X-Content-Type-Options", "nosniff");
  res.header("X-Frame-Options", "DENY");
  res.header("X-XSS-Protection", "1; mode=block");
  next();
});

app.use("/image/products", express.static("public/products"));
app.use("/image/category", express.static("public/category"));
app.use("/image/poster", express.static("public/posters"));

// MongoDB connection with production optimizations
const URL = process.env.MONGO_URL;
const mongoOptions = {
  maxPoolSize: 10, // Maintain up to 10 socket connections
  serverSelectionTimeoutMS: 5000, // Keep trying to send operations for 5 seconds
  socketTimeoutMS: 45000, // Close sockets after 45 seconds of inactivity
  bufferCommands: false, // Disable mongoose buffering
  // Removed deprecated options: useNewUrlParser, useUnifiedTopology, bufferMaxEntries
};

// Connect to MongoDB with error handling
const connectDB = async () => {
  try {
    await mongoose.connect(URL, mongoOptions);
    console.log("Connected to Database successfully");
  } catch (error) {
    console.error("MongoDB connection error:", error);
    // In production, you might want to retry or exit
    if (process.env.NODE_ENV === "production") {
      console.error("Failed to connect to database in production");
      process.exit(1);
    }
  }
};

// Initialize database connection
connectDB();

const db = mongoose.connection;
db.on("error", (error) => {
  console.error("MongoDB connection error:", error);
});

db.on("disconnected", () => {
  console.log("MongoDB disconnected");
  // Attempt to reconnect in production
  if (process.env.NODE_ENV === "production") {
    setTimeout(connectDB, 5000);
  }
});

db.on("reconnected", () => {
  console.log("MongoDB reconnected");
});

// Graceful shutdown
process.on("SIGINT", async () => {
  try {
    await mongoose.connection.close();
    console.log("MongoDB connection closed through app termination");
    process.exit(0);
  } catch (error) {
    console.error("Error during graceful shutdown:", error);
    process.exit(1);
  }
});

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

// Health check endpoint for monitoring
app.get(
  "/health",
  asyncHandler(async (req, res) => {
    const healthCheck = {
      uptime: process.uptime(),
      message: "OK",
      timestamp: new Date().toISOString(),
      database:
        mongoose.connection.readyState === 1 ? "connected" : "disconnected",
      environment: process.env.NODE_ENV || "development",
    };

    res.status(200).json(healthCheck);
  })
);

// Enhanced error handling middleware
app.use((error, req, res, next) => {
  console.error("Error occurred:", {
    message: error.message,
    stack: error.stack,
    url: req.url,
    method: req.method,
    timestamp: new Date().toISOString(),
  });

  // Don't leak error details in production
  const message =
    process.env.NODE_ENV === "production"
      ? "Something went wrong!"
      : error.message;

  res.status(error.status || 500).json({
    success: false,
    message: message,
    ...(process.env.NODE_ENV !== "production" && { stack: error.stack }),
  });
});

// Handle 404 routes
app.use("*", (req, res) => {
  res.status(404).json({
    success: false,
    message: "Route not found",
    path: req.originalUrl,
  });
});

const PORT = process.env.PORT || 3001;

// For Vercel deployment, we export the app instead of listening
if (process.env.NODE_ENV !== "production") {
  app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
    // Start the notification cleanup scheduler
    startNotificationCleanupScheduler();
  });
} else {
  // In production, start the scheduler immediately
  startNotificationCleanupScheduler();
}

// Export the Express app for Vercel
module.exports = app;
