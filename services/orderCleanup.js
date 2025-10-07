const Order = require("../model/order");

/**
 * Service to handle cleanup of cancelled orders
 */
class OrderCleanupService {
  /**
   * Remove cancelled orders that are older than specified days
   * @param {number} daysOld - Number of days after which to remove cancelled orders
   * @returns {Promise<Object>} - Result of cleanup operation
   */
  static async removeCancelledOrders(daysOld = 5) {
    try {
      console.log(
        `🧹 Starting cleanup of cancelled orders older than ${daysOld} days...`
      );

      // Calculate the cutoff date
      const cutoffDate = new Date();
      cutoffDate.setDate(cutoffDate.getDate() - daysOld);

      console.log(`📅 Cutoff date: ${cutoffDate.toISOString()}`);

      // Find cancelled orders older than cutoff date
      const cancelledOrders = await Order.find({
        orderStatus: "cancelled",
        $or: [
          { cancelledAt: { $exists: true, $lt: cutoffDate } },
          {
            cancelledAt: { $exists: false },
            updatedAt: { $lt: cutoffDate },
          },
        ],
      });

      console.log(
        `🔍 Found ${cancelledOrders.length} cancelled orders to remove`
      );

      if (cancelledOrders.length === 0) {
        return {
          success: true,
          message: "No cancelled orders to remove",
          removedCount: 0,
          removedOrders: [],
        };
      }

      // Log orders that will be removed (for audit purposes)
      const orderDetails = cancelledOrders.map((order) => ({
        orderId: order._id,
        orderNumber: order.orderNumber,
        userID: order.userID,
        totalPrice: order.totalPrice,
        cancelledAt: order.cancelledAt || order.updatedAt,
        daysSinceCancellation: Math.floor(
          (new Date() - (order.cancelledAt || order.updatedAt)) /
            (1000 * 60 * 60 * 24)
        ),
      }));

      console.log("📋 Orders to be removed:", orderDetails);

      // Remove the orders
      const deleteResult = await Order.deleteMany({
        _id: { $in: cancelledOrders.map((order) => order._id) },
      });

      console.log(
        `✅ Successfully removed ${deleteResult.deletedCount} cancelled orders`
      );

      return {
        success: true,
        message: `Successfully removed ${deleteResult.deletedCount} cancelled orders`,
        removedCount: deleteResult.deletedCount,
        removedOrders: orderDetails,
      };
    } catch (error) {
      console.error("❌ Error during cancelled orders cleanup:", error);
      return {
        success: false,
        message: `Error during cleanup: ${error.message}`,
        removedCount: 0,
        removedOrders: [],
      };
    }
  }

  /**
   * Get statistics about cancelled orders
   * @returns {Promise<Object>} - Statistics about cancelled orders
   */
  static async getCancelledOrdersStats() {
    try {
      const now = new Date();
      const fiveDaysAgo = new Date(now.getTime() - 5 * 24 * 60 * 60 * 1000);

      const stats = await Order.aggregate([
        {
          $match: { orderStatus: "cancelled" },
        },
        {
          $group: {
            _id: null,
            totalCancelled: { $sum: 1 },
            eligibleForRemoval: {
              $sum: {
                $cond: [
                  {
                    $or: [
                      { $lt: ["$cancelledAt", fiveDaysAgo] },
                      {
                        $and: [
                          { $not: { $ifNull: ["$cancelledAt", false] } },
                          { $lt: ["$updatedAt", fiveDaysAgo] },
                        ],
                      },
                    ],
                  },
                  1,
                  0,
                ],
              },
            },
            totalValue: { $sum: "$totalPrice" },
          },
        },
      ]);

      return (
        stats[0] || {
          totalCancelled: 0,
          eligibleForRemoval: 0,
          totalValue: 0,
        }
      );
    } catch (error) {
      console.error("❌ Error getting cancelled orders stats:", error);
      return {
        totalCancelled: 0,
        eligibleForRemoval: 0,
        totalValue: 0,
      };
    }
  }

  /**
   * Schedule automatic cleanup
   * @param {number} intervalHours - How often to run cleanup (in hours)
   * @param {number} daysOld - How old cancelled orders should be before removal
   */
  static scheduleCleanup(intervalHours = 24, daysOld = 5) {
    console.log(
      `⏰ Scheduling cancelled orders cleanup every ${intervalHours} hours`
    );

    // Run immediately on startup
    this.removeCancelledOrders(daysOld);

    // Schedule recurring cleanup
    setInterval(async () => {
      console.log("🔄 Running scheduled cancelled orders cleanup...");
      await this.removeCancelledOrders(daysOld);
    }, intervalHours * 60 * 60 * 1000);
  }
}

module.exports = OrderCleanupService;
