const mongoose = require("mongoose");
const Order = require("../model/order");
require("dotenv").config();

// Function to generate unique order number
const generateOrderNumber = () => {
  const date = new Date();
  const year = date.getFullYear().toString().slice(-2);
  const month = (date.getMonth() + 1).toString().padStart(2, "0");
  const day = date.getDate().toString().padStart(2, "0");
  const random = Math.floor(Math.random() * 100000)
    .toString()
    .padStart(5, "0");
  return `SE${year}${month}${day}${random}`;
};

async function addOrderNumbers() {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGO_URL);
    console.log("Connected to MongoDB");

    // Find orders without order numbers
    const ordersWithoutNumbers = await Order.find({
      $or: [
        { orderNumber: { $exists: false } },
        { orderNumber: null },
        { orderNumber: "" },
      ],
    });

    console.log(
      `Found ${ordersWithoutNumbers.length} orders without order numbers`
    );

    // Update each order with a unique order number
    for (const order of ordersWithoutNumbers) {
      let orderNumber;
      let isUnique = false;

      // Generate unique order number
      while (!isUnique) {
        orderNumber = generateOrderNumber();
        const existingOrder = await Order.findOne({ orderNumber });
        if (!existingOrder) {
          isUnique = true;
        }
      }

      // Update the order
      await Order.findByIdAndUpdate(order._id, { orderNumber });
      console.log(
        `Updated order ${order._id} with order number: ${orderNumber}`
      );
    }

    console.log("Migration completed successfully!");
    process.exit(0);
  } catch (error) {
    console.error("Migration failed:", error);
    process.exit(1);
  }
}

// Run the migration
addOrderNumbers();
