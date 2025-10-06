const express = require("express");
const asyncHandler = require("express-async-handler");
const router = express.Router();
const Cart = require("../model/cart");
const Product = require("../model/product");

/**
 * Get user's cart
 */
router.get(
  "/:userId",
  asyncHandler(async (req, res) => {
    const { userId } = req.params;

    const cart = await Cart.findOne({ userId }).populate({
      path: "items.productId",
      select: "name price offerPrice images stock proCategoryId",
      populate: {
        path: "proCategoryId",
        select: "name",
      },
    });

    if (!cart) {
      return res.json({
        success: true,
        message: "Cart is empty",
        data: {
          userId,
          items: [],
          totalAmount: 0,
          totalItems: 0,
        },
      });
    }

    res.json({
      success: true,
      message: "Cart retrieved successfully",
      data: cart,
    });
  })
);

/**
 * Add item to cart
 */
router.post(
  "/add",
  asyncHandler(async (req, res) => {
    const { userId, productId, quantity = 1 } = req.body;

    if (!userId || !productId) {
      return res.status(400).json({
        success: false,
        message: "User ID and Product ID are required",
      });
    }

    // Check if product exists and has stock
    const product = await Product.findById(productId);
    if (!product) {
      return res.status(404).json({
        success: false,
        message: "Product not found",
      });
    }

    if (product.stock < quantity) {
      return res.status(400).json({
        success: false,
        message: "Insufficient stock available",
      });
    }

    // Get current price (offer price if available, otherwise regular price)
    const currentPrice = product.offerPrice || product.price;

    let cart = await Cart.findOne({ userId });

    if (!cart) {
      // Create new cart
      cart = new Cart({
        userId,
        items: [
          {
            productId,
            quantity,
            price: currentPrice,
          },
        ],
      });
    } else {
      // Check if item already exists in cart
      const existingItemIndex = cart.items.findIndex(
        (item) => item.productId.toString() === productId
      );

      if (existingItemIndex > -1) {
        // Update quantity of existing item
        const newQuantity = cart.items[existingItemIndex].quantity + quantity;

        if (product.stock < newQuantity) {
          return res.status(400).json({
            success: false,
            message: "Cannot add more items. Insufficient stock available",
          });
        }

        cart.items[existingItemIndex].quantity = newQuantity;
        cart.items[existingItemIndex].price = currentPrice; // Update price in case it changed
      } else {
        // Add new item to cart
        cart.items.push({
          productId,
          quantity,
          price: currentPrice,
        });
      }
    }

    await cart.save();

    // Populate the cart before sending response
    await cart.populate({
      path: "items.productId",
      select: "name price offerPrice images stock proCategoryId",
      populate: {
        path: "proCategoryId",
        select: "name",
      },
    });

    res.json({
      success: true,
      message: "Item added to cart successfully",
      data: cart,
    });
  })
);

/**
 * Update item quantity in cart
 */
router.put(
  "/update",
  asyncHandler(async (req, res) => {
    const { userId, productId, quantity } = req.body;

    if (!userId || !productId || quantity < 1) {
      return res.status(400).json({
        success: false,
        message: "Valid User ID, Product ID, and quantity are required",
      });
    }

    const cart = await Cart.findOne({ userId });
    if (!cart) {
      return res.status(404).json({
        success: false,
        message: "Cart not found",
      });
    }

    const itemIndex = cart.items.findIndex(
      (item) => item.productId.toString() === productId
    );

    if (itemIndex === -1) {
      return res.status(404).json({
        success: false,
        message: "Item not found in cart",
      });
    }

    // Check stock availability
    const product = await Product.findById(productId);
    if (product.stock < quantity) {
      return res.status(400).json({
        success: false,
        message: "Insufficient stock available",
      });
    }

    cart.items[itemIndex].quantity = quantity;
    await cart.save();

    // Populate the cart before sending response
    await cart.populate({
      path: "items.productId",
      select: "name price offerPrice images stock proCategoryId",
      populate: {
        path: "proCategoryId",
        select: "name",
      },
    });

    res.json({
      success: true,
      message: "Cart updated successfully",
      data: cart,
    });
  })
);

/**
 * Remove item from cart
 */
router.delete(
  "/remove",
  asyncHandler(async (req, res) => {
    const { userId, productId } = req.body;

    if (!userId || !productId) {
      return res.status(400).json({
        success: false,
        message: "User ID and Product ID are required",
      });
    }

    const cart = await Cart.findOne({ userId });
    if (!cart) {
      return res.status(404).json({
        success: false,
        message: "Cart not found",
      });
    }

    cart.items = cart.items.filter(
      (item) => item.productId.toString() !== productId
    );

    await cart.save();

    // Populate the cart before sending response
    await cart.populate({
      path: "items.productId",
      select: "name price offerPrice images stock proCategoryId",
      populate: {
        path: "proCategoryId",
        select: "name",
      },
    });

    res.json({
      success: true,
      message: "Item removed from cart successfully",
      data: cart,
    });
  })
);

/**
 * Clear entire cart
 */
router.delete(
  "/clear/:userId",
  asyncHandler(async (req, res) => {
    const { userId } = req.params;

    const cart = await Cart.findOne({ userId });
    if (!cart) {
      return res.status(404).json({
        success: false,
        message: "Cart not found",
      });
    }

    cart.items = [];
    await cart.save();

    res.json({
      success: true,
      message: "Cart cleared successfully",
      data: cart,
    });
  })
);

/**
 * Get cart item count for a user
 */
router.get(
  "/count/:userId",
  asyncHandler(async (req, res) => {
    const { userId } = req.params;

    const cart = await Cart.findOne({ userId });
    const totalItems = cart ? cart.totalItems : 0;

    res.json({
      success: true,
      message: "Cart count retrieved successfully",
      data: { totalItems },
    });
  })
);

module.exports = router;
