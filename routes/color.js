const express = require("express");
const router = express.Router();
const Color = require("../model/color");
const Product = require("../model/product"); // Assuming Product model exists and references colors
const asyncHandler = require("express-async-handler");

// Get all colors
router.get(
  "/",
  asyncHandler(async (req, res) => {
    try {
      const colors = await Color.find().sort({ name: 1 }); // No populate needed
      res.json({
        success: true,
        message: "Colors retrieved successfully.",
        data: colors,
      });
    } catch (error) {
      res.status(500).json({ success: false, message: error.message });
    }
  })
);

// Get a color by ID
router.get(
  "/:id",
  asyncHandler(async (req, res) => {
    try {
      const colorID = req.params.id;
      const color = await Color.findById(colorID); // No populate needed
      if (!color) {
        return res
          .status(404)
          .json({ success: false, message: "Color not found." });
      }
      res.json({
        success: true,
        message: "Color retrieved successfully.",
        data: color,
      });
    } catch (error) {
      res.status(500).json({ success: false, message: error.message });
    }
  })
);

// Create a new color
router.post(
  "/",
  asyncHandler(async (req, res) => {
    const { name, hexCode, category } = req.body; // Added category

    if (!name || !category) {
      // Check for category
      return res.status(400).json({
        success: false,
        message: "Color name and category are required.",
      });
    }

    // Validate name
    if (name.trim().length < 2) {
      return res.status(400).json({
        success: false,
        message: "Color name must be at least 2 characters long.",
      });
    }

    // Validate category
    if (category.trim().length < 2) {
      return res.status(400).json({
        success: false,
        message: "Color category must be at least 2 characters long.",
      });
    }

    try {
      // Check if color with same name already exists
      const existingColor = await Color.findOne({ name: name.trim() });

      if (existingColor) {
        return res.status(400).json({
          success: false,
          message: "Color with this name already exists.",
        });
      }

      const color = new Color({
        name: name.trim(),
        hexCode: hexCode ? hexCode.trim() : undefined,
        category: category.trim(), // Assign category
      });
      const newColor = await color.save();

      res.json({
        success: true,
        message: "Color created successfully.",
        data: newColor,
      });
    } catch (error) {
      res.status(500).json({ success: false, message: error.message });
    }
  })
);

// Update a color
router.put(
  "/:id",
  asyncHandler(async (req, res) => {
    const colorID = req.params.id;
    const { name, hexCode, category } = req.body; // Added category

    if (!name || !category) {
      // Check for category
      return res.status(400).json({
        success: false,
        message: "Color name and category are required.",
      });
    }

    // Validate name
    if (name.trim().length < 2) {
      return res.status(400).json({
        success: false,
        message: "Color name must be at least 2 characters long.",
      });
    }

    // Validate category
    if (category.trim().length < 2) {
      return res.status(400).json({
        success: false,
        message: "Color category must be at least 2 characters long.",
      });
    }

    try {
      const color = await Color.findById(colorID);
      if (!color) {
        return res
          .status(404)
          .json({ success: false, message: "Color not found." });
      }

      // Check if color with same name already exists (excluding current one)
      const existingColor = await Color.findOne({
        name: name.trim(),
        _id: { $ne: colorID },
      });

      if (existingColor) {
        return res.status(400).json({
          success: false,
          message: "Color with this name already exists.",
        });
      }

      color.name = name.trim();
      color.hexCode = hexCode ? hexCode.trim() : color.hexCode;
      color.category = category.trim(); // Update category
      await color.save();

      res.json({
        success: true,
        message: "Color updated successfully.",
        data: color,
      });
    } catch (error) {
      res.status(500).json({ success: false, message: error.message });
    }
  })
);

// Delete a color
router.delete(
  "/:id",
  asyncHandler(async (req, res) => {
    const colorID = req.params.id;
    try {
      const color = await Color.findById(colorID);
      if (!color) {
        return res
          .status(404)
          .json({ success: false, message: "Color not found." });
      }

      // Check if any products reference this color
      // This assumes 'colors' is an array of ObjectId in Product schema
      const productCount = await Product.countDocuments({
        colors: { $in: [colorID] },
      });
      if (productCount > 0) {
        return res.status(400).json({
          success: false,
          message:
            "Cannot delete color. It is referenced by one or more products.",
        });
      }

      await Color.findByIdAndDelete(colorID);
      res.json({
        success: true,
        message: "Color deleted successfully.",
      });
    } catch (error) {
      res.status(500).json({ success: false, message: error.message });
    }
  })
);

// Get products associated with a specific color (optional, but useful)
router.get(
  "/:id/products",
  asyncHandler(async (req, res) => {
    try {
      const colorID = req.params.id;

      const color = await Color.findById(colorID);
      if (!color) {
        return res
          .status(404)
          .json({ success: false, message: "Color not found." });
      }

      const products = await Product.find({ colors: { $in: [colorID] } }).sort({
        name: 1,
      });

      res.json({
        success: true,
        message: `Products with color '${color.name}' retrieved successfully.`,
        data: products,
      });
    } catch (error) {
      res.status(500).json({ success: false, message: error.message });
    }
  })
);

module.exports = router;
