const express = require("express");
const bodyParser = require("body-parser");
const cors = require("cors");
const mongoose = require("mongoose");
const asyncHandler = require("express-async-handler");
const dotenv = require("dotenv");
const {
  startNotificationCleanupScheduler,
} = require("./services/notificationCleanup");
const OrderCleanupService = require("./services/orderCleanup");

// Load environment variables
dotenv.config();

const app = express();

const PORT = process.env.PORT || 3001;

app.use(bodyParser.json({ limit: "10mb" }));
app.use(bodyParser.urlencoded({ extended: true, limit: "10mb" }));

app.use((req, res, next) => {
  res.header("X-Content-Type-Options", "nosniff");
  res.header("X-Frame-Options", "DENY");
  res.header("X-XSS-Protection", "1; mode=block");
  next();
});

const corsOptions = {
  origin: process.env.CORS_ORIGIN || '*',
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
};
app.use(cors(corsOptions));

app.use("/image/products", express.static("public/products"));
app.use("/image/category", express.static("public/category"));
app.use("/image/poster", express.static("public/posters"));

const URL = process.env.MONGO_URL;
const mongoOptions = {
  maxPoolSize: 10, 
  serverSelectionTimeoutMS: 5000, 
  socketTimeoutMS: 45000, 
  bufferCommands: false, 
};

const connectDB = async () => {
  try {
    await mongoose.connect(URL, mongoOptions);
    console.log("Connected to Database successfully");
    return true;
  } catch (error) {
    console.error("MongoDB connection error:", error);
    if (process.env.NODE_ENV === "production") {
      console.error("Failed to connect to database in production");
      process.exit(1);
    }
    return false;
  }
};

const start = async () => {
  const connected = await connectDB();

  const startSchedulers = () => {
    startNotificationCleanupScheduler();
    OrderCleanupService.scheduleCleanup(24, 5);
  };

  if (process.env.NODE_ENV === "production") {
    if (!connected) {
      console.error("Failed to connect to DB in production. Exiting.");
      process.exit(1);
    }
    startSchedulers();
  }

  const server = app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
    if (connected) {
      if (process.env.NODE_ENV !== "production") {
        startSchedulers();
      }
    } else {
      console.warn("⚠️  Database not connected; schedulers will not start.");
    }
  });

  server.on("error", (err) => {
    if (err.code === "EADDRINUSE") {
      console.error(`Port ${PORT} is already in use. Make sure no other process is listening on this port.`);
    } else {
      console.error("Server error:", err);
    }
    process.exit(1);
  });
};

if (require.main === module) {
  start();
}

const db = mongoose.connection;
db.on("error", (error) => {
  console.error("MongoDB connection error:", error);
});

db.on("disconnected", () => {
  console.log("MongoDB disconnected");
  if (process.env.NODE_ENV === "production") {
    setTimeout(connectDB, 5000);
  }
});

db.on("reconnected", () => {
  console.log("MongoDB reconnected");
});

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

// 🌟 Fixed Root Route — Send plain text instead of JSON
app.get(
  "/",
  asyncHandler(async (req, res) => {
    res.type("text/plain").send(
      `API working successfully
Environment: ${process.env.NODE_ENV || "development"}
Timestamp: ${new Date().toISOString()}`
    );
  })
);

// Health check endpoint
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
  res.status(404).send("Route not found");
});

module.exports = app;
