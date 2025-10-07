#!/usr/bin/env node

const mongoose = require("mongoose");
const dotenv = require("dotenv");

// Load environment variables
dotenv.config();

const URL = process.env.MONGO_URL;

if (!URL) {
  console.error("❌ MONGO_URL environment variable is not set");
  process.exit(1);
}

console.log("🔍 Testing MongoDB connection...");
console.log("📍 URL:", URL.replace(/\/\/([^:]+):([^@]+)@/, "//***:***@")); // Hide credentials

const mongoOptions = {
  maxPoolSize: 10,
  serverSelectionTimeoutMS: 5000,
  socketTimeoutMS: 45000,
  bufferCommands: false,
};

async function testConnection() {
  try {
    console.log("🔌 Connecting to MongoDB...");
    await mongoose.connect(URL, mongoOptions);
    console.log("✅ MongoDB connection successful!");

    // Test a simple operation
    const collections = await mongoose.connection.db
      .listCollections()
      .toArray();
    console.log(`📊 Found ${collections.length} collections in database`);

    // Close connection
    await mongoose.connection.close();
    console.log("🔌 Connection closed successfully");

    console.log("\n🎉 Database connection test passed!");
    process.exit(0);
  } catch (error) {
    console.error("❌ MongoDB connection failed:", error.message);

    if (error.message.includes("authentication failed")) {
      console.log("\n💡 Troubleshooting tips:");
      console.log("   - Check your username and password");
      console.log("   - Ensure database user has proper permissions");
    } else if (
      error.message.includes("ENOTFOUND") ||
      error.message.includes("timeout")
    ) {
      console.log("\n💡 Troubleshooting tips:");
      console.log("   - Check your internet connection");
      console.log("   - Verify the MongoDB Atlas cluster is running");
      console.log("   - Check network access settings (allow 0.0.0.0/0)");
    }

    process.exit(1);
  }
}

testConnection();
