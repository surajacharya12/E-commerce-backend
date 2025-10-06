const express = require("express");
const router = express.Router();
const Discount = require("../model/discount");
const { discountUpload, cloudinary } = require("../config/cloudinary");

// GET all discounts
router.get("/", async (req, res) => {
  try {
    const discounts = await Discount.find({});
    res.status(200).json({ success: true, data: discounts });
  } catch (error) {
    res.status(400).json({ success: false, error: error.message, data: null });
  }
});

// POST a new discount with image upload
router.post("/", discountUpload.single("discountPhoto"), async (req, res) => {
  try {
    const {
      discountName,
      description,
      discountPercentage,
      categoryIcon,
      discountIcon,
      dealIcon,
    } = req.body;

    // Check if the file exists
    if (!req.file) {
      return res
        .status(400)
        .json({ success: false, message: "Discount photo is required." });
    }
    const discountPhoto = req.file.path;

    const discount = await Discount.create({
      discountName,
      description,
      discountPercentage,
      categoryIcon,
      discountIcon,
      dealIcon,
      discountPhoto,
      date: new Date().toLocaleDateString(),
    });
    res
      .status(201)
      .json({
        success: true,
        message: "Discount created successfully.",
        data: discount,
      });
  } catch (error) {
    res
      .status(400)
      .json({ success: false, message: error.message, data: null });
  }
});

// PUT (UPDATE) an existing discount with optional image upload
router.put("/:id", discountUpload.single("discountPhoto"), async (req, res) => {
  try {
    const updatedFields = { ...req.body };
    if (req.file) {
      updatedFields.discountPhoto = req.file.path;
    }

    const discount = await Discount.findByIdAndUpdate(
      req.params.id,
      updatedFields,
      {
        new: true,
        runValidators: true,
      }
    );

    if (!discount) {
      return res
        .status(404)
        .json({ success: false, message: "Discount not found", data: null });
    }
    res
      .status(200)
      .json({
        success: true,
        message: "Discount updated successfully.",
        data: discount,
      });
  } catch (error) {
    res
      .status(400)
      .json({ success: false, message: error.message, data: null });
  }
});

// DELETE a discount
router.delete("/:id", async (req, res) => {
  try {
    const deletedDiscount = await Discount.deleteOne({ _id: req.params.id });
    if (deletedDiscount.deletedCount === 0) {
      return res
        .status(404)
        .json({ success: false, message: "Discount not found", data: null });
    }
    res
      .status(200)
      .json({
        success: true,
        message: "Discount deleted successfully.",
        data: {},
      });
  } catch (error) {
    res
      .status(400)
      .json({ success: false, message: error.message, data: null });
  }
});

module.exports = router;
