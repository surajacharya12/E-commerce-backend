const express = require("express");
const asyncHandler = require("express-async-handler");
const router = express.Router();
const Coupon = require("../model/couponCode");
const Product = require("../model/product");

// Get all coupons
router.get(
  "/",
  asyncHandler(async (req, res) => {
    try {
      const { status } = req.query;
      let query = {};

      if (status) {
        query.status = status;
      }

      const coupons = await Coupon.find(query)
        .populate("applicableCategory", "id name")
        .populate("applicableSubCategory", "id name")
        .populate("applicableProduct", "id name")
        .sort({ createdAt: -1 });
      res.json({
        success: true,
        message: "Coupons retrieved successfully.",
        data: coupons,
      });
    } catch (error) {
      res.status(500).json({ success: false, message: error.message });
    }
  })
);

// Get a coupon by ID
router.get(
  "/:id",
  asyncHandler(async (req, res) => {
    try {
      const couponID = req.params.id;
      const coupon = await Coupon.findById(couponID)
        .populate("applicableCategory", "id name")
        .populate("applicableSubCategory", "id name")
        .populate("applicableProduct", "id name");
      if (!coupon) {
        return res
          .status(404)
          .json({ success: false, message: "Coupon not found." });
      }
      res.json({
        success: true,
        message: "Coupon retrieved successfully.",
        data: coupon,
      });
    } catch (error) {
      res.status(500).json({ success: false, message: error.message });
    }
  })
);

// Create a new coupon
router.post(
  "/",
  asyncHandler(async (req, res) => {
    const {
      couponCode,
      discountType,
      discountAmount,
      minimumPurchaseAmount,
      endDate,
      status,
      applicableCategory,
      applicableSubCategory,
      applicableProduct,
    } = req.body;

    if (!couponCode || !discountType || !discountAmount || !endDate) {
      return res.status(400).json({
        success: false,
        message:
          "Coupon code, discount type, discount amount, and end date are required.",
      });
    }

    // Validate discount type
    if (!["fixed", "percentage"].includes(discountType)) {
      return res.status(400).json({
        success: false,
        message: "Discount type must be either 'fixed' or 'percentage'.",
      });
    }

    // Validate discount amount
    if (discountAmount <= 0) {
      return res.status(400).json({
        success: false,
        message: "Discount amount must be greater than 0.",
      });
    }

    // Validate percentage discount
    if (discountType === "percentage" && discountAmount > 100) {
      return res.status(400).json({
        success: false,
        message: "Percentage discount cannot be more than 100%.",
      });
    }

    // Validate end date
    const endDateTime = new Date(endDate);
    if (endDateTime <= new Date()) {
      return res.status(400).json({
        success: false,
        message: "End date must be in the future.",
      });
    }

    try {
      const coupon = new Coupon({
        couponCode: couponCode.toUpperCase(), // Store in uppercase for consistency
        discountType,
        discountAmount,
        minimumPurchaseAmount: minimumPurchaseAmount || 0,
        endDate: endDateTime,
        status: status || "active",
        applicableCategory: applicableCategory || null,
        applicableSubCategory: applicableSubCategory || null,
        applicableProduct: applicableProduct || null,
      });

      const newCoupon = await coupon.save();
      res.json({
        success: true,
        message: "Coupon created successfully.",
        data: newCoupon,
      });
    } catch (error) {
      if (error.code === 11000) {
        return res.status(400).json({
          success: false,
          message: "Coupon code already exists. Please use a different code.",
        });
      }
      res.status(500).json({ success: false, message: error.message });
    }
  })
);

