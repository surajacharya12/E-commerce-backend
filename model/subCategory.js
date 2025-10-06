const mongoose = require("mongoose");

// Define the SubCategory schema with image fields
const subCategorySchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, "Name is required"],
      trim: true,
    },
    categoryId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Category",
      required: [true, "Category ID is required"],
    },
    // New fields for image
    image: {
      type: String, // Store the URL of the image
      default: "",
    },
    imagePublicId: {
      type: String, // Store the Cloudinary public ID
      default: "",
    },
  },
  { timestamps: true }
);

// Create the SubCategory model
const SubCategory = mongoose.model("SubCategory", subCategorySchema);

module.exports = SubCategory;
