const express = require("express");
const asyncHandler = require("express-async-handler");
const router = express.Router();
const Order = require("./order"); // Assuming order.js is in the same directory

// Get all orders
router.get(
  "/",
  asyncHandler(async (req, res) => {
    try {
      const { status, userId, startDate, endDate } = req.query;
      let query = {};

      if (status) {
        query.orderStatus = status;
      }

      if (userId) {
        query.userID = userId;
      }

      if (startDate || endDate) {
        query.orderDate = {};
        if (startDate) query.orderDate.$gte = new Date(startDate);
        if (endDate) query.orderDate.$lte = new Date(endDate);
      }

      const orders = await Order.find(query)
        .populate("couponCode", "couponCode discountType discountAmount")
        .populate("userID", "name email")
        .populate("items.productID", "name images")
        .sort({ orderDate: -1 });
      res.json({
        success: true,
        message: "Orders retrieved successfully.",
        data: orders,
      });
    } catch (error) {
      res.status(500).json({ success: false, message: error.message });
    }
  })
);

// Get orders by user ID
router.get(
  "/orderByUserId/:userId",
  asyncHandler(async (req, res) => {
    try {
      const userId = req.params.userId;
      const { status } = req.query;
      let query = { userID: userId };

      if (status) {
        query.orderStatus = status;
      }

      const orders = await Order.find(query)
        .populate("couponCode", "couponCode discountType discountAmount")
        .populate("userID", "name email")
        .populate("items.productID", "name images")
        .sort({ orderDate: -1 });
      res.json({
        success: true,
        message: "Orders retrieved successfully.",
        data: orders,
      });
    } catch (error) {
      res.status(500).json({ success: false, message: error.message });
    }
  })
);

// Get an order by ID
router.get(
  "/:id",
  asyncHandler(async (req, res) => {
    try {
      const orderID = req.params.id;
      const order = await Order.findById(orderID)
        .populate("couponCode", "couponCode discountType discountAmount")
        .populate("userID", "name email phone")
        .populate("items.productID", "name images price");
      if (!order) {
        return res
          .status(404)
          .json({ success: false, message: "Order not found." });
      }
      res.json({
        success: true,
        message: "Order retrieved successfully.",
        data: order,
      });
    } catch (error) {
      res.status(500).json({ success: false, message: error.message });
    }
  })
);

// Create a new order
router.post(
  "/",
  asyncHandler(async (req, res) => {
    const {
      userID,
      orderStatus,
      items,
      totalPrice,
      shippingAddress,
      paymentMethod,
      couponCode,
      orderTotal,
      trackingUrl,
    } = req.body;

    if (
      !userID ||
      !items ||
      !totalPrice ||
      !shippingAddress ||
      !paymentMethod
    ) {
      return res.status(400).json({
        success: false,
        message:
          "User ID, items, total price, shipping address, and payment method are required.",
      });
    }

    // Validate items array
    if (!Array.isArray(items) || items.length === 0) {
      return res.status(400).json({
        success: false,
        message: "Items must be a non-empty array.",
      });
    }

    // Validate each item
    for (const item of items) {
      if (
        !item.productID ||
        !item.productName ||
        !item.quantity ||
        !item.price
      ) {
        return res.status(400).json({
          success: false,
          message:
            "Each item must have productID, productName, quantity, and price.",
        });
      }
      if (item.quantity <= 0 || item.price <= 0) {
        return res.status(400).json({
          success: false,
          message: "Item quantity and price must be greater than 0.",
        });
      }
    }

    // Validate shipping address fields
    const requiredAddressFields = [
      "street",
      "city",
      "state",
      "postalCode",
      "country",
    ];
    for (const field of requiredAddressFields) {
      if (!shippingAddress[field]) {
        return res.status(400).json({
          success: false,
          message: `Shipping address '${field}' is required.`,
        });
      }
    }

    try {
      const newOrder = new Order({
        userID,
        orderStatus: orderStatus || "pending",
        items,
        totalPrice,
        shippingAddress,
        paymentMethod,
        couponCode: couponCode || null,
        orderTotal: orderTotal || {
          subtotal: totalPrice,
          discount: 0,
          total: totalPrice,
        },
        trackingUrl: trackingUrl || null,
      });

      const savedOrder = await newOrder.save();

      // Populate the response
      await savedOrder.populate(
        "couponCode",
        "couponCode discountType discountAmount"
      );
      await savedOrder.populate("userID", "name email");
      await savedOrder.populate("items.productID", "name images");

      res.json({
        success: true,
        message: "Order created successfully.",
        data: savedOrder,
      });
    } catch (error) {
      res.status(500).json({ success: false, message: error.message });
    }
  })
);

