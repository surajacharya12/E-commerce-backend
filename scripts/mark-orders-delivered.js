const mongoose = require("mongoose");
const Order = require("../model/order");
require("dotenv").config();

// Connect to MongoDB
mongoose.connect(process.env.MONGO_URL, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
});

async function markOrdersAsDelivered() {
  try {
    console.log("Connecting to database...");

    // Find all orders that are not delivered
    const orders = await Order.find({
      orderStatus: { $ne: "delivered" },
    }).limit(5); // Mark first 5 orders as delivered for testing

    console.log(`Found ${orders.length} orders to mark as delivered`);

    for (const order of orders) {
      order.orderStatus = "delivered";
      await order.save();
      console.log(`✅ Marked order ${order.orderNumber} as delivered`);
    }

    console.log("✅ All orders marked as delivered successfully!");
    process.exit(0);
  } catch (error) {
    console.error("❌ Error marking orders as delivered:", error);
    process.exit(1);
  }
}

markOrdersAsDelivered();
