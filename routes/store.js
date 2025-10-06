const express = require("express");
const router = express.Router();
const Store = require("../model/store");
const { storeUpload, cloudinary } = require("../config/cloudinary");
const asyncHandler = require("express-async-handler");

// Get all stores
router.get(
  "/",
  asyncHandler(async (req, res) => {
    try {
      const { isActive } = req.query;
      let query = {};

      if (isActive !== undefined) {
        query.isActive = isActive === "true";
      }

      const stores = await Store.find(query).sort({ createdAt: -1 });
      res.json({
        success: true,
        message: "Stores retrieved successfully.",
        data: stores,
      });
    } catch (error) {
      res.status(500).json({ success: false, message: error.message });
    }
  })
);

// Get store by ID
router.get(
  "/:id",
  asyncHandler(async (req, res) => {
    const store = await Store.findById(req.params.id);
    if (!store) {
      return res
        .status(404)
        .json({ success: false, message: "Store not found." });
    }
    res.json({ success: true, data: store });
  })
);

// Create a new store
router.post(
  "/",
  (req, res, next) => {
    // Check if the request is multipart/form-data
    const contentType = req.get("Content-Type");
    if (contentType && contentType.includes("multipart/form-data")) {
      storeUpload.fields([{ name: "storeManagerPhoto", maxCount: 1 }])(
        req,
        res,
        function (err) {
          if (err) {
            console.error("Upload error:", err);
            return res.status(400).json({
              success: false,
              message: "Image upload failed",
              error: err.message,
            });
          }
          next();
        }
      );
    } else {
      // For JSON requests, skip multer
      next();
    }
  },
  asyncHandler(async (req, res) => {
    const {
      storeName,
      storeManagerName,
      storeEmail,
      storePhoneNumber,
      storeDescription,
      storeLocation,
      gradientColor,
      isActive,
      storeBadge,
    } = req.body;

    let storeManagerPhoto = "no_url";

    if (req.files && req.files.storeManagerPhoto) {
      storeManagerPhoto = req.files.storeManagerPhoto[0].path;
    }

    if (
      !storeName ||
      !storeManagerName ||
      !storeEmail ||
      !storePhoneNumber ||
      !storeLocation
    ) {
      // NOTE: Ideally, add Cloudinary cleanup here if validation fails
      return res.status(400).json({
        success: false,
        message:
          "Store name, manager name, email, phone, and location are required.",
      });
    }

    try {
      const newStore = new Store({
        storeName,
        storeManagerName,
        storeEmail,
        storePhoneNumber,
        storeDescription,
        storeLocation,
        storeManagerPhoto,
        storeBadge,
        gradientColor: gradientColor || "#2697FF",
        isActive: isActive !== undefined ? isActive === "true" : true,
      });

      await newStore.save();
      res.status(201).json({
        success: true,
        message: "Store created successfully.",
        data: newStore,
      });
    } catch (error) {
      // NOTE: Ideally, add Cloudinary cleanup here if DB save fails
      if (error.code === 11000) {
        return res.status(400).json({
          success: false,
          message: "Email already exists. Please use a different email.",
        });
      }
      res.status(500).json({ success: false, message: error.message });
    }
  })
);

// Update store
router.put(
  "/:id",
  (req, res, next) => {
    // Check if the request is multipart/form-data
    const contentType = req.get("Content-Type");
    if (contentType && contentType.includes("multipart/form-data")) {
      storeUpload.fields([{ name: "storeManagerPhoto", maxCount: 1 }])(
        req,
        res,
        function (err) {
          if (err) {
            console.error("Upload error:", err);
            return res.status(400).json({
              success: false,
              message: "Image upload failed",
              error: err.message,
            });
          }
          next();
        }
      );
    } else {
      // For JSON requests, skip multer
      next();
    }
  },
  asyncHandler(async (req, res) => {
    const storeID = req.params.id;

    const updatedFields = { ...req.body }; // Handle file update
    if (req.files && req.files.storeManagerPhoto) {
      updatedFields.storeManagerPhoto = req.files.storeManagerPhoto[0].path;
    }

    // Explicitly handle boolean conversion for isActive
    if (updatedFields.isActive !== undefined) {
      updatedFields.isActive = updatedFields.isActive === "true";
    }

    const updatedStore = await Store.findByIdAndUpdate(storeID, updatedFields, {
      new: true,
      runValidators: true,
    });

    if (!updatedStore) {
      return res
        .status(404)
        .json({ success: false, message: "Store not found." });
    }
    res.status(200).json({
      success: true,
      message: "Store updated successfully.",
      data: updatedStore,
    });
  })
);

// Delete store
router.delete(
  "/:id",
  asyncHandler(async (req, res) => {
    const deletedStore = await Store.findByIdAndDelete(req.params.id);
    if (!deletedStore) {
      return res
        .status(404)
        .json({ success: false, message: "Store not found." });
    } // NOTE: Should include logic here to delete the photo from Cloudinary
    res.json({ success: true, message: "Store deleted successfully." });
  })
);

module.exports = router;
