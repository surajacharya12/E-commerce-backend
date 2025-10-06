const express = require("express");
const router = express.Router();
const VariantType = require("../model/variantType");
const Product = require("../model/product");
const Variant = require("../model/variant");
const asyncHandler = require("express-async-handler");

// Get all variant types
router.get(
  "/",
  asyncHandler(async (req, res) => {
    try {
      const variantTypes = await VariantType.find().sort({ name: 1 });
      res.json({
        success: true,
        message: "Variant types retrieved successfully.",
        data: variantTypes,
      });
    } catch (error) {
      res.status(500).json({ success: false, message: error.message });
    }
  })
);

// Get a variant type by ID
router.get(
  "/:id",
  asyncHandler(async (req, res) => {
    try {
      const variantTypeID = req.params.id;
      const variantType = await VariantType.findById(variantTypeID);
      if (!variantType) {
        return res
          .status(404)
          .json({ success: false, message: "Variant type not found." });
      }
      res.json({
        success: true,
        message: "Variant type retrieved successfully.",
        data: variantType,
      });
    } catch (error) {
      res.status(500).json({ success: false, message: error.message });
    }
  })
);

// Create a new variant type
router.post(
  "/",
  asyncHandler(async (req, res) => {
    const { name, type } = req.body;

    if (!name || !type) {
      return res.status(400).json({
        success: false,
        message: "Name and type are required.",
      });
    }

    // Validate name and type
    if (name.trim().length < 2) {
      return res.status(400).json({
        success: false,
        message: "Variant type name must be at least 2 characters long.",
      });
    }

    if (type.trim().length < 2) {
      return res.status(400).json({
        success: false,
        message: "Variant type must be at least 2 characters long.",
      });
    }

    try {
      // Check if variant type with same name or type already exists
      const existingVariantType = await VariantType.findOne({
        $or: [{ name: name.trim() }, { type: type.trim() }],
      });

      if (existingVariantType) {
        return res.status(400).json({
          success: false,
          message: "Variant type with this name or type already exists.",
        });
      }

      const variantType = new VariantType({
        name: name.trim(),
        type: type.trim(),
      });
      const newVariantType = await variantType.save();

      res.json({
        success: true,
        message: "Variant type created successfully.",
        data: newVariantType,
      });
    } catch (error) {
      res.status(500).json({ success: false, message: error.message });
    }
  })
);

// Update a variant type
router.put(
  "/:id",
  asyncHandler(async (req, res) => {
    const variantTypeID = req.params.id;
    const { name, type } = req.body;

    if (!name || !type) {
      return res.status(400).json({
        success: false,
        message: "Name and type are required.",
      });
    }

    // Validate name and type
    if (name.trim().length < 2) {
      return res.status(400).json({
        success: false,
        message: "Variant type name must be at least 2 characters long.",
      });
    }

    if (type.trim().length < 2) {
      return res.status(400).json({
        success: false,
        message: "Variant type must be at least 2 characters long.",
      });
    }

    try {
      const variantType = await VariantType.findById(variantTypeID);
      if (!variantType) {
        return res
          .status(404)
          .json({ success: false, message: "Variant type not found." });
      }

      // Check if variant type with same name or type already exists (excluding current one)
      const existingVariantType = await VariantType.findOne({
        $or: [{ name: name.trim() }, { type: type.trim() }],
        _id: { $ne: variantTypeID },
      });

      if (existingVariantType) {
        return res.status(400).json({
          success: false,
          message: "Variant type with this name or type already exists.",
        });
      }

      variantType.name = name.trim();
      variantType.type = type.trim();
      await variantType.save();

      res.json({
        success: true,
        message: "Variant type updated successfully.",
        data: variantType,
      });
    } catch (error) {
      res.status(500).json({ success: false, message: error.message });
    }
  })
);

// Delete a variant type
router.delete(
  "/:id",
  asyncHandler(async (req, res) => {
    const variantTypeID = req.params.id;
    try {
      const variantType = await VariantType.findById(variantTypeID);
      if (!variantType) {
        return res
          .status(404)
          .json({ success: false, message: "Variant type not found." });
      }

      // Check if any variant is associated with this variant type
      const variantCount = await Variant.countDocuments({
        variantTypeId: variantTypeID,
      });
      if (variantCount > 0) {
        return res.status(400).json({
          success: false,
          message:
            "Cannot delete variant type. It is associated with one or more variants.",
        });
      }

      // Check if any products reference this variant type
      const productCount = await Product.countDocuments({
        proVariantTypeId: variantTypeID,
      });
      if (productCount > 0) {
        return res.status(400).json({
          success: false,
          message:
            "Cannot delete variant type. It is referenced by one or more products.",
        });
      }

      // If no variants or products are associated, proceed with deletion
      await VariantType.findByIdAndDelete(variantTypeID);
      res.json({
        success: true,
        message: "Variant type deleted successfully.",
      });
    } catch (error) {
      res.status(500).json({ success: false, message: error.message });
    }
  })
);

// Get variant type statistics
router.get(
  "/:id/stats",
  asyncHandler(async (req, res) => {
    try {
      const variantTypeID = req.params.id;

      const variantType = await VariantType.findById(variantTypeID);
      if (!variantType) {
        return res
          .status(404)
          .json({ success: false, message: "Variant type not found." });
      }

      // Count associated variants and products
      const variantCount = await Variant.countDocuments({
        variantTypeId: variantTypeID,
      });
      const productCount = await Product.countDocuments({
        proVariantTypeId: variantTypeID,
      });

      const stats = {
        variantType: variantType,
        variantCount: variantCount,
        productCount: productCount,
      };

      res.json({
        success: true,
        message: "Variant type statistics retrieved successfully.",
        data: stats,
      });
    } catch (error) {
      res.status(500).json({ success: false, message: error.message });
    }
  })
);

// Get variants for a specific variant type
router.get(
  "/:id/variants",
  asyncHandler(async (req, res) => {
    try {
      const variantTypeID = req.params.id;

      const variantType = await VariantType.findById(variantTypeID);
      if (!variantType) {
        return res
          .status(404)
          .json({ success: false, message: "Variant type not found." });
      }

      const variants = await Variant.find({ variantTypeId: variantTypeID })
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

module.exports = router;
