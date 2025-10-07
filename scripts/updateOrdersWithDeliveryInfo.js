const mongoose = require("mongoose");
const Order = require("../model/order");
require("dotenv").config();

// Connect to MongoDB
const connectDB = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log("MongoDB connected successfully");
  } catch (error) {
    console.error("MongoDB connection error:", error);
    process.exit(1);
  }
};

// Update existing orders with delivery information
const updateOrdersWithDeliveryInfo = async () => {
  try {
    console.log("Starting order update process...");

    // Find all orders that don't have deliveryMethod
    const ordersToUpdate = await Order.find({
      $or: [
        { deliveryMethod: { $exists: false } },
        { "orderTotal.deliveryFee": { $exists: false } },
        { "orderTotal.tax": { $exists: false } },
      ],
    });

    console.log(`Found ${ordersToUpdate.length} orders to update`);

    let updatedCount = 0;

    for (const order of ordersToUpdate) {
      try {
        // Set default delivery method to homeDelivery if not set
        if (!order.deliveryMethod) {
          order.deliveryMethod = "homeDelivery";
        }

        // Calculate delivery fee based on delivery method
        let deliveryFee = 0;
        if (order.deliveryMethod === "homeDelivery") {
          deliveryFee = 150;
        } else if (order.deliveryMethod === "storeDelivery") {
          deliveryFee = 100;
        }

        // Calculate subtotal from items if not available
        let subtotal = order.orderTotal?.subtotal;
        if (!subtotal) {
          subtotal = order.items.reduce(
            (sum, item) => sum + item.price * item.quantity,
            0
          );
        }

        // Calculate tax (10%)
        const tax = Math.round(subtotal * 0.1);

        // Get existing discount
        const discount = order.orderTotal?.discount || 0;

        // Calculate new total
        const newTotal = subtotal + deliveryFee + tax - discount;

        // Update order total
        order.orderTotal = {
          subtotal: subtotal,
          deliveryFee: deliveryFee,
          tax: tax,
          discount: discount,
          total: newTotal,
        };

        // Update total price
        order.totalPrice = newTotal;

        // Save the updated order
        await order.save();
        updatedCount++;

        console.log(
          `Updated order ${order._id} - Delivery: ${order.deliveryMethod}, Fee: ₹${deliveryFee}, Total: ₹${newTotal}`
        );
      } catch (error) {
        console.error(`Error updating order ${order._id}:`, error.message);
      }
    }

    console.log(
      `\nUpdate completed! Updated ${updatedCount} out of ${ordersToUpdate.length} orders.`
    );
  } catch (error) {
    console.error("Error during update process:", error);
  }
};

// Run the update
const runUpdate = async () => {
  await connectDB();
  await updateOrdersWithDeliveryInfo();

  console.log("\nClosing database connection...");
  await mongoose.connection.close();
  console.log("Database connection closed.");
  process.exit(0);
};

// Execute if run directly
if (require.main === module) {
  runUpdate().catch(console.error);
}

module.exports = { updateOrdersWithDeliveryInfo };