// Update an order
router.put(
  "/:id",
  asyncHandler(async (req, res) => {
    try {
      const orderID = req.params.id;
      const { orderStatus, trackingUrl, shippingAddress, paymentMethod } =
        req.body;

      const order = await Order.findById(orderID);
      if (!order) {
        return res
          .status(404)
          .json({ success: false, message: "Order not found." });
      }

      // Update fields if provided
      if (orderStatus) {
        // Validate order status
        const validStatuses = [
          "pending",
          "processing",
          "shipped",
          "delivered",
          "cancelled",
        ];
        if (!validStatuses.includes(orderStatus)) {
          return res.status(400).json({
            success: false,
            message:
              "Invalid order status. Must be one of: " +
              validStatuses.join(", "),
          });
        }
        order.orderStatus = orderStatus;
      }

      if (trackingUrl !== undefined) order.trackingUrl = trackingUrl;
      if (shippingAddress) {
        order.shippingAddress = {
          ...order.shippingAddress,
          ...shippingAddress,
        };
      }
      if (paymentMethod) order.paymentMethod = paymentMethod;

      const updatedOrder = await order.save();

      // Populate the response
      await updatedOrder.populate(
        "couponCode",
        "couponCode discountType discountAmount"
      );
      await updatedOrder.populate("userID", "name email");
      await updatedOrder.populate("items.productID", "name images");

      res.json({
        success: true,
        message: "Order updated successfully.",
        data: updatedOrder,
      });
    } catch (error) {
      res.status(500).json({ success: false, message: error.message });
    }
  })
);

// Update order status only
router.patch(
  "/:id/status",
  asyncHandler(async (req, res) => {
    try {
      const orderID = req.params.id;
      const { orderStatus } = req.body;

      if (!orderStatus) {
        return res
          .status(400)
          .json({ success: false, message: "Order status is required." });
      }

      // Validate order status
      const validStatuses = [
        "pending",
        "processing",
        "shipped",
        "delivered",
        "cancelled",
      ];
      if (!validStatuses.includes(orderStatus)) {
        return res.status(400).json({
          success: false,
          message:
            "Invalid order status. Must be one of: " + validStatuses.join(", "),
        });
      }

      const order = await Order.findByIdAndUpdate(
        orderID,
        { orderStatus },
        { new: true }
      )
        .populate("couponCode", "couponCode discountType discountAmount")
        .populate("userID", "name email")
        .populate("items.productID", "name images");

      if (!order) {
        return res
          .status(404)
          .json({ success: false, message: "Order not found." });
      }

      res.json({
        success: true,
        message: "Order status updated successfully.",
        data: order,
      });
    } catch (error) {
      res.status(500).json({ success: false, message: error.message });
    }
  })
);

// Delete an order
router.delete(
  "/:id",
  asyncHandler(async (req, res) => {
    try {
      const orderID = req.params.id;
      const deletedOrder = await Order.findByIdAndDelete(orderID);
      if (!deletedOrder) {
        return res
          .status(404)
          .json({ success: false, message: "Order not found." });
      }
      res.json({ success: true, message: "Order deleted successfully." });
    } catch (error) {
      res.status(500).json({ success: false, message: error.message });
    }
  })
);

// Get order statistics
router.get(
  "/stats/overview",
  asyncHandler(async (req, res) => {
    try {
      const totalOrders = await Order.countDocuments();
      const pendingOrders = await Order.countDocuments({
        orderStatus: "pending",
      });
      const processingOrders = await Order.countDocuments({
        orderStatus: "processing",
      });
      const shippedOrders = await Order.countDocuments({
        orderStatus: "shipped",
      });
      const deliveredOrders = await Order.countDocuments({
        orderStatus: "delivered",
      });
      const cancelledOrders = await Order.countDocuments({
        orderStatus: "cancelled",
      });

      // Calculate total revenue from delivered orders
      const revenueResult = await Order.aggregate([
        { $match: { orderStatus: "delivered" } },
        { $group: { _id: null, totalRevenue: { $sum: "$totalPrice" } } },
      ]);
      const totalRevenue =
        revenueResult.length > 0 ? revenueResult[0].totalRevenue : 0;

      const stats = {
        totalOrders,
        ordersByStatus: {
          pending: pendingOrders,
          processing: processingOrders,
          shipped: shippedOrders,
          delivered: deliveredOrders,
          cancelled: cancelledOrders,
        },
        totalRevenue,
      };

      res.json({
        success: true,
        message: "Order statistics retrieved successfully.",
        data: stats,
      });
    } catch (error) {
      res.status(500).json({ success: false, message: error.message });
    }
  })
);

// Get recent orders
router.get(
  "/recent/list",
  asyncHandler(async (req, res) => {
    try {
      const { limit = 10 } = req.query;
      const recentOrders = await Order.find()
        .populate("userID", "name email")
        .populate("items.productID", "name")
        .sort({ orderDate: -1 })
        .limit(parseInt(limit));

      res.json({
        success: true,
        message: "Recent orders retrieved successfully.",
        data: recentOrders,
      });
    } catch (error) {
      res.status(500).json({ success: false, message: error.message });
    }
  })
);

module.exports = router;
