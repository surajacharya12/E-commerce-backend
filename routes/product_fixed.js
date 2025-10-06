const express = require("express");
const router = express.Router();
const Product = require("../model/product");
const multer = require("multer");
const { productUpload, cloudinary } = require("../config/cloudinary");
const asyncHandler = require("express-async-handler");

// Get all products
router.get(
  "/",
  asyncHandler(async (req, res) => {
    try {
      const products = await Product.find()
        .populate("proCategoryId", "id name")
        .populate("proSubCategoryId", "id name")
        .populate("proBrandId", "id name")
        .populate("proVariantTypeId", "id type")
        .populate("proVariantId", "id name");
      res.json({
        success: true,
        message: "Products retrieved successfully.",
        data: products,
      });
    } catch (error) {
      res.status(500).json({ success: false, message: error.message });
    }
  })
);

// Get a product by ID
router.get(
  "/:id",
  asyncHandler(async (req, res) => {
    try {
      const productID = req.params.id;
      const product = await Product.findById(productID)
        .populate("proCategoryId", "id name")
        .populate("proSubCategoryId", "id name")
        .populate("proBrandId", "id name")
        .populate("proVariantTypeId", "id name")
        .populate("proVariantId", "id name");
      if (!product) {
        return res
          .status(404)
          .json({ success: false, message: "Product not found." });
      }
      res.json({
        success: true,
        message: "Product retrieved successfully.",
        data: product,
      });
    } catch (error) {
      res.status(500).json({ success: false, message: error.message });
    }
  })
);

// Helper function to create product
async function createProductHelper(productData, imageUrls = []) {
  const {
    name,
    description,
    quantity,
    price,
    offerPrice,
    proCategoryId,
    proSubCategoryId,
    proBrandId,
    proVariantTypeId,
    proVariantId,
  } = productData;

  if (!name || !quantity || !price || !proCategoryId || !proSubCategoryId) {
    throw new Error(
      "Required fields are missing: name, quantity, price, proCategoryId, proSubCategoryId"
    );
  }

  const newProduct = new Product({
    name,
    description,
    quantity: parseInt(quantity),
    price: parseFloat(price),
    offerPrice: offerPrice ? parseFloat(offerPrice) : undefined,
    proCategoryId,
    proSubCategoryId,
    proBrandId: proBrandId || undefined,
    proVariantTypeId: proVariantTypeId || undefined,
    proVariantId: proVariantId || [],
    images: imageUrls,
  });

  return await newProduct.save();
}

// Create new product - handles both JSON and multipart data
router.post(
  "/",
  asyncHandler(async (req, res) => {
    const contentType = req.get("Content-Type");

    if (contentType && contentType.includes("multipart/form-data")) {
      // Handle multipart form data with images
      productUpload.fields([
        { name: "image1", maxCount: 1 },
        { name: "image2", maxCount: 1 },
        { name: "image3", maxCount: 1 },
        { name: "image4", maxCount: 1 },
        { name: "image5", maxCount: 1 },
      ])(req, res, async function (err) {
        if (err instanceof multer.MulterError) {
          if (err.code === "LIMIT_FILE_SIZE") {
            err.message =
              "File size is too large. Maximum filesize is 5MB per image.";
          }
          return res.json({ success: false, message: err.message });
        } else if (err) {
          return res.json({ success: false, message: err.message });
        }

        try {
          // Process uploaded images
          const imageUrls = [];
          const fields = ["image1", "image2", "image3", "image4", "image5"];

          fields.forEach((field, index) => {
            if (req.files && req.files[field] && req.files[field].length > 0) {
              const file = req.files[field][0];
              const imageUrl = file.path; // Cloudinary URL
              imageUrls.push({ image: index + 1, url: imageUrl });
            }
          });
          const newProduct = await createProductHelper(req.body, imageUrls);
          res.json({
            success: true,
            message: "Product created successfully.",
            data: newProduct,
          });
        } catch (error) {
          console.error("Error creating product:", error);
          res.status(500).json({ success: false, message: error.message });
        }
      });
    } else {
      // Handle JSON data (no images)
      try {
        const newProduct = await createProductHelper(req.body, []);
        res.json({
          success: true,
          message: "Product created successfully.",
          data: newProduct,
        });
      } catch (error) {
        console.error("Error creating product:", error);
        res.status(500).json({ success: false, message: error.message });
      }
    }
  })
);

