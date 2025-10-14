const mongoose = require("mongoose");

const colorSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, "Color name is required"],
      unique: true,
      trim: true,
    },
    hexCode: {
      type: String,
      trim: true,
      match: [
        /^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/,
        "Please enter a valid hex code (e.g., #FFFFFF or #FFF)",
      ],
      default: "#000000",
    },
    category: {
      // Added a simple string category field
      type: String,
      required: [true, "Color category is required"],
      trim: true,
      minlength: [2, "Color category must be at least 2 characters long"],
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Color", colorSchema);
