const express = require("express");
const router = express.Router();
const Rating = require("../model/rating");
const Product = require("../model/product");
const asyncHandler = require("express-async-handler");

// Helper: update average ratings for product
async function updateProductRating(productId) {
  const ratings = await Rating.find({ productId });
  const product = await Product.findById(productId);
  if (!product) return;

  const totalUserRatings = ratings.length;
  const userRatingSum = ratings.reduce((sum, rating) => sum + rating.rating, 0);
  const userRatingAvg =
    totalUserRatings > 0 ? userRatingSum / totalUserRatings : 0;

  const adminRating = product.rating.adminRating || 0;

  let averageRating = 0;
  if (totalUserRatings > 0 && adminRating > 0) {
    averageRating = (userRatingAvg + adminRating) / 2;
  } else if (totalUserRatings > 0) {
    averageRating = userRatingAvg;
  } else if (adminRating > 0) {
    averageRating = adminRating;
  }

  product.rating.userRating = userRatingAvg;
  product.rating.totalReviews = totalUserRatings;
  product.rating.averageRating = averageRating;

  await product.save();
}

// 📌 1️⃣ Get all ratings for a specific product
router.get(
  "/product/:productId",
  asyncHandler(async (req, res) => {
    const { productId } = req.params;
    const ratings = await Rating.find({ productId }).sort({ createdAt: -1 });

    res.json({
      success: true,
      message: "Ratings retrieved successfully.",
      data: ratings,
    });
  })
);

// 📌 2️⃣ Get all ratings by a specific user (with product info)
router.get(
  "/user/:userId",
  asyncHandler(async (req, res) => {
    const { userId } = req.params;

    const ratings = await Rating.find({ userId })
      .populate("productId", "name images price")
      .sort({ createdAt: -1 });

    res.json({
      success: true,
      message: "User reviews retrieved successfully.",
      data: ratings,
    });
  })
);

// 📌 3️⃣ Add or update rating
router.post(
  "/",
  asyncHandler(async (req, res) => {
    const { productId, userId, rating, review } = req.body;

    if (!productId || !userId || !rating) {
      return res.status(400).json({
        success: false,
        message: "Product ID, User ID, and rating are required.",
      });
    }

    if (rating < 1 || rating > 5) {
      return res.status(400).json({
        success: false,
        message: "Rating must be between 1 and 5.",
      });
    }

    let existingRating = await Rating.findOne({ productId, userId });

    if (existingRating) {
      existingRating.rating = rating;
      existingRating.review = review || existingRating.review;
      await existingRating.save();

      await updateProductRating(productId);

      res.json({
        success: true,
        message: "Rating updated successfully.",
        data: existingRating,
      });
    } else {
      const newRating = new Rating({
        productId,
        userId,
        rating,
        review,
      });

      await newRating.save();
      await updateProductRating(productId);

      res.json({
        success: true,
        message: "Rating added successfully.",
        data: newRating,
      });
    }
  })
);

// 📌 4️⃣ Delete rating
router.delete(
  "/:id",
  asyncHandler(async (req, res) => {
    const { id } = req.params;
    const rating = await Rating.findById(id);

    if (!rating) {
      return res.status(404).json({
        success: false,
        message: "Rating not found.",
      });
    }

    const productId = rating.productId;
    await Rating.findByIdAndDelete(id);
    await updateProductRating(productId);

    res.json({
      success: true,
      message: "Rating deleted successfully.",
    });
  })
);

module.exports = router;