// Update a product with new images
router.put(
  "/:id",
  asyncHandler(async (req, res) => {
    const contentType = req.get("Content-Type");
    const productID = req.params.id;

    if (contentType && contentType.includes("multipart/form-data")) {
      // Handle multipart form data with images
      productUpload.fields([
        { name: "image1", maxCount: 1 },
        { name: "image2", maxCount: 1 },
        { name: "image3", maxCount: 1 },
        { name: "image4", maxCount: 1 },
        { name: "image5", maxCount: 1 },
      ])(req, res, async function (err) {
        if (err instanceof multer.MulterError) {
          if (err.code === "LIMIT_FILE_SIZE") {
            err.message =
              "File size is too large. Maximum filesize is 5MB per image.";
          }
          return res.json({ success: false, message: err.message });
        } else if (err) {
          return res.json({ success: false, message: err.message });
        }

        try {
          const productToUpdate = await Product.findById(productID);
          if (!productToUpdate) {
            return res
              .status(404)
              .json({ success: false, message: "Product not found." });
          }

          // Update product fields from body
          Object.assign(productToUpdate, req.body);

          // Delete old images and process new ones
          const newImageUrls = [];
          const fields = ["image1", "image2", "image3", "image4", "image5"];

          for (const field of fields) {
            if (req.files && req.files[field] && req.files[field].length > 0) {
              // New image uploaded for this slot
              const file = req.files[field][0];
              const imageUrl = file.path; // Cloudinary URL
              const existingImage = productToUpdate.images.find(
                (img) => img.image === fields.indexOf(field) + 1
              );

              if (
                existingImage &&
                existingImage.url &&
                existingImage.url !== "no_url"
              ) {
                const publicId = existingImage.url
                  .split("/")
                  .pop()
                  .split(".")[0];
                await cloudinary.uploader.destroy(
                  `online_store/products/${publicId}`
                );
              }
              newImageUrls.push({
                image: fields.indexOf(field) + 1,
                url: imageUrl,
              });
            }
          }

          // Replace old images with new ones and existing ones
          productToUpdate.images = productToUpdate.images.filter(
            (img) => !newImageUrls.some((newImg) => newImg.image === img.image)
          );
          productToUpdate.images.push(...newImageUrls);

          await productToUpdate.save();
          res.json({
            success: true,
            message: "Product updated successfully.",
            data: productToUpdate,
          });
        } catch (error) {
          console.error("Error updating product:", error);
          res.status(500).json({ success: false, message: error.message });
        }
      });
    } else {
      // Handle JSON data
      try {
        const productToUpdate = await Product.findById(productID);
        if (!productToUpdate) {
          return res
            .status(404)
            .json({ success: false, message: "Product not found." });
        }
        Object.assign(productToUpdate, req.body);
        await productToUpdate.save();
        res.json({
          success: true,
          message: "Product updated successfully.",
          data: productToUpdate,
        });
      } catch (error) {
        console.error("Error updating product:", error);
        res.status(500).json({ success: false, message: error.message });
      }
    }
  })
);

// Delete a product
router.delete(
  "/:id",
  asyncHandler(async (req, res) => {
    const productID = req.params.id;
    try {
      const product = await Product.findById(productID);
      if (!product) {
        return res
          .status(404)
          .json({ success: false, message: "Product not found." });
      }

      // Delete images from Cloudinary
      if (product.images && product.images.length > 0) {
        for (const image of product.images) {
          if (image.url && image.url !== "no_url") {
            try {
              const publicId = image.url.split("/").pop().split(".")[0];
              await cloudinary.uploader.destroy(
                `online_store/products/${publicId}`
              );
            } catch (cloudinaryError) {
              console.log(
                "Error deleting image from Cloudinary:",
                cloudinaryError
              );
            }
          }
        }
      }

      await Product.findByIdAndDelete(productID);
      res.json({ success: true, message: "Product deleted successfully." });
    } catch (error) {
      res.status(500).json({ success: false, message: error.message });
    }
  })
);

module.exports = router;
