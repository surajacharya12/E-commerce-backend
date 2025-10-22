const mongoose = require("mongoose");

// Function to generate unique return number
const generateReturnNumber = () => {
  const date = new Date();
  const year = date.getFullYear().toString().slice(-2);
  const month = (date.getMonth() + 1).toString().padStart(2, "0");
  const day = date.getDate().toString().padStart(2, "0");
  const random = Math.floor(Math.random() * 100000)
    .toString()
    .padStart(5, "0");
  return `RT${year}${month}${day}${random}`;
};

const returnSchema = new mongoose.Schema(
  {
    returnNumber: {
      type: String,
      unique: true,
      default: generateReturnNumber,
    },
    orderID: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Order",
      required: true,
    },
    orderNumber: {
      type: String,
      required: true,
    },
    userID: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    returnDate: {
      type: Date,
      default: Date.now,
    },
    returnStatus: {
      type: String,
      enum: [
        "requested",
        "approved",
        "rejected",
        "picked_up",
        "processing",
        "refunded",
        "cancelled",
      ],
      default: "requested",
    },
    returnType: {
      type: String,
      enum: ["refund", "exchange"],
      required: true,
    },
    returnReason: {
      type: String,
      enum: [
        "defective_product",
        "wrong_item_received",
        "size_issue",
        "quality_issue",
        "not_as_described",
        "damaged_in_shipping",
        "changed_mind",
        "other",
      ],
      required: true,
    },
    returnDescription: {
      type: String,
      required: true,
      maxlength: 500,
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
        returnQuantity: {
          type: Number,
          required: true,
        },
        condition: {
          type: String,
          enum: ["new", "used", "damaged"],
          default: "used",
        },
      },
    ],
    returnAmount: {
      type: Number,
      required: true,
    },
    refundMethod: {
      type: String,
      enum: ["original_payment", "store_credit", "bank_transfer"],
      default: "original_payment",
    },
    pickupAddress: {
      phone: String,
      street: String,
      city: String,
      state: String,
      postalCode: String,
      country: String,
    },
    images: [
      {
        url: String,
        description: String,
      },
    ],
    adminNotes: {
      type: String,
      maxlength: 1000,
    },
    processedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
    processedAt: {
      type: Date,
    },
    refundedAt: {
      type: Date,
    },
    refundTransactionId: {
      type: String,
    },
    trackingInfo: {
      pickupDate: Date,
      trackingNumber: String,
      courierService: String,
    },
  },
  {
    timestamps: true,
  }
);

// Index for better query performance
returnSchema.index({ userID: 1, returnDate: -1 });
returnSchema.index({ orderID: 1 });
returnSchema.index({ returnStatus: 1 });

const Return = mongoose.model("Return", returnSchema);

module.exports = Return;
