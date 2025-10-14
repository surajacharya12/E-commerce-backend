const mongoose = require("mongoose");

const productSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, "Product name is required"],
      trim: true,
    },
    description: {
      type: String,
      trim: true,
    },
    quantity: {
      type: Number,
      required: [true, "Quantity is required"],
      min: 0,
    },
    stock: {
      type: Number,
      required: [true, "Stock is required"],
      min: 0,
    },
    price: {
      type: Number,
      required: [true, "Price is required"],
      min: 0,
    },
    offerPrice: {
      type: Number,
      min: 0,
    },
    images: [
      {
        image: {
          type: Number,
          required: true,
        },
        url: {
          type: String,
          default: "no_url",
        },
      },
    ],
    proCategoryId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Category", // Assuming you have a Category model
      required: [true, "Category is required"],
    },
    proSubCategoryId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "SubCategory", // Assuming you have a SubCategory model
      required: [true, "Subcategory is required"],
    },
    proBrandId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Brand", // Assuming you have a Brand model
    },
    // New fields for Colors and Sizes
    colors: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Color",
      },
    ],
    sizes: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Size",
      },
    ],
    rating: {
      userRating: {
        type: Number,
        default: 0,
        min: 0,
        max: 5,
      },
      adminRating: {
        type: Number,
        default: 0,
        min: 0,
        max: 5,
      },
      averageRating: {
        type: Number,
        default: 0,
        min: 0,
        max: 5,
      },
      totalReviews: {
        type: Number,
        default: 0,
        min: 0,
      },
    },
    points: {
      type: [String],
      default: [],
    },
    isActive: {
      type: Boolean,
      default: true,
    },
  },
  { timestamps: true }
);

// Method to calculate average rating
productSchema.methods.calculateAverageRating = function () {
  this.rating.averageRating =
    (this.rating.userRating + this.rating.adminRating) / 2;
  return this.save();
};

const Product = mongoose.model("Product", productSchema);

module.exports = Product;
