const express = require("express");
const router = express.Router();
const Rating = require("../model/rating");
const Product = require("../model/product");
const asyncHandler = require("express-async-handler");

// Helper function to calculate average rating
async function updateProductRating(productId) {
  const ratings = await Rating.find({ productId });
  const product = await Product.findById(productId);

  if (!product) return;

  const totalUserRatings = ratings.length;
  const userRatingSum = ratings.reduce((sum, rating) => sum + rating.rating, 0);
  const userRatingAvg =
    totalUserRatings > 0 ? userRatingSum / totalUserRatings : 0;

  const adminRating = product.rating.adminRating || 0;

  // Calculate combined average (user ratings + admin rating)
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

// Get all ratings for a product
router.get(
  "/product/:productId",
  asyncHandler(async (req, res) => {
    try {
      const { productId } = req.params;
      const ratings = await Rating.find({ productId }).sort({ createdAt: -1 });

      res.json({
        success: true,
        message: "Ratings retrieved successfully.",
        data: ratings,
      });
    } catch (error) {
      res.status(500).json({ success: false, message: error.message });
    }
  })
);

// Add or update a rating
router.post(
  "/",
  asyncHandler(async (req, res) => {
    try {
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

      // Check if user already rated this product
      let existingRating = await Rating.findOne({ productId, userId });

      if (existingRating) {
        // Update existing rating
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
        // Create new rating
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
    } catch (error) {
      res.status(500).json({ success: false, message: error.message });
    }
  })
);

// Delete a rating
router.delete(
  "/:id",
  asyncHandler(async (req, res) => {
    try {
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
    } catch (error) {
      res.status(500).json({ success: false, message: error.message });
    }
  })
);

module.exports = router;
