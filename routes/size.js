const express = require("express");
const router = express.Router();
const Size = require("../model/size"); // Updated path
const Product = require("../model/product"); // Updated path
const asyncHandler = require("express-async-handler");

// Get all sizes
router.get(
  "/",
  asyncHandler(async (req, res) => {
    try {
      const sizes = await Size.find().sort({ name: 1 });
      res.json({
        success: true,
        message: "Sizes retrieved successfully.",
        data: sizes,
      });
    } catch (error) {
      res.status(500).json({ success: false, message: error.message });
    }
  })
);

// Get a size by ID
router.get(
  "/:id",
  asyncHandler(async (req, res) => {
    try {
      const sizeID = req.params.id;
      const size = await Size.findById(sizeID);
      if (!size) {
        return res
          .status(404)
          .json({ success: false, message: "Size not found." });
      }
      res.json({
        success: true,
        message: "Size retrieved successfully.",
        data: size,
      });
    } catch (error) {
      res.status(500).json({ success: false, message: error.message });
    }
  })
);

// Create a new size
router.post(
  "/",
  asyncHandler(async (req, res) => {
    const { name, description } = req.body;

    if (!name) {
      return res.status(400).json({
        success: false,
        message: "Size name is required.",
      });
    }

    // Validate name
    if (name.trim().length < 1) {
      return res.status(400).json({
        success: false,
        message: "Size name must be at least 1 character long.",
      });
    }

    try {
      // Check if size with same name already exists
      const existingSize = await Size.findOne({ name: name.trim() });

      if (existingSize) {
        return res.status(400).json({
          success: false,
          message: "Size with this name already exists.",
        });
      }

      const size = new Size({
        name: name.trim(),
        description: description ? description.trim() : undefined,
      });
      const newSize = await size.save();

      res.json({
        success: true,
        message: "Size created successfully.",
        data: newSize,
      });
    } catch (error) {
      res.status(500).json({ success: false, message: error.message });
    }
  })
);

// Update a size
router.put(
  "/:id",
  asyncHandler(async (req, res) => {
    const sizeID = req.params.id;
    const { name, description } = req.body;

    if (!name) {
      return res.status(400).json({
        success: false,
        message: "Size name is required.",
      });
    }

    // Validate name
    if (name.trim().length < 1) {
      return res.status(400).json({
        success: false,
        message: "Size name must be at least 1 character long.",
      });
    }

    try {
      const size = await Size.findById(sizeID);
      if (!size) {
        return res
          .status(404)
          .json({ success: false, message: "Size not found." });
      }

      // Check if size with same name already exists (excluding current one)
      const existingSize = await Size.findOne({
        name: name.trim(),
        _id: { $ne: sizeID },
      });

      if (existingSize) {
        return res.status(400).json({
          success: false,
          message: "Size with this name already exists.",
        });
      }

      size.name = name.trim();
      size.description = description ? description.trim() : size.description;
      await size.save();

      res.json({
        success: true,
        message: "Size updated successfully.",
        data: size,
      });
    } catch (error) {
      res.status(500).json({ success: false, message: error.message });
    }
  })
);

// Delete a size
router.delete(
  "/:id",
  asyncHandler(async (req, res) => {
    const sizeID = req.params.id;
    try {
      const size = await Size.findById(sizeID);
      if (!size) {
        return res
          .status(404)
          .json({ success: false, message: "Size not found." });
      }

      // Check if any products reference this size
      const productCount = await Product.countDocuments({
        sizes: { $in: [sizeID] },
      });
      if (productCount > 0) {
        return res.status(400).json({
          success: false,
          message:
            "Cannot delete size. It is referenced by one or more products.",
        });
      }

      await Size.findByIdAndDelete(sizeID);
      res.json({
        success: true,
        message: "Size deleted successfully.",
      });
    } catch (error) {
      res.status(500).json({ success: false, message: error.message });
    }
  })
);

// Get products associated with a specific size (optional, but useful)
router.get(
  "/:id/products",
  asyncHandler(async (req, res) => {
    try {
      const sizeID = req.params.id;

      const size = await Size.findById(sizeID);
      if (!size) {
        return res
          .status(404)
          .json({ success: false, message: "Size not found." });
      }

      const products = await Product.find({ sizes: { $in: [sizeID] } }).sort({
        name: 1,
      });

      res.json({
        success: true,
        message: `Products with size '${size.name}' retrieved successfully.`,
        data: products,
      });
    } catch (error) {
      res.status(500).json({ success: false, message: error.message });
    }
  })
);

module.exports = router;
