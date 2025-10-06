const mongoose = require("mongoose");

const discountSchema = new mongoose.Schema(
  {
    discountName: {
      type: String,
      required: [true, "Discount name is required"],
      trim: true,
    },
    description: {
      type: String,
      trim: true,
    },
    discountPercentage: {
      type: Number,
      required: [true, "Discount percentage is required"],
      min: 0,
      max: 100,
    },
    categoryIcon: {
      type: String,
      required: [true, "Category icon is required"],
    },
    discountIcon: {
      type: String,
    },
    dealIcon: {
      type: String,
    },
    discountPhoto: {
      type: String,
      required: [true, "Discount photo is required"],
    },
    date: {
      type: String,
      required: [true, "Date is required"],
    },
  },
  { timestamps: true }
);

const Discount = mongoose.model("Discount", discountSchema);

module.exports = Discount;
