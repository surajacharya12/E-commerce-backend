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
    stock,
    price,
    offerPrice,
    points,
    proCategoryId,
    proSubCategoryId,
    proBrandId,
    proVariantTypeId,
    proVariantId,
    adminRating,
  } = productData;

  if (!name || !quantity || !price || !proCategoryId || !proSubCategoryId) {
    throw new Error(
      "Required fields are missing: name, quantity, price, proCategoryId, proSubCategoryId"
    );
  }

  // Use stock if provided, otherwise use quantity as stock
  const stockValue = stock ? parseInt(stock) : parseInt(quantity);

  const newProduct = new Product({
    name,
    description,
    quantity: parseInt(quantity),
    stock: stockValue,
    price: parseFloat(price),
    offerPrice: offerPrice ? parseFloat(offerPrice) : undefined,
    // Accept points as array or JSON string
    points:
      typeof points === "string"
        ? (() => {
            try {
              return JSON.parse(points);
            } catch (e) {
              return points
                .split("\n")
                .map((p) => p.trim())
                .filter(Boolean);
            }
          })()
        : Array.isArray(points)
        ? points
        : [],
    proCategoryId,
    proSubCategoryId,
    proBrandId: proBrandId || undefined,
    proVariantTypeId: proVariantTypeId || undefined,
    proVariantId: proVariantId || [],
    images: imageUrls,
    rating: {
      adminRating: adminRating ? parseFloat(adminRating) : 0,
      averageRating: adminRating ? parseFloat(adminRating) : 0,
    },
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

// Update a product
router.put(
  "/:id",
  asyncHandler(async (req, res) => {
    const productId = req.params.id;
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
        if (err) {
          return res.status(500).json({ success: false, message: err.message });
        }

        try {
          const productToUpdate = await Product.findById(productId);
          if (!productToUpdate) {
            return res
              .status(404)
              .json({ success: false, message: "Product not found." });
          }

          const {
            name,
            description,
            quantity,
            stock,
            price,
            offerPrice,
            proCategoryId,
            proSubCategoryId,
            proBrandId,
            proVariantTypeId,
            proVariantId,
            adminRating,
            points,
          } = req.body;

          // Update product properties
          if (name) productToUpdate.name = name;
          if (description !== undefined)
            productToUpdate.description = description;
          if (quantity) {
            productToUpdate.quantity = parseInt(quantity);
            // If stock is provided, use it; otherwise use quantity as stock
            productToUpdate.stock =
              stock !== undefined ? parseInt(stock) : parseInt(quantity);
          }
          if (stock !== undefined && !quantity) {
            productToUpdate.stock = parseInt(stock);
          }
          if (price) productToUpdate.price = parseFloat(price);
          if (offerPrice !== undefined)
            productToUpdate.offerPrice = offerPrice
              ? parseFloat(offerPrice)
              : undefined;
          if (proCategoryId) productToUpdate.proCategoryId = proCategoryId;
          if (proSubCategoryId)
            productToUpdate.proSubCategoryId = proSubCategoryId;
          if (proBrandId) productToUpdate.proBrandId = proBrandId;
          if (proVariantTypeId)
            productToUpdate.proVariantTypeId = proVariantTypeId;
          if (proVariantId) productToUpdate.proVariantId = proVariantId;
          // Update points (accept JSON string or newline-separated string)
          if (points !== undefined) {
            if (typeof points === "string") {
              try {
                productToUpdate.points = JSON.parse(points);
              } catch (e) {
                productToUpdate.points = points
                  .split("\n")
                  .map((p) => p.trim())
                  .filter(Boolean);
              }
            } else if (Array.isArray(points)) {
              productToUpdate.points = points;
            }
          }

          // Update admin rating and recalculate average
          if (adminRating !== undefined) {
            productToUpdate.rating.adminRating = parseFloat(adminRating);
            // Recalculate average rating
            const userRating = productToUpdate.rating.userRating || 0;
            const totalReviews = productToUpdate.rating.totalReviews || 0;

            if (totalReviews > 0) {
              productToUpdate.rating.averageRating =
                (userRating + parseFloat(adminRating)) / 2;
            } else {
              productToUpdate.rating.averageRating = parseFloat(adminRating);
            }
          }

          // Update images
          const fields = ["image1", "image2", "image3", "image4", "image5"];
          fields.forEach((field, index) => {
            if (req.files && req.files[field] && req.files[field].length > 0) {
              const file = req.files[field][0];
              const imageUrl = file.path; // Cloudinary URL

              let imageEntry = productToUpdate.images.find(
                (img) => img.image === index + 1
              );
              if (imageEntry) {
                imageEntry.url = imageUrl;
              } else {
                productToUpdate.images.push({
                  image: index + 1,
                  url: imageUrl,
                });
              }
            }
          });

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
        const productToUpdate = await Product.findById(productId);
        if (!productToUpdate) {
          return res
            .status(404)
            .json({ success: false, message: "Product not found." });
        }

        const {
          name,
          description,
          quantity,
          stock,
          price,
          offerPrice,
          proCategoryId,
          proSubCategoryId,
          proBrandId,
          proVariantTypeId,
          proVariantId,
          adminRating,
          points,
        } = req.body;

        // Update product properties
        if (name) productToUpdate.name = name;
        if (description !== undefined)
          productToUpdate.description = description;
        if (quantity) {
          productToUpdate.quantity = parseInt(quantity);
          // If stock is provided, use it; otherwise use quantity as stock
          productToUpdate.stock =
            stock !== undefined ? parseInt(stock) : parseInt(quantity);
        }
        if (stock !== undefined && !quantity) {
          productToUpdate.stock = parseInt(stock);
        }
        if (price) productToUpdate.price = parseFloat(price);
        if (offerPrice !== undefined)
          productToUpdate.offerPrice = offerPrice
            ? parseFloat(offerPrice)
            : undefined;
        if (proCategoryId) productToUpdate.proCategoryId = proCategoryId;
        if (proSubCategoryId)
          productToUpdate.proSubCategoryId = proSubCategoryId;
        if (proBrandId) productToUpdate.proBrandId = proBrandId;
        if (proVariantTypeId)
          productToUpdate.proVariantTypeId = proVariantTypeId;
        if (proVariantId) productToUpdate.proVariantId = proVariantId;

        // Update points (accept JSON string or newline-separated string)
        if (points !== undefined) {
          if (typeof points === "string") {
            try {
              productToUpdate.points = JSON.parse(points);
            } catch (e) {
              productToUpdate.points = points
                .split("\n")
                .map((p) => p.trim())
                .filter(Boolean);
            }
          } else if (Array.isArray(points)) {
            productToUpdate.points = points;
          }
        }

        // Update admin rating and recalculate average
        if (adminRating !== undefined) {
          productToUpdate.rating.adminRating = parseFloat(adminRating);
          // Recalculate average rating
          const userRating = productToUpdate.rating.userRating || 0;
          const totalReviews = productToUpdate.rating.totalReviews || 0;

          if (totalReviews > 0) {
            productToUpdate.rating.averageRating =
              (userRating + parseFloat(adminRating)) / 2;
          } else {
            productToUpdate.rating.averageRating = parseFloat(adminRating);
          }
        }

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
