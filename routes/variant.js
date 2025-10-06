const express = require("express");
const router = express.Router();
const Variant = require("../model/variant");
const Product = require("../model/product");
const asyncHandler = require("express-async-handler");

// Get all variants
router.get(
  "/",
  asyncHandler(async (req, res) => {
    try {
      const { variantTypeId } = req.query;
      let query = {};

      if (variantTypeId) {
        query.variantTypeId = variantTypeId;
      }

      const variants = await Variant.find(query)
        .populate("variantTypeId", "name type")
        .sort({ variantTypeId: 1, name: 1 });
      res.json({
        success: true,
        message: "Variants retrieved successfully.",
        data: variants,
      });
    } catch (error) {
      res.status(500).json({ success: false, message: error.message });
    }
  })
);

// Get a variant by ID
router.get(
  "/:id",
  asyncHandler(async (req, res) => {
    try {
      const variantID = req.params.id;
      const variant = await Variant.findById(variantID).populate(
        "variantTypeId",
        "name type"
      );
      if (!variant) {
        return res
          .status(404)
          .json({ success: false, message: "Variant not found." });
      }
      res.json({
        success: true,
        message: "Variant retrieved successfully.",
        data: variant,
      });
    } catch (error) {
      res.status(500).json({ success: false, message: error.message });
    }
  })
);

// Create a new variant
router.post(
  "/",
  asyncHandler(async (req, res) => {
    const { name, variantTypeId } = req.body;

    if (!name || !variantTypeId) {
      return res.status(400).json({
        success: false,
        message: "Name and variant type ID are required.",
      });
    }

    // Validate name
    if (name.trim().length < 1) {
      return res.status(400).json({
        success: false,
        message: "Variant name cannot be empty.",
      });
    }

    try {
      // Check if variant with same name exists for the same variant type
      const existingVariant = await Variant.findOne({
        name: name.trim(),
        variantTypeId: variantTypeId,
      });

      if (existingVariant) {
        return res.status(400).json({
          success: false,
          message:
            "Variant with this name already exists for the selected variant type.",
        });
      }

      const variant = new Variant({
        name: name.trim(),
        variantTypeId,
      });
      const newVariant = await variant.save();

      // Populate the variant type info for response
      await newVariant.populate("variantTypeId", "name type");

      res.json({
        success: true,
        message: "Variant created successfully.",
        data: newVariant,
      });
    } catch (error) {
      res.status(500).json({ success: false, message: error.message });
    }
  })
);

// Update a variant
router.put(
  "/:id",
  asyncHandler(async (req, res) => {
    const variantID = req.params.id;
    const { name, variantTypeId } = req.body;

    if (!name || !variantTypeId) {
      return res.status(400).json({
        success: false,
        message: "Name and variant type ID are required.",
      });
    }

    // Validate name
    if (name.trim().length < 1) {
      return res.status(400).json({
        success: false,
        message: "Variant name cannot be empty.",
      });
    }

    try {
      const variant = await Variant.findById(variantID);
      if (!variant) {
        return res
          .status(404)
          .json({ success: false, message: "Variant not found." });
      }

      // Check if variant with same name exists for the same variant type (excluding current one)
      const existingVariant = await Variant.findOne({
        name: name.trim(),
        variantTypeId: variantTypeId,
        _id: { $ne: variantID },
      });

      if (existingVariant) {
        return res.status(400).json({
          success: false,
          message:
            "Variant with this name already exists for the selected variant type.",
        });
      }

      variant.name = name.trim();
      variant.variantTypeId = variantTypeId;
      await variant.save();

      // Populate the variant type info for response
      await variant.populate("variantTypeId", "name type");

      res.json({
        success: true,
        message: "Variant updated successfully.",
        data: variant,
      });
    } catch (error) {
      res.status(500).json({ success: false, message: error.message });
    }
  })
);

// Delete a variant
router.delete(
  "/:id",
  asyncHandler(async (req, res) => {
    const variantID = req.params.id;
    try {
      const variant = await Variant.findById(variantID);
      if (!variant) {
        return res
          .status(404)
          .json({ success: false, message: "Variant not found." });
      }

      // Check if any products reference this variant
      const productCount = await Product.countDocuments({
        proVariantId: { $in: [variantID] },
      });

      if (productCount > 0) {
        return res.status(400).json({
          success: false,
          message:
            "Cannot delete variant. It is referenced by one or more products.",
        });
      }

      // If no products are referencing the variant, proceed with deletion
      await Variant.findByIdAndDelete(variantID);
      res.json({ success: true, message: "Variant deleted successfully." });
    } catch (error) {
      res.status(500).json({ success: false, message: error.message });
    }
  })
);

// Get variants by variant type ID
router.get(
  "/by-type/:variantTypeId",
  asyncHandler(async (req, res) => {
    try {
      const variantTypeId = req.params.variantTypeId;
      const variants = await Variant.find({ variantTypeId })
        .populate("variantTypeId", "name type")
        .sort({ name: 1 });
      res.json({
        success: true,
        message: "Variants retrieved successfully.",
        data: variants,
      });
    } catch (error) {
      res.status(500).json({ success: false, message: error.message });
    }
  })
);

// Get variant statistics
router.get(
  "/:id/stats",
  asyncHandler(async (req, res) => {
    try {
      const variantID = req.params.id;

      const variant = await Variant.findById(variantID).populate(
        "variantTypeId",
        "name type"
      );
      if (!variant) {
        return res
          .status(404)
          .json({ success: false, message: "Variant not found." });
      }

      // Count associated products
      const productCount = await Product.countDocuments({
        proVariantId: { $in: [variantID] },
      });

      const stats = {
        variant: variant,
        productCount: productCount,
      };

      res.json({
        success: true,
        message: "Variant statistics retrieved successfully.",
        data: stats,
      });
    } catch (error) {
      res.status(500).json({ success: false, message: error.message });
    }
  })
);

module.exports = router;
