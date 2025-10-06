const express = require("express");
const router = express.Router();
const Category = require("../model/category");
const SubCategory = require("../model/subCategory");
const Product = require("../model/product");
const { categoryUpload, cloudinary } = require("../config/cloudinary");
const asyncHandler = require("express-async-handler");

// Get all categories
router.get(
  "/",
  asyncHandler(async (req, res) => {
    const categories = await Category.find();
    res.json({
      success: true,
      message: "Categories retrieved successfully.",
      data: categories,
    });
  })
);

// Get a category by ID
router.get(
  "/:id",
  asyncHandler(async (req, res) => {
    const categoryID = req.params.id;
    const category = await Category.findById(categoryID);
    if (!category) {
      return res
        .status(404)
        .json({ success: false, message: "Category not found." });
    }
    res.json({
      success: true,
      message: "Category retrieved successfully.",
      data: category,
    });
  })
);

// Create a new category with image upload
router.post(
  "/",
  categoryUpload.single("img"),
  asyncHandler(async (req, res) => {
    const { name } = req.body;
    if (!name) {
      return res
        .status(400)
        .json({ success: false, message: "Name is required." });
    }

    const imageUrl = req.file ? req.file.path : "no_url";

    const newCategory = new Category({
      name: name,
      image: imageUrl,
    });
    await newCategory.save();
    res.status(201).json({
      success: true,
      message: "Category created successfully.",
      data: newCategory,
    });
  })
);

// Update a category
router.put(
  "/:id",
  categoryUpload.single("img"),
  asyncHandler(async (req, res) => {
    const categoryID = req.params.id;
    const { name } = req.body;
    let image = req.body.image;

    if (req.file) {
      image = req.file.path;
    }

    if (!name || !image) {
      return res
        .status(400)
        .json({ success: false, message: "Name and image are required." });
    }

    const updatedCategory = await Category.findByIdAndUpdate(
      categoryID,
      { name: name, image: image },
      { new: true }
    );
    if (!updatedCategory) {
      return res
        .status(404)
        .json({ success: false, message: "Category not found." });
    }
    res.json({
      success: true,
      message: "Category updated successfully.",
      data: updatedCategory,
    });
  })
);

// Delete a category
router.delete(
  "/:id",
  asyncHandler(async (req, res) => {
    const categoryID = req.params.id;

    const [subcategories, products, category] = await Promise.all([
      SubCategory.find({ categoryId: categoryID }),
      Product.find({ proCategoryId: categoryID }),
      Category.findById(categoryID),
    ]);

    if (subcategories.length > 0) {
      return res.status(400).json({
        success: false,
        message: "Cannot delete category. Subcategories are referencing it.",
      });
    }

    if (products.length > 0) {
      return res.status(400).json({
        success: false,
        message: "Cannot delete category. Products are referencing it.",
      });
    }

    if (!category) {
      return res
        .status(404)
        .json({ success: false, message: "Category not found." });
    }

    if (category.image && category.image !== "no_url") {
      try {
        const publicId = category.image.split("/").pop().split(".")[0];
        await cloudinary.uploader.destroy(
          `online_store/categories/${publicId}`
        );
      } catch (cloudinaryError) {
        console.log("Error deleting image from Cloudinary:", cloudinaryError);
      }
    }

    await Category.findByIdAndDelete(categoryID);
    res.json({ success: true, message: "Category deleted successfully." });
  })
);

module.exports = router;