// Update a coupon
router.put(
  "/:id",
  asyncHandler(async (req, res) => {
    try {
      const couponID = req.params.id;
      const {
        couponCode,
        discountType,
        discountAmount,
        minimumPurchaseAmount,
        endDate,
        status,
        applicableCategory,
        applicableSubCategory,
        applicableProduct,
      } = req.body;

      const coupon = await Coupon.findById(couponID);
      if (!coupon) {
        return res
          .status(404)
          .json({ success: false, message: "Coupon not found." });
      }

      // Update fields if provided
      if (couponCode) {
        // Validate discount type
        if (!["fixed", "percentage"].includes(discountType)) {
          return res.status(400).json({
            success: false,
            message: "Discount type must be either 'fixed' or 'percentage'.",
          });
        }
        coupon.couponCode = couponCode.toUpperCase();
      }
      if (discountType) coupon.discountType = discountType;
      if (discountAmount !== undefined) {
        if (discountAmount <= 0) {
          return res.status(400).json({
            success: false,
            message: "Discount amount must be greater than 0.",
          });
        }
        if (discountType === "percentage" && discountAmount > 100) {
          return res.status(400).json({
            success: false,
            message: "Percentage discount cannot be more than 100%.",
          });
        }
        coupon.discountAmount = discountAmount;
      }
      if (minimumPurchaseAmount !== undefined)
        coupon.minimumPurchaseAmount = minimumPurchaseAmount;
      if (endDate) {
        const endDateTime = new Date(endDate);
        if (endDateTime <= new Date()) {
          return res.status(400).json({
            success: false,
            message: "End date must be in the future.",
          });
        }
        coupon.endDate = endDateTime;
      }
      if (status) coupon.status = status;
      if (applicableCategory !== undefined)
        coupon.applicableCategory = applicableCategory;
      if (applicableSubCategory !== undefined)
        coupon.applicableSubCategory = applicableSubCategory;
      if (applicableProduct !== undefined)
        coupon.applicableProduct = applicableProduct;

      await coupon.save();
      res.json({
        success: true,
        message: "Coupon updated successfully.",
        data: coupon,
      });
    } catch (error) {
      if (error.code === 11000) {
        return res.status(400).json({
          success: false,
          message: "Coupon code already exists. Please use a different code.",
        });
      }
      res.status(500).json({ success: false, message: error.message });
    }
  })
);

// Delete a coupon
router.delete(
  "/:id",
  asyncHandler(async (req, res) => {
    try {
      const couponID = req.params.id;
      const deletedCoupon = await Coupon.findByIdAndDelete(couponID);
      if (!deletedCoupon) {
        return res
          .status(404)
          .json({ success: false, message: "Coupon not found." });
      }
      res.json({ success: true, message: "Coupon deleted successfully." });
    } catch (error) {
      res.status(500).json({ success: false, message: error.message });
    }
  })
);

// Toggle coupon status
router.patch(
  "/:id/toggle-status",
  asyncHandler(async (req, res) => {
    try {
      const couponID = req.params.id;
      const coupon = await Coupon.findById(couponID);

      if (!coupon) {
        return res
          .status(404)
          .json({ success: false, message: "Coupon not found." });
      }

      coupon.status = coupon.status === "active" ? "inactive" : "active";
      await coupon.save();

      res.json({
        success: true,
        message: `Coupon ${
          coupon.status === "active" ? "activated" : "deactivated"
        } successfully.`,
        data: coupon,
      });
    } catch (error) {
      res.status(500).json({ success: false, message: error.message });
    }
  })
);

