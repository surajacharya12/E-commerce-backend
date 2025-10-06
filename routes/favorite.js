const express = require("express");
const router = express.Router();
const asyncHandler = require("express-async-handler");
const Favorite = require("../model/favorite");

// ✅ Add product to favorites
router.post(
  "/",
  asyncHandler(async (req, res) => {
    const { userId, productId } = req.body;

    if (!userId || !productId) {
      return res
        .status(400)
        .json({ success: false, message: "User ID and Product ID required" });
    }

    const exists = await Favorite.findOne({ userId, productId });
    if (exists) {
      return res.status(400).json({
        success: false,
        message: "Product already in favorites",
      });
    }

    const favorite = await Favorite.create({ userId, productId });
    res.json({ success: true, message: "Added to favorites", data: favorite });
  })
);

// ✅ Remove product from favorites
router.delete(
  "/:userId/:productId",
  asyncHandler(async (req, res) => {
    const { userId, productId } = req.params;

    const removed = await Favorite.findOneAndDelete({ userId, productId });
    if (!removed) {
      return res
        .status(404)
        .json({ success: false, message: "Favorite not found" });
    }

    res.json({ success: true, message: "Removed from favorites" });
  })
);

// ✅ Get all favorites for a user
router.get(
  "/:userId",
  asyncHandler(async (req, res) => {
    const { userId } = req.params;
    const favorites = await Favorite.find({ userId }).populate("productId");
    res.json({ success: true, data: favorites });
  })
);

module.exports = router;
