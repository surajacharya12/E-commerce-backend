const express = require("express");
const router = express.Router();
const SubCategory = require("../model/subCategory");
const Brand = require("../model/brand");
const Product = require("../model/product");
const asyncHandler = require("express-async-handler");
// Assuming these are correctly defined in your config/cloudinary file
const { subcategoryUpload, cloudinary } = require("../config/cloudinary");

// Helper function to delete image from Cloudinary
const deleteImage = async (publicId) => {
  if (publicId) {
    try {
      await cloudinary.uploader.destroy(publicId);
    } catch (error) {
      console.error("Cloudinary deletion failed:", error);
    }
  }
};

// Get all sub-categories
router.get(
  "/",
  asyncHandler(async (req, res) => {
    try {
      const { categoryId } = req.query;
      let query = {};

      if (categoryId) {
        query.categoryId = categoryId;
      }

      const subCategories = await SubCategory.find(query)
        .populate("categoryId", "name")
        .sort({ categoryId: 1, name: 1 });
      res.json({
        success: true,
        message: "Sub-categories retrieved successfully.",
        data: subCategories,
      });
    } catch (error) {
      res.status(500).json({ success: false, message: error.message });
    }
  })
);

// Get a sub-category by ID (no change needed)
router.get(
  "/:id",
  asyncHandler(async (req, res) => {
    try {
      const subCategoryID = req.params.id;
      const subCategory = await SubCategory.findById(subCategoryID).populate(
        "categoryId",
        "name"
      );
      if (!subCategory) {
        return res
          .status(404)
          .json({ success: false, message: "Sub-category not found." });
      }
      res.json({
        success: true,
        message: "Sub-category retrieved successfully.",
        data: subCategory,
      });
    } catch (error) {
      res.status(500).json({ success: false, message: error.message });
    }
  })
);

// Create a new sub-category
router.post(
  "/",
  // Apply multer middleware for image upload
  subcategoryUpload.single("image"),
  asyncHandler(async (req, res) => {
    const { name, categoryId } = req.body;

    // Cloudinary details from file upload
    const imageUrl = req.file ? req.file.path : "";
    const imagePublicId = req.file ? req.file.filename : "";

    if (!name || !categoryId) {
      // Clean up uploaded file if validation fails
      await deleteImage(imagePublicId);
      return res.status(400).json({
        success: false,
        message: "Name and category ID are required.",
      });
    }

    // Validate name
    if (name.trim().length < 2) {
      await deleteImage(imagePublicId);
      return res.status(400).json({
        success: false,
        message: "Sub-category name must be at least 2 characters long.",
      });
    }

    try {
      // Check if sub-category with same name exists in the same category
      const existingSubCategory = await SubCategory.findOne({
        name: name.trim(),
        categoryId: categoryId,
      });

      if (existingSubCategory) {
        await deleteImage(imagePublicId);
        return res.status(400).json({
          success: false,
          message:
            "Sub-category with this name already exists in the selected category.",
        });
      }

      const subCategory = new SubCategory({
        name: name.trim(),
        categoryId,
        image: imageUrl, // Add image URL
        imagePublicId: imagePublicId, // Add public ID
      });
      const newSubCategory = await subCategory.save();

      // Populate the category info for response
      await newSubCategory.populate("categoryId", "name");

      res.json({
        success: true,
        message: "Sub-category created successfully.",
        data: newSubCategory,
      });
    } catch (error) {
      await deleteImage(imagePublicId);
      res.status(500).json({ success: false, message: error.message });
    }
  })
);

// Update a sub-category
router.put(
  "/:id",
  // Apply multer middleware for image upload
  subcategoryUpload.single("image"),
  asyncHandler(async (req, res) => {
    const subCategoryID = req.params.id;
    const { name, categoryId } = req.body;

    // Cloudinary details from file upload
    const newImageUrl = req.file ? req.file.path : null;
    const newImagePublicId = req.file ? req.file.filename : null;

    if (!name || !categoryId) {
      // Clean up newly uploaded file if validation fails
      await deleteImage(newImagePublicId);
      return res.status(400).json({
        success: false,
        message: "Name and category ID are required.",
      });
    }

    // Validate name
    if (name.trim().length < 2) {
      await deleteImage(newImagePublicId);
      return res.status(400).json({
        success: false,
        message: "Sub-category name must be at least 2 characters long.",
      });
    }

    try {
      const subCategory = await SubCategory.findById(subCategoryID);
      if (!subCategory) {
        await deleteImage(newImagePublicId);
        return res
          .status(404)
          .json({ success: false, message: "Sub-category not found." });
      }

      // Check if sub-category with same name exists in the same category (excluding current one)
      const existingSubCategory = await SubCategory.findOne({
        name: name.trim(),
        categoryId: categoryId,
        _id: { $ne: subCategoryID },
      });

      if (existingSubCategory) {
        await deleteImage(newImagePublicId);
        return res.status(400).json({
          success: false,
          message:
            "Sub-category with this name already exists in the selected category.",
        });
      }

      // Handle image update
      if (newImageUrl) {
        // Delete the old image from Cloudinary
        await deleteImage(subCategory.imagePublicId);
        subCategory.image = newImageUrl;
        subCategory.imagePublicId = newImagePublicId;
      }

      subCategory.name = name.trim();
      subCategory.categoryId = categoryId;
      await subCategory.save();

      // Populate the category info for response
      await subCategory.populate("categoryId", "name");

      res.json({
        success: true,
        message: "Sub-category updated successfully.",
        data: subCategory,
      });
    } catch (error) {
      await deleteImage(newImagePublicId);
      res.status(500).json({ success: false, message: error.message });
    }
  })
);

// Delete a sub-category
router.delete(
  "/:id",
  asyncHandler(async (req, res) => {
    const subCategoryID = req.params.id;
    try {
      const subCategory = await SubCategory.findById(subCategoryID);
      if (!subCategory) {
        return res
          .status(404)
          .json({ success: false, message: "Sub-category not found." });
      }

      // Check associations (Brand and Product counts remain the same)
      const brandCount = await Brand.countDocuments({
        subcategoryId: subCategoryID,
      });
      if (brandCount > 0) {
        return res.status(400).json({
          success: false,
          message:
            "Cannot delete sub-category. It is associated with one or more brands.",
        });
      }

      const productCount = await Product.countDocuments({
        proSubCategoryId: subCategoryID,
      });
      if (productCount > 0) {
        return res.status(400).json({
          success: false,
          message:
            "Cannot delete sub-category. It is referenced by one or more products.",
        });
      }

      // Delete image from Cloudinary before deleting the document
      await deleteImage(subCategory.imagePublicId);

      // Proceed with deletion
      await SubCategory.findByIdAndDelete(subCategoryID);
      res.json({
        success: true,
        message: "Sub-category deleted successfully.",
      });
    } catch (error) {
      res.status(500).json({ success: false, message: error.message });
    }
  })
);

// Remaining routes like /by-category/:categoryId and /:id/stats are unchanged
// ... [rest of the subCategories.js file] ...
module.exports = router;
