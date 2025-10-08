const mongoose = require("mongoose");

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

const orderSchema = new mongoose.Schema(
  {
    orderNumber: {
      type: String,
      unique: true,
      default: generateOrderNumber,
    },
    userID: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    orderDate: {
      type: Date,
      default: Date.now,
    },
    orderStatus: {
      type: String,
      enum: ["pending", "processing", "shipped", "delivered", "cancelled"],
      default: "pending",
    },
    items: [
      {
        productID: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "Product",
          required: true,
        },
        productName: {
          type: String,
          required: true,
        },
        quantity: {
          type: Number,
          required: true,
        },
        price: {
          type: Number,
          required: true,
        },
        variant: {
          type: String,
        },
      },
    ],
    totalPrice: {
      type: Number,
      required: true,
    },
    shippingAddress: {
      phone: String,
      street: String,
      city: String,
      state: String,
      postalCode: String,
      country: String,
    },
    paymentMethod: {
      type: String,
      enum: ["cod", "prepaid"],
      required: true,
    },
    deliveryMethod: {
      type: String,
      enum: ["homeDelivery", "storeDelivery"],
      required: true,
      default: "homeDelivery",
    },
    selectedStore: {
      storeId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Store",
      },
      storeName: String,
      storeLocation: String,
      storeManagerName: String,
      storePhoneNumber: String,
    },
    couponCode: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Coupon",
    },
    orderTotal: {
      subtotal: Number,
      discount: Number,
      deliveryFee: Number,
      tax: {
        type: Number,
        default: 0,
      },
      total: Number,
    },
    trackingUrl: {
      type: String,
    },
    cancelledAt: {
      type: Date,
    },
    cancellationReason: {
      type: String,
    },
  },
  {
    timestamps: true, // This adds createdAt and updatedAt automatically
  }
);

const Order = mongoose.model("Order", orderSchema);

module.exports = Order;
