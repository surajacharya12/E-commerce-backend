const express = require("express");
const router = express.Router();
const Brand = require("../model/brand");
const Product = require("../model/product");
const asyncHandler = require("express-async-handler");
const mongoose = require("mongoose");

// Get all brands
router.get(
  "/",
  asyncHandler(async (req, res) => {
    try {
      const brands = await Brand.find()
        .populate("subcategoryId")
        .sort({ "subcategoryId.name": 1 });
      res.json({
        success: true,
        message: "Brands retrieved successfully.",
        data: brands,
      });
    } catch (error) {
      res.status(500).json({ success: false, message: error.message });
    }
  })
);

// Get a brand by ID
router.get(
  "/:id",
  asyncHandler(async (req, res) => {
    try {
      const brandID = req.params.id;
      const brand = await Brand.findById(brandID).populate("subcategoryId");
      if (!brand) {
        return res
          .status(404)
          .json({ success: false, message: "Brand not found." });
      }
      res.json({
        success: true,
        message: "Brand retrieved successfully.",
        data: brand,
      });
    } catch (error) {
      res.status(500).json({ success: false, message: error.message });
    }
  })
);

// Create a new brand
router.post(
  "/",
  asyncHandler(async (req, res) => {
    const { name, subcategoryId } = req.body;
    if (!name || !subcategoryId) {
      return res
        .status(400)
        .json({
          success: false,
          message: "Name and subcategory ID are required.",
        });
    }

    try {
      const newBrand = new Brand({ name, subcategoryId });
      await newBrand.save();
      res
        .status(201)
        .json({
          success: true,
          message: "Brand created successfully.",
          data: newBrand,
        });
    } catch (error) {
      res.status(500).json({ success: false, message: error.message });
    }
  })
);

// Update a brand
router.put(
  "/:id",
  asyncHandler(async (req, res) => {
    const brandID = req.params.id;
    const { name, subcategoryId } = req.body;
    if (!name || !subcategoryId) {
      return res
        .status(400)
        .json({
          success: false,
          message: "Name and subcategory ID are required.",
        });
    }

    try {
      const updatedBrand = await Brand.findByIdAndUpdate(
        brandID,
        { name, subcategoryId },
        { new: true }
      );
      if (!updatedBrand) {
        return res
          .status(404)
          .json({ success: false, message: "Brand not found." });
      }
      res.json({
        success: true,
        message: "Brand updated successfully.",
        data: updatedBrand,
      });
    } catch (error) {
      res.status(500).json({ success: false, message: error.message });
    }
  })
);

// Delete a brand with cascading product deletion
router.delete(
  "/:id",
  asyncHandler(async (req, res) => {
    const brandID = req.params.id;
    try {
      // Find and delete all products referencing this brand
      const deleteProducts = await Product.deleteMany({ proBrandId: brandID });

      // Delete the brand itself
      const deletedBrand = await Brand.findByIdAndDelete(brandID);

      if (!deletedBrand) {
        return res
          .status(404)
          .json({ success: false, message: "Brand not found." });
      }

      res.json({
        success: true,
        message: `Brand deleted successfully. Also deleted ${deleteProducts.deletedCount} associated products.`,
      });
    } catch (error) {
      res.status(500).json({ success: false, message: error.message });
    }
  })
);

module.exports = router;