// Check coupon validity
router.post(
  "/check-coupon",
  asyncHandler(async (req, res) => {
    const { couponCode, productIds, purchaseAmount } = req.body;

    if (!couponCode) {
      return res
        .status(400)
        .json({ success: false, message: "Coupon code is required." });
    }

    try {
      // Find the coupon with the provided coupon code (case insensitive)
      const coupon = await Coupon.findOne({
        couponCode: couponCode.toUpperCase(),
      }).populate("applicableCategory applicableSubCategory applicableProduct");

      // If coupon is not found, return false
      if (!coupon) {
        return res.json({ success: false, message: "Invalid coupon code." });
      }

      // Check if the coupon is expired
      const currentDate = new Date();
      if (coupon.endDate < currentDate) {
        return res.json({ success: false, message: "Coupon has expired." });
      }

      // Check if the coupon is active
      if (coupon.status !== "active") {
        return res.json({
          success: false,
          message: "Coupon is currently inactive.",
        });
      }

      // Check if the purchase amount meets minimum requirement
      if (
        coupon.minimumPurchaseAmount &&
        purchaseAmount < coupon.minimumPurchaseAmount
      ) {
        return res.json({
          success: false,
          message: `Minimum purchase amount of Rs. ${coupon.minimumPurchaseAmount} required.`,
        });
      }

      // Check if the coupon is applicable for all orders (no specific restrictions)
      if (
        !coupon.applicableCategory &&
        !coupon.applicableSubCategory &&
        !coupon.applicableProduct
      ) {
        return res.json({
          success: true,
          message: "Coupon is valid and applicable for all products.",
          data: coupon,
        });
      }

      // If product IDs are provided, check product-specific applicability
      if (productIds && productIds.length > 0) {
        const products = await Product.find({ _id: { $in: productIds } });

        const isValid = products.every((product) => {
          // Check category restriction
          if (
            coupon.applicableCategory &&
            coupon.applicableCategory.toString() !==
              product.proCategoryId.toString()
          ) {
            return false;
          }

          // Check subcategory restriction
          if (
            coupon.applicableSubCategory &&
            coupon.applicableSubCategory.toString() !==
              product.proSubCategoryId.toString()
          ) {
            return false;
          }

          // Check specific product restriction
          if (
            coupon.applicableProduct &&
            coupon.applicableProduct.toString() !== product._id.toString()
          ) {
            return false;
          }

          return true;
        });

        if (isValid) {
          return res.json({
            success: true,
            message:
              "Coupon is valid and applicable for the selected products.",
            data: coupon,
          });
        } else {
          return res.json({
            success: false,
            message: "Coupon is not applicable for the selected products.",
          });
        }
      }

      // If no products specified but coupon has restrictions, return general validity
      return res.json({
        success: true,
        message: "Coupon is valid.",
        data: coupon,
      });
    } catch (error) {
      console.error("Error checking coupon code:", error);
      return res
        .status(500)
        .json({ success: false, message: "Internal server error." });
    }
  })
);

// Apply coupon and calculate discount
router.post(
  "/apply-coupon",
  asyncHandler(async (req, res) => {
    const { couponCode, purchaseAmount, productIds } = req.body;

    if (!couponCode || !purchaseAmount) {
      return res.status(400).json({
        success: false,
        message: "Coupon code and purchase amount are required.",
      });
    }

    try {
      // First check if coupon is valid
      const checkResult = await Coupon.findOne({
        couponCode: couponCode.toUpperCase(),
        status: "active",
        endDate: { $gt: new Date() },
      });

      if (!checkResult) {
        return res.json({
          success: false,
          message: "Invalid or expired coupon.",
        });
      }

      // Check minimum purchase amount
      if (
        checkResult.minimumPurchaseAmount &&
        purchaseAmount < checkResult.minimumPurchaseAmount
      ) {
        return res.json({
          success: false,
          message: `Minimum purchase amount of Rs. ${checkResult.minimumPurchaseAmount} required.`,
        });
      }

      // Calculate discount
      let discountAmount = 0;
      if (checkResult.discountType === "fixed") {
        discountAmount = checkResult.discountAmount;
      } else if (checkResult.discountType === "percentage") {
        discountAmount = (purchaseAmount * checkResult.discountAmount) / 100;
      }

      // Ensure discount doesn't exceed purchase amount
      discountAmount = Math.min(discountAmount, purchaseAmount);

      const finalAmount = purchaseAmount - discountAmount;

      res.json({
        success: true,
        message: "Coupon applied successfully.",
        data: {
          originalAmount: purchaseAmount,
          discountAmount: discountAmount,
          finalAmount: finalAmount,
          couponDetails: checkResult,
        },
      });
    } catch (error) {
      console.error("Error applying coupon:", error);
      return res
        .status(500)
        .json({ success: false, message: "Internal server error." });
    }
  })
);

// Get active coupons
router.get(
  "/active/list",
  asyncHandler(async (req, res) => {
    try {
      const activeCoupons = await Coupon.find({
        status: "active",
        endDate: { $gt: new Date() },
      })
        .populate("applicableCategory applicableSubCategory applicableProduct")
        .sort({ createdAt: -1 });

      res.json({
        success: true,
        message: "Active coupons retrieved successfully.",
        data: activeCoupons,
      });
    } catch (error) {
      res.status(500).json({ success: false, message: error.message });
    }
  })
);

module.exports = router;
