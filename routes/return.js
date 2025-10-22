const express = require("express");
const router = express.Router();
const Return = require("../model/return");
const Order = require("../model/order");
const Product = require("../model/product");

// Create a new return request
router.post("/create", async (req, res) => {
  try {
    const {
      orderID,
      orderNumber,
      userID,
      returnType,
      returnReason,
      returnDescription,
      items,
      refundMethod,
      pickupAddress,
      images,
    } = req.body;

    // Validate required fields
    if (
      !orderID ||
      !userID ||
      !returnType ||
      !returnReason ||
      !returnDescription ||
      !items ||
      items.length === 0
    ) {
      return res.status(400).json({
        success: false,
        message: "Missing required fields",
      });
    }

    // Verify order exists and belongs to user
    const order = await Order.findOne({ _id: orderID, userID: userID });
    if (!order) {
      return res.status(404).json({
        success: false,
        message: "Order not found or doesn't belong to user",
      });
    }

    // Check if order is eligible for return (delivered status)
    if (order.orderStatus !== "delivered") {
      return res.status(400).json({
        success: false,
        message: "Only delivered orders can be returned",
      });
    }

    // Check if return window is still open (30 days)
    const deliveryDate = order.updatedAt; // Assuming updatedAt is when status changed to delivered
    const returnWindow = 30 * 24 * 60 * 60 * 1000; // 30 days in milliseconds
    const currentDate = new Date();

    if (currentDate - deliveryDate > returnWindow) {
      return res.status(400).json({
        success: false,
        message:
          "Return window has expired. Returns are only allowed within 30 days of delivery.",
      });
    }

    // Calculate return amount
    let returnAmount = 0;
    const validatedItems = [];

    for (const item of items) {
      // Find the item in the original order
      const orderItem = order.items.find(
        (oi) =>
          oi.productID.toString() === item.productID &&
          oi.variant === item.variant
      );

      if (!orderItem) {
        return res.status(400).json({
          success: false,
          message: `Item ${item.productName} not found in order`,
        });
      }

      if (item.returnQuantity > orderItem.quantity) {
        return res.status(400).json({
          success: false,
          message: `Return quantity cannot exceed ordered quantity for ${item.productName}`,
        });
      }

      const itemReturnAmount = orderItem.price * item.returnQuantity;
      returnAmount += itemReturnAmount;

      validatedItems.push({
        productID: item.productID,
        productName: orderItem.productName,
        quantity: orderItem.quantity,
        price: orderItem.price,
        variant: orderItem.variant,
        returnQuantity: item.returnQuantity,
        condition: item.condition || "used",
      });
    }

    // Create return request
    const returnRequest = new Return({
      orderID,
      orderNumber: order.orderNumber,
      userID,
      returnType,
      returnReason,
      returnDescription,
      items: validatedItems,
      returnAmount,
      refundMethod: refundMethod || "original_payment",
      pickupAddress: pickupAddress || order.shippingAddress,
      images: images || [],
    });

    await returnRequest.save();

    // Populate the return request with order and product details
    await returnRequest.populate([
      {
        path: "orderID",
        select: "orderNumber orderDate totalPrice",
      },
      {
        path: "items.productID",
        select: "name images",
      },
    ]);

    res.status(201).json({
      success: true,
      message: "Return request created successfully",
      data: returnRequest,
    });
  } catch (error) {
    console.error("Error creating return request:", error);
    res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
});

// Get delivered orders for a user (for return creation)
router.get("/user/:userID/delivered-orders", async (req, res) => {
  try {
    const { userID } = req.params;

    // Find all delivered orders for the user
    const deliveredOrders = await Order.find({
      userID: userID,
      orderStatus: "delivered",
    })
      .populate("items.productID", "name images price")
      .sort({ updatedAt: -1 }); // Most recently delivered first

    // Filter orders that are within return window (30 days)
    const returnWindow = 30 * 24 * 60 * 60 * 1000; // 30 days in milliseconds
    const currentDate = new Date();

    const eligibleOrders = deliveredOrders.filter((order) => {
      const deliveryDate = order.updatedAt; // Assuming updatedAt is when status changed to delivered
      return currentDate - deliveryDate <= returnWindow;
    });

    // Check if any items from these orders already have return requests
    const orderIds = eligibleOrders.map((order) => order._id);
    const existingReturns = await Return.find({
      orderID: { $in: orderIds },
    });

    // Create a map of returned items by order and product
    const returnedItemsMap = new Map();
    existingReturns.forEach((returnReq) => {
      returnReq.items.forEach((item) => {
        const key = `${returnReq.orderID}_${item.productID}`;
        const existing = returnedItemsMap.get(key) || 0;
        returnedItemsMap.set(key, existing + item.returnQuantity);
      });
    });

    // Add return eligibility info to each order
    const ordersWithReturnInfo = eligibleOrders.map((order) => {
      const orderObj = order.toObject();

      // Add return eligibility info to each item
      orderObj.items = orderObj.items.map((item) => {
        const key = `${order._id}_${item.productID._id || item.productID}`;
        const returnedQuantity = returnedItemsMap.get(key) || 0;
        const availableForReturn = item.quantity - returnedQuantity;

        return {
          ...item,
          returnedQuantity,
          availableForReturn,
          canReturn: availableForReturn > 0,
        };
      });

      // Check if entire order can be returned
      orderObj.canReturn = orderObj.items.some((item) => item.canReturn);

      return orderObj;
    });

    res.json({
      success: true,
      data: ordersWithReturnInfo,
      message: `Found ${ordersWithReturnInfo.length} eligible orders for returns`,
    });
  } catch (error) {
    console.error("Error fetching delivered orders:", error);
    res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
});

// Get all returns for a user
router.get("/user/:userID", async (req, res) => {
  try {
    const { userID } = req.params;
    const { page = 1, limit = 10, status } = req.query;

    const query = { userID };
    if (status) {
      query.returnStatus = status;
    }

    const returns = await Return.find(query)
      .populate([
        {
          path: "orderID",
          select: "orderNumber orderDate totalPrice",
        },
        {
          path: "items.productID",
          select: "name images",
        },
      ])
      .sort({ returnDate: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit);

    const total = await Return.countDocuments(query);

    res.json({
      success: true,
      data: returns,
      pagination: {
        currentPage: parseInt(page),
        totalPages: Math.ceil(total / limit),
        totalReturns: total,
      },
    });
  } catch (error) {
    console.error("Error fetching user returns:", error);
    res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
});

// Get return details by ID
router.get("/:returnID", async (req, res) => {
  try {
    const { returnID } = req.params;

    const returnRequest = await Return.findById(returnID).populate([
      {
        path: "orderID",
        select: "orderNumber orderDate totalPrice shippingAddress",
      },
      {
        path: "items.productID",
        select: "name images price",
      },
      {
        path: "userID",
        select: "name email phone",
      },
    ]);

    if (!returnRequest) {
      return res.status(404).json({
        success: false,
        message: "Return request not found",
      });
    }

    res.json({
      success: true,
      data: returnRequest,
    });
  } catch (error) {
    console.error("Error fetching return details:", error);
    res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
});

// Update return status (Admin only)
router.put("/:returnID/status", async (req, res) => {
  try {
    const { returnID } = req.params;
    const {
      status,
      adminNotes,
      processedBy,
      previousStatus,
      timestamp,
      returnNumber,
    } = req.body;

    console.log("📝 Return Status Update Request:", {
      returnID,
      status,
      previousStatus,
      adminNotes,
      processedBy,
      timestamp: new Date().toISOString(),
    });

    // Validate ObjectId format
    const mongoose = require("mongoose");
    if (!mongoose.Types.ObjectId.isValid(returnID)) {
      return res.status(400).json({
        success: false,
        message: "Invalid return ID format",
      });
    }

    // Validate required fields
    if (!status) {
      return res.status(400).json({
        success: false,
        message: "Status is required",
      });
    }

    const validStatuses = [
      "requested",
      "approved",
      "rejected",
      "picked_up",
      "processing",
      "refunded",
      "cancelled",
    ];

    if (!validStatuses.includes(status)) {
      return res.status(400).json({
        success: false,
        message: `Invalid status: ${status}. Valid statuses are: ${validStatuses.join(
          ", "
        )}`,
      });
    }

    // Find the return request first
    console.log("🔍 Looking for return with ID:", returnID);
    const existingReturn = await Return.findById(returnID);

    if (!existingReturn) {
      console.log("❌ Return not found in database");
      return res.status(404).json({
        success: false,
        message: "Return request not found",
      });
    }

    console.log("✅ Found existing return:", {
      id: existingReturn._id,
      returnNumber: existingReturn.returnNumber,
      currentStatus: existingReturn.returnStatus,
    });

    const updateData = {
      returnStatus: status,
      processedAt: new Date(),
    };

    // Only set processedBy if it's a valid ObjectId, otherwise skip it
    if (processedBy && mongoose.Types.ObjectId.isValid(processedBy)) {
      updateData.processedBy = processedBy;
    }

    if (adminNotes) {
      updateData.adminNotes = adminNotes;
    }

    if (status === "refunded") {
      updateData.refundedAt = new Date();
    }

    // Update the return request
    const returnRequest = await Return.findByIdAndUpdate(returnID, updateData, {
      new: true,
      runValidators: true,
    }).populate([
      {
        path: "orderID",
        select: "orderNumber orderDate totalPrice",
      },
      {
        path: "userID",
        select: "name email",
      },
      {
        path: "items.productID",
        select: "name images",
      },
    ]);

    if (!returnRequest) {
      return res.status(404).json({
        success: false,
        message: "Return request not found after update",
      });
    }

    console.log("✅ Return Status Updated Successfully:", {
      returnID,
      returnNumber: returnRequest.returnNumber,
      previousStatus: existingReturn.returnStatus,
      newStatus: status,
      timestamp: new Date().toISOString(),
    });

    res.json({
      success: true,
      message: `Return status updated from ${existingReturn.returnStatus} to ${status}`,
      data: returnRequest,
      statusChange: {
        from: existingReturn.returnStatus,
        to: status,
        updatedAt: new Date().toISOString(),
        processedBy: processedBy || "admin",
      },
    });
  } catch (error) {
    console.error("❌ Error updating return status:", error);
    console.error("Error details:", {
      message: error.message,
      stack: error.stack,
      returnID: req.params.returnID,
      status,
      requestBody: req.body,
    });

    res.status(500).json({
      success: false,
      message: "Internal server error",
      error:
        process.env.NODE_ENV === "development"
          ? {
              message: error.message,
              stack: error.stack,
              details: "Check server logs for more information",
            }
          : "Please try again later",
    });
  }
});

// Cancel return request (User only, before approval)
router.put("/:returnID/cancel", async (req, res) => {
  try {
    const { returnID } = req.params;
    const { userID } = req.body;

    const returnRequest = await Return.findOne({
      _id: returnID,
      userID: userID,
    });

    if (!returnRequest) {
      return res.status(404).json({
        success: false,
        message: "Return request not found",
      });
    }

    if (returnRequest.returnStatus !== "requested") {
      return res.status(400).json({
        success: false,
        message:
          "Can only cancel return requests that are still pending approval",
      });
    }

    returnRequest.returnStatus = "cancelled";
    await returnRequest.save();

    res.json({
      success: true,
      message: "Return request cancelled successfully",
      data: returnRequest,
    });
  } catch (error) {
    console.error("Error cancelling return request:", error);
    res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
});

// Get all returns (Admin only)
router.get("/admin/all", async (req, res) => {
  try {
    const { page = 1, limit = 10, status, search } = req.query;

    const query = {};
    if (status) {
      query.returnStatus = status;
    }

    if (search) {
      query.$or = [
        { returnNumber: { $regex: search, $options: "i" } },
        { orderNumber: { $regex: search, $options: "i" } },
      ];
    }

    const returns = await Return.find(query)
      .populate([
        {
          path: "orderID",
          select: "orderNumber orderDate totalPrice",
        },
        {
          path: "userID",
          select: "name email phone",
        },
        {
          path: "items.productID",
          select: "name images",
        },
      ])
      .sort({ returnDate: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit);

    const total = await Return.countDocuments(query);

    res.json({
      success: true,
      data: returns,
      pagination: {
        currentPage: parseInt(page),
        totalPages: Math.ceil(total / limit),
        totalReturns: total,
      },
    });
  } catch (error) {
    console.error("Error fetching all returns:", error);
    res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
});

module.exports = router;
