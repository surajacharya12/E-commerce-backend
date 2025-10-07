const express = require("express");
const asyncHandler = require("express-async-handler");
const router = express.Router();
const Order = require("../model/order");
const OrderCleanupService = require("../services/orderCleanup");

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
      deliveryMethod,
      selectedStore,
      couponCode,
      orderTotal,
      trackingUrl,
    } = req.body;

    if (
      !userID ||
      !items ||
      !totalPrice ||
      !shippingAddress ||
      !paymentMethod ||
      !deliveryMethod
    ) {
      return res.status(400).json({
        success: false,
        message:
          "User ID, items, total price, shipping address, payment method, and delivery method are required.",
      });
    }

    // Validate delivery method
    if (!["homeDelivery", "storeDelivery"].includes(deliveryMethod)) {
      return res.status(400).json({
        success: false,
        message:
          "Delivery method must be either 'homeDelivery' or 'storeDelivery'.",
      });
    }

    // If store delivery, validate selected store
    if (deliveryMethod === "storeDelivery" && !selectedStore) {
      return res.status(400).json({
        success: false,
        message: "Selected store information is required for store delivery.",
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
      // Calculate delivery fee based on delivery method
      let deliveryFee = 0;
      if (deliveryMethod === "homeDelivery") {
        deliveryFee = 150;
      } else if (deliveryMethod === "storeDelivery") {
        deliveryFee = 100;
      }

      // Calculate subtotal from items
      const subtotal = items.reduce(
        (sum, item) => sum + item.price * item.quantity,
        0
      );

      // Calculate tax (10%)
      const tax = Math.round(subtotal * 0.1);

      // Calculate discount (if coupon applied)
      const discount = orderTotal?.discount || 0;

      // Calculate final total
      const finalTotal = subtotal + deliveryFee + tax - discount;

      const calculatedOrderTotal = {
        subtotal: subtotal,
        deliveryFee: deliveryFee,
        tax: tax,
        discount: discount,
        total: finalTotal,
      };

      const newOrder = new Order({
        userID,
        orderStatus: orderStatus || "pending",
        items,
        totalPrice: finalTotal,
        shippingAddress,
        paymentMethod,
        deliveryMethod,
        selectedStore:
          deliveryMethod === "storeDelivery" ? selectedStore : null,
        couponCode: couponCode || null,
        orderTotal: calculatedOrderTotal,
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
      const {
        orderStatus,
        trackingUrl,
        shippingAddress,
        paymentMethod,
        deliveryMethod,
        selectedStore,
      } = req.body;

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
      if (deliveryMethod) {
        // Validate delivery method
        if (!["homeDelivery", "storeDelivery"].includes(deliveryMethod)) {
          return res.status(400).json({
            success: false,
            message:
              "Delivery method must be either 'homeDelivery' or 'storeDelivery'.",
          });
        }

        order.deliveryMethod = deliveryMethod;

        // Update delivery fee and recalculate total
        let newDeliveryFee = 0;
        if (deliveryMethod === "homeDelivery") {
          newDeliveryFee = 150;
          order.selectedStore = null; // Clear store info for home delivery
        } else if (deliveryMethod === "storeDelivery") {
          newDeliveryFee = 100;
          if (selectedStore) {
            order.selectedStore = selectedStore;
          }
        }

        // Recalculate order total
        const subtotal = order.orderTotal?.subtotal || order.totalPrice;
        const tax = order.orderTotal?.tax || Math.round(subtotal * 0.1);
        const discount = order.orderTotal?.discount || 0;
        const newTotal = subtotal + newDeliveryFee + tax - discount;

        order.orderTotal = {
          ...order.orderTotal,
          deliveryFee: newDeliveryFee,
          total: newTotal,
        };
        order.totalPrice = newTotal;
      }
      if (selectedStore && order.deliveryMethod === "storeDelivery") {
        order.selectedStore = selectedStore;
      }

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
      const { orderStatus, cancellationReason } = req.body;

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

      // Prepare update data
      const updateData = { orderStatus };

      // If cancelling, add cancellation details
      if (orderStatus === "cancelled") {
        updateData.cancelledAt = new Date();
        if (cancellationReason) {
          updateData.cancellationReason = cancellationReason;
        }
      }

      const order = await Order.findByIdAndUpdate(orderID, updateData, {
        new: true,
      })
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
        message: `Order ${
          orderStatus === "cancelled" ? "cancelled" : "status updated"
        } successfully.`,
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

// Cleanup cancelled orders (Admin only - you might want to add authentication middleware)
router.post(
  "/cleanup/cancelled",
  asyncHandler(async (req, res) => {
    try {
      const { daysOld = 5 } = req.body;

      const result = await OrderCleanupService.removeCancelledOrders(daysOld);

      res.json({
        success: result.success,
        message: result.message,
        data: {
          removedCount: result.removedCount,
          removedOrders: result.removedOrders,
        },
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: `Cleanup failed: ${error.message}`,
      });
    }
  })
);

// Get cancelled orders statistics
router.get(
  "/stats/cancelled",
  asyncHandler(async (req, res) => {
    try {
      const stats = await OrderCleanupService.getCancelledOrdersStats();

      res.json({
        success: true,
        message: "Cancelled orders statistics retrieved successfully.",
        data: stats,
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: `Failed to get stats: ${error.message}`,
      });
    }
  })
);

module.exports = router;
