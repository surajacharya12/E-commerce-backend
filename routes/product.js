const express = require("express");
const router = express.Router();
const Product = require("../model/product"); // Updated path
const multer = require("multer");
const { productUpload, cloudinary } = require("../config/cloudinary"); // No change
const asyncHandler = require("express-async-handler");
const Color = require("../model/color"); // New import
const Size = require("../model/size"); // New import

// Get all products with optional category filtering
router.get(
  "/",
  asyncHandler(async (req, res) => {
    try {
      const { proCategoryId, categoryId } = req.query;

      // Build filter object
      let filter = {};

      // Support both proCategoryId and categoryId query parameters
      const categoryFilter = proCategoryId || categoryId;
      if (categoryFilter) {
        filter.proCategoryId = categoryFilter;
      }

      const products = await Product.find(filter)
        .populate("proCategoryId", "id name")
        .populate("proSubCategoryId", "id name")
        .populate("proBrandId", "id name")
        .populate("colors", "id name hexCode") // Populate colors
        .populate("sizes", "id name description"); // Populate sizes

      const message = categoryFilter
        ? `Products retrieved successfully for category ${categoryFilter}.`
        : "Products retrieved successfully.";

      res.json({
        success: true,
        message: message,
        data: products,
        totalCount: products.length,
        filter: filter,
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
        .populate("colors", "id name hexCode") // Populate colors
        .populate("sizes", "id name description"); // Populate sizes
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
    colors, // New field
    sizes, // New field
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
    colors: colors || [], // Assign colors
    sizes: sizes || [], // Assign sizes
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

          // Parse colors and sizes if they are JSON strings
          let colorsArray = [];
          if (req.body.colors) {
            try {
              colorsArray = JSON.parse(req.body.colors);
            } catch (e) {
              console.warn(
                "Could not parse colors JSON, assuming array or single ID:",
                req.body.colors
              );
              colorsArray = Array.isArray(req.body.colors)
                ? req.body.colors
                : [req.body.colors];
            }
          }

          let sizesArray = [];
          if (req.body.sizes) {
            try {
              sizesArray = JSON.parse(req.body.sizes);
            } catch (e) {
              console.warn(
                "Could not parse sizes JSON, assuming array or single ID:",
                req.body.sizes
              );
              sizesArray = Array.isArray(req.body.sizes)
                ? req.body.sizes
                : [req.body.sizes];
            }
          }

          const productDataWithVariants = {
            ...req.body,
            colors: colorsArray,
            sizes: sizesArray,
          };

          const newProduct = await createProductHelper(
            productDataWithVariants,
            imageUrls
          );
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
            colors, // New field
            sizes, // New field
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

          // Update colors and sizes
          if (colors !== undefined) {
            try {
              productToUpdate.colors = JSON.parse(colors);
            } catch (e) {
              productToUpdate.colors = Array.isArray(colors)
                ? colors
                : [colors];
            }
          }
          if (sizes !== undefined) {
            try {
              productToUpdate.sizes = JSON.parse(sizes);
            } catch (e) {
              productToUpdate.sizes = Array.isArray(sizes) ? sizes : [sizes];
            }
          }

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
          colors, // New field
          sizes, // New field
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

        // Update colors and sizes
        if (colors !== undefined) productToUpdate.colors = colors;
        if (sizes !== undefined) productToUpdate.sizes = sizes;

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
              // Extract publicId from the Cloudinary URL.
              // Example URL: http://res.cloudinary.com/your_cloud_name/image/upload/v1234567890/online_store/products/some_public_id.jpg
              // We need 'online_store/products/some_public_id'
              const urlParts = image.url.split("/");
              const folderAndPublicId =
                urlParts.slice(urlParts.indexOf("online_store"), -1).join("/") +
                "/" +
                urlParts.pop().split(".")[0];

              await cloudinary.uploader.destroy(folderAndPublicId);
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

// Buy Now - Direct checkout for a single product
router.post(
  "/buy-now",
  asyncHandler(async (req, res) => {
    try {
      const {
        productId,
        quantity = 1,
        selectedColor,
        selectedSize,
        userID,
        shippingAddress,
        paymentMethod,
        deliveryMethod,
        selectedStore,
        couponCode,
      } = req.body;

      // Validate required fields
      if (
        !productId ||
        !userID ||
        !shippingAddress ||
        !paymentMethod ||
        !deliveryMethod
      ) {
        return res.status(400).json({
          success: false,
          message:
            "Product ID, User ID, shipping address, payment method, and delivery method are required.",
        });
      }

      // Get product details
      const product = await Product.findById(productId)
        .populate("proCategoryId", "id name")
        .populate("proSubCategoryId", "id name")
        .populate("proBrandId", "id name")
        .populate("colors", "id name hexCode")
        .populate("sizes", "id name description");

      if (!product) {
        return res.status(404).json({
          success: false,
          message: "Product not found.",
        });
      }

      // Check stock availability
      if (product.stock < quantity) {
        return res.status(400).json({
          success: false,
          message: `Insufficient stock. Only ${product.stock} items available.`,
        });
      }

      // Calculate price (use offer price if available)
      const unitPrice = product.offerPrice || product.price;
      const subtotal = unitPrice * quantity;

      // Calculate delivery fee
      let deliveryFee = 0;
      if (deliveryMethod === "homeDelivery") {
        deliveryFee = 150;
      } else if (deliveryMethod === "storeDelivery") {
        deliveryFee = 100;
      }

      // Calculate discount (if coupon applied)
      let discount = 0;
      let appliedCoupon = null;
      if (couponCode) {
        // You can add coupon validation logic here
        // For now, we'll just pass it through
        appliedCoupon = couponCode;
      }

      // Calculate final total
      const finalTotal = subtotal + deliveryFee - discount;

      // Create order item
      const orderItem = {
        productID: productId,
        productName: product.name,
        quantity: parseInt(quantity),
        price: unitPrice,
        selectedColor: selectedColor || null,
        selectedSize: selectedSize || null,
      };

      // Create order total breakdown
      const orderTotal = {
        subtotal: subtotal,
        deliveryFee: deliveryFee,
        tax: 0,
        discount: discount,
        total: finalTotal,
      };

      // Return checkout data for frontend processing
      res.json({
        success: true,
        message: "Buy now checkout data prepared successfully.",
        data: {
          product: {
            id: product._id,
            name: product.name,
            image: product.images?.[0]?.url || null,
            price: unitPrice,
            originalPrice: product.price,
            offerPrice: product.offerPrice,
          },
          orderItem,
          orderTotal,
          checkoutData: {
            userID,
            items: [orderItem],
            totalPrice: finalTotal,
            shippingAddress,
            paymentMethod,
            deliveryMethod,
            selectedStore:
              deliveryMethod === "storeDelivery" ? selectedStore : null,
            couponCode: appliedCoupon,
            orderTotal,
          },
        },
      });
    } catch (error) {
      console.error("Error preparing buy now checkout:", error);
      res.status(500).json({ success: false, message: error.message });
    }
  })
);

// Test endpoint to check category filtering
router.get(
  "/test-category/:categoryId",
  asyncHandler(async (req, res) => {
    try {
      const { categoryId } = req.params;

      // Get all products for debugging
      const allProducts = await Product.find()
        .populate("proCategoryId", "id name")
        .select("name proCategoryId");

      // Get filtered products
      const filteredProducts = await Product.find({ proCategoryId: categoryId })
        .populate("proCategoryId", "id name")
        .select("name proCategoryId");

      res.json({
        success: true,
        message: `Test category filtering for ${categoryId}`,
        data: {
          categoryId: categoryId,
          totalProducts: allProducts.length,
          filteredProducts: filteredProducts.length,
          allProductsPreview: allProducts.slice(0, 3).map((p) => ({
            name: p.name,
            categoryId: p.proCategoryId?._id,
            categoryName: p.proCategoryId?.name,
          })),
          filteredProductsPreview: filteredProducts.slice(0, 3).map((p) => ({
            name: p.name,
            categoryId: p.proCategoryId?._id,
            categoryName: p.proCategoryId?.name,
          })),
        },
      });
    } catch (error) {
      res.status(500).json({ success: false, message: error.message });
    }
  })
);

module.exports = router;
