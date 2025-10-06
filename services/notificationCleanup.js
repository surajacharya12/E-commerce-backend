const cron = require("node-cron");
const Notification = require("../model/notification");
const { cloudinary } = require("../config/cloudinary");

// Cleanup function to delete notifications older than 30 days
const cleanupOldNotifications = async () => {
  try {
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    console.log(
      `Starting notification cleanup for notifications older than ${thirtyDaysAgo.toISOString()}`
    );

    const oldNotifications = await Notification.find({
      createdAt: { $lt: thirtyDaysAgo },
    });

    if (oldNotifications.length === 0) {
      console.log("No old notifications to clean up");
      return 0;
    }

    // Delete associated images from Cloudinary
    for (const notification of oldNotifications) {
      if (notification.imageUrl) {
        try {
          const publicId = notification.imageUrl.split("/").pop().split(".")[0];
          await cloudinary.uploader.destroy(
            `online_store/notifications/${publicId}`
          );
          console.log(`Deleted image for notification: ${notification._id}`);
        } catch (cloudinaryError) {
          console.log(
            "Error deleting old notification image:",
            cloudinaryError
          );
        }
      }
    }

    // Delete old notifications from database
    const result = await Notification.deleteMany({
      createdAt: { $lt: thirtyDaysAgo },
    });

    console.log(
      `✅ Cleanup completed: Deleted ${result.deletedCount} old notifications`
    );
    return result.deletedCount;
  } catch (error) {
    console.error("❌ Error during notification cleanup:", error);
    return 0;
  }
};

// Schedule cleanup to run daily at 2:00 AM
const startNotificationCleanupScheduler = () => {
  // Run every day at 2:00 AM
  cron.schedule(
    "0 2 * * *",
    async () => {
      console.log("🧹 Running scheduled notification cleanup...");
      await cleanupOldNotifications();
    },
    {
      scheduled: true,
      timezone: "UTC",
    }
  );

  console.log(
    "📅 Notification cleanup scheduler started - runs daily at 2:00 AM UTC"
  );
};

module.exports = {
  cleanupOldNotifications,
  startNotificationCleanupScheduler,
};
