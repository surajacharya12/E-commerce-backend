const mongoose = require("mongoose");
const OrderCleanupService = require("../services/orderCleanup");
require("dotenv").config();

/**
 * Manual script to cleanup cancelled orders
 * Usage: node scripts/cleanupCancelledOrders.js [daysOld]
 * Example: node scripts/cleanupCancelledOrders.js 5
 */
async function runCleanup() {
  try {
    // Get days parameter from command line (default: 5)
    const daysOld = parseInt(process.argv[2]) || 5;

    console.log("🚀 Starting manual cancelled orders cleanup...");
    console.log(`📅 Removing cancelled orders older than ${daysOld} days`);

    // Connect to MongoDB
    await mongoose.connect(process.env.MONGO_URL);
    console.log("✅ Connected to MongoDB");

    // Get statistics before cleanup
    console.log("\n📊 Getting statistics before cleanup...");
    const statsBefore = await OrderCleanupService.getCancelledOrdersStats();
    console.log("📈 Stats before cleanup:", {
      totalCancelled: statsBefore.totalCancelled,
      eligibleForRemoval: statsBefore.eligibleForRemoval,
      totalValue: `₹${statsBefore.totalValue}`,
    });

    // Run cleanup
    console.log("\n🧹 Running cleanup...");
    const result = await OrderCleanupService.removeCancelledOrders(daysOld);

    if (result.success) {
      console.log("✅ Cleanup completed successfully!");
      console.log(`📊 Removed ${result.removedCount} orders`);

      if (result.removedOrders.length > 0) {
        console.log("\n📋 Removed orders details:");
        result.removedOrders.forEach((order, index) => {
          console.log(
            `${index + 1}. Order #${
              order.orderNumber || order.orderId.toString().slice(-8)
            } - ₹${order.totalPrice} (${order.daysSinceCancellation} days old)`
          );
        });
      }

      // Get statistics after cleanup
      console.log("\n📊 Getting statistics after cleanup...");
      const statsAfter = await OrderCleanupService.getCancelledOrdersStats();
      console.log("📈 Stats after cleanup:", {
        totalCancelled: statsAfter.totalCancelled,
        eligibleForRemoval: statsAfter.eligibleForRemoval,
        totalValue: `₹${statsAfter.totalValue}`,
      });
    } else {
      console.log("❌ Cleanup failed:", result.message);
    }
  } catch (error) {
    console.error("❌ Error during cleanup:", error);
  } finally {
    // Close database connection
    await mongoose.connection.close();
    console.log("🔌 Database connection closed");
    process.exit(0);
  }
}

// Run the cleanup
runCleanup();
