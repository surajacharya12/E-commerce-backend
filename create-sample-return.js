const mongoose = require("mongoose");
const dotenv = require("dotenv");

// Load environment variables
dotenv.config();

// Import models
const Return = require("./model/return");
const Order = require("./model/order");
const User = require("./model/user");

async function createSampleReturn() {
  try {
    console.log("🔌 Connecting to MongoDB...");
    await mongoose.connect(process.env.MONGO_URL);
    console.log("✅ Connected to MongoDB");

    // Check if we already have returns
    const existingReturns = await Return.find();
    if (existingReturns.length > 0) {
      console.log(`📦 Found ${existingReturns.length} existing returns`);
      console.log("Sample return:", existingReturns[0]);
      return;
    }

    // Create a sample user if none exists
    let sampleUser = await User.findOne();
    if (!sampleUser) {
      sampleUser = new User({
        name: "John Doe",
        email: "john.doe@example.com",
        phone: "1234567890",
        password: "hashedpassword123",
      });
      await sampleUser.save();
      console.log("✅ Created sample user");
    }

    // Create a sample order if none exists
    let sampleOrder = await Order.findOne();
    if (!sampleOrder) {
      sampleOrder = new Order({
        orderNumber: "ORD-001",
        userID: sampleUser._id,
        items: [
          {
            productID: new mongoose.Types.ObjectId(),
            productName: "Sample Product",
            quantity: 2,
            price: 99.99,
            variant: "Red-Large",
          },
        ],
        totalPrice: 199.98,
        orderStatus: "delivered",
        shippingAddress: {
          street: "123 Main St",
          city: "Sample City",
          state: "Sample State",
          postalCode: "12345",
          country: "Sample Country",
        },
      });
      await sampleOrder.save();
      console.log("✅ Created sample order");
    }

    // Create sample returns
    const sampleReturns = [
      {
        orderID: sampleOrder._id,
        orderNumber: sampleOrder.orderNumber,
        userID: sampleUser._id,
        returnType: "refund",
        returnReason: "defective_product",
        returnDescription: "Product arrived damaged",
        items: [
          {
            productID: sampleOrder.items[0].productID,
            productName: sampleOrder.items[0].productName,
            quantity: sampleOrder.items[0].quantity,
            price: sampleOrder.items[0].price,
            variant: sampleOrder.items[0].variant,
            returnQuantity: 1,
            condition: "damaged",
          },
        ],
        returnAmount: 99.99,
        returnStatus: "requested",
      },
      {
        orderID: sampleOrder._id,
        orderNumber: sampleOrder.orderNumber,
        userID: sampleUser._id,
        returnType: "exchange",
        returnReason: "size_issue",
        returnDescription: "Wrong size received",
        items: [
          {
            productID: sampleOrder.items[0].productID,
            productName: sampleOrder.items[0].productName,
            quantity: sampleOrder.items[0].quantity,
            price: sampleOrder.items[0].price,
            variant: sampleOrder.items[0].variant,
            returnQuantity: 1,
            condition: "used",
          },
        ],
        returnAmount: 99.99,
        returnStatus: "approved",
      },
    ];

    for (const returnData of sampleReturns) {
      const returnRequest = new Return(returnData);
      await returnRequest.save();
      console.log(`✅ Created return: ${returnRequest.returnNumber}`);
    }

    console.log("🎉 Sample returns created successfully!");

    // Test the returns
    const allReturns = await Return.find().populate("userID", "name email");
    console.log(`📊 Total returns in database: ${allReturns.length}`);

    allReturns.forEach((ret) => {
      console.log(
        `- ${ret.returnNumber}: ${ret.returnStatus} (${ret.returnAmount})`
      );
    });
  } catch (error) {
    console.error("❌ Error creating sample returns:", error);
  } finally {
    await mongoose.disconnect();
    console.log("🔌 Disconnected from MongoDB");
  }
}

createSampleReturn();
