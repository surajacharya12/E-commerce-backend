const express = require("express");
const router = express.Router();
const Chat = require("../model/chat");
const Product = require("../model/product");
const User = require("../model/user");

// Get or create a chat for a specific product and customer
router.post("/start", async (req, res) => {
  try {
    const {
      productId,
      customerId,
      customerName,
      customerEmail,
      initialMessage,
    } = req.body;

    if (!productId || !customerId || !customerName || !customerEmail) {
      return res.status(400).json({
        success: false,
        message: "Product ID, customer ID, name, and email are required",
      });
    }

    // Get product details
    const product = await Product.findById(productId);
    if (!product) {
      return res.status(404).json({
        success: false,
        message: "Product not found",
      });
    }

    // Check if chat already exists
    let chat = await Chat.findOne({ productId, customerId });

    if (chat) {
      // If initial message is provided, add it
      if (initialMessage && initialMessage.trim()) {
        chat.messages.push({
          sender: "customer",
          message: initialMessage.trim(),
          timestamp: new Date(),
        });
        chat.unreadCount.admin += 1;
        chat.status = "active";
        await chat.save();
      }
    } else {
      // Create new chat
      chat = new Chat({
        productId,
        customerId,
        customerName,
        customerEmail,
        productName: product.name,
        messages:
          initialMessage && initialMessage.trim()
            ? [
                {
                  sender: "customer",
                  message: initialMessage.trim(),
                  timestamp: new Date(),
                },
              ]
            : [],
        unreadCount: {
          customer: 0,
          admin: initialMessage && initialMessage.trim() ? 1 : 0,
        },
      });
      await chat.save();
    }

    // Populate product details
    await chat.populate("productId", "name images price offerPrice");

    res.json({
      success: true,
      data: chat,
    });
  } catch (error) {
    console.error("Error starting chat:", error);
    res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
});

// Get chat messages for a specific chat
router.get("/:chatId", async (req, res) => {
  try {
    const { chatId } = req.params;
    const { userId, userType } = req.query; // userType: 'customer' or 'admin'

    const chat = await Chat.findById(chatId)
      .populate("productId", "name images price offerPrice")
      .populate("customerId", "name email");

    if (!chat) {
      return res.status(404).json({
        success: false,
        message: "Chat not found",
      });
    }

    // Mark messages as read for the requesting user
    if (userType === "customer" && userId === chat.customerId._id.toString()) {
      chat.unreadCount.customer = 0;
      await chat.save();
    } else if (userType === "admin") {
      chat.unreadCount.admin = 0;
      await chat.save();
    }

    res.json({
      success: true,
      data: chat,
    });
  } catch (error) {
    console.error("Error fetching chat:", error);
    res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
});

// Send a message in a chat
router.post("/:chatId/message", async (req, res) => {
  try {
    const { chatId } = req.params;
    const { message, sender, userId } = req.body;

    if (!message || !message.trim() || !sender) {
      return res.status(400).json({
        success: false,
        message: "Message and sender are required",
      });
    }

    const chat = await Chat.findById(chatId);
    if (!chat) {
      return res.status(404).json({
        success: false,
        message: "Chat not found",
      });
    }

    // Add the message
    const newMessage = {
      sender,
      message: message.trim(),
      timestamp: new Date(),
      adminId: sender === "admin" ? userId : null,
    };

    chat.messages.push(newMessage);

    // Update unread count
    if (sender === "customer") {
      chat.unreadCount.admin += 1;
    } else {
      chat.unreadCount.customer += 1;
    }

    chat.status = "active";

    try {
      await chat.save();
    } catch (saveError) {
      console.error("Error saving chat:", saveError);
      return res.status(500).json({
        success: false,
        message: "Failed to save message",
      });
    }

    // Populate product details for response
    await chat.populate("productId", "name images price offerPrice");

    res.json({
      success: true,
      data: chat,
      message: "Message sent successfully",
    });
  } catch (error) {
    console.error("Error sending message:", error);
    res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
});

// Get all chats for a customer
router.get("/customer/:customerId", async (req, res) => {
  try {
    const { customerId } = req.params;
    const { page = 1, limit = 10 } = req.query;

    const chats = await Chat.find({ customerId })
      .populate("productId", "name images price offerPrice")
      .sort({ lastActivity: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit);

    const total = await Chat.countDocuments({ customerId });

    res.json({
      success: true,
      data: chats,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error("Error fetching customer chats:", error);
    res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
});

// Get all chats for admin dashboard (grouped by customer)
router.get("/admin/all", async (req, res) => {
  try {
    const { page = 1, limit = 20, status = "all" } = req.query;

    let matchFilter = {};
    if (status !== "all") {
      matchFilter.status = status;
    }

    // Aggregate chats by customer
    const customerChats = await Chat.aggregate([
      { $match: matchFilter },
      {
        $group: {
          _id: "$customerId",
          customerName: { $first: "$customerName" },
          customerEmail: { $first: "$customerEmail" },
          totalChats: { $sum: 1 },
          totalUnread: { $sum: "$unreadCount.admin" },
          lastActivity: { $max: "$lastActivity" },
          activeChats: {
            $sum: { $cond: [{ $eq: ["$status", "active"] }, 1, 0] },
          },
          resolvedChats: {
            $sum: { $cond: [{ $eq: ["$status", "resolved"] }, 1, 0] },
          },
          closedChats: {
            $sum: { $cond: [{ $eq: ["$status", "closed"] }, 1, 0] },
          },
          chats: {
            $push: {
              _id: "$_id",
              productId: "$productId",
              productName: "$productName",
              status: "$status",
              messages: "$messages",
              unreadCount: "$unreadCount",
              lastActivity: "$lastActivity",
            },
          },
        },
      },
      { $sort: { lastActivity: -1 } },
      { $skip: (page - 1) * limit },
      { $limit: parseInt(limit) },
    ]);

    // Populate product details
    await Chat.populate(customerChats, {
      path: "chats.productId",
      select: "name images price offerPrice",
    });

    const total = await Chat.aggregate([
      { $match: matchFilter },
      { $group: { _id: "$customerId" } },
      { $count: "total" },
    ]);

    // Get stats
    const stats = await Chat.aggregate([
      {
        $group: {
          _id: "$status",
          count: { $sum: 1 },
        },
      },
    ]);

    const totalUnread = await Chat.aggregate([
      {
        $group: {
          _id: null,
          totalUnread: { $sum: "$unreadCount.admin" },
        },
      },
    ]);

    res.json({
      success: true,
      data: customerChats,
      stats: {
        statusCounts: stats,
        totalUnread: totalUnread[0]?.totalUnread || 0,
      },
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total: total[0]?.total || 0,
        pages: Math.ceil((total[0]?.total || 0) / limit),
      },
    });
  } catch (error) {
    console.error("Error fetching admin chats:", error);
    res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
});

// Update chat status
router.patch("/:chatId/status", async (req, res) => {
  try {
    const { chatId } = req.params;
    const { status } = req.body;

    if (!["active", "resolved", "closed"].includes(status)) {
      return res.status(400).json({
        success: false,
        message: "Invalid status. Must be active, resolved, or closed",
      });
    }

    const chat = await Chat.findByIdAndUpdate(
      chatId,
      { status },
      { new: true }
    ).populate("productId", "name images price offerPrice");

    if (!chat) {
      return res.status(404).json({
        success: false,
        message: "Chat not found",
      });
    }

    res.json({
      success: true,
      data: chat,
      message: "Chat status updated successfully",
    });
  } catch (error) {
    console.error("Error updating chat status:", error);
    res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
});

// Search chats
router.get("/search/:query", async (req, res) => {
  try {
    const { query } = req.params;
    const { page = 1, limit = 10 } = req.query;

    const searchFilter = {
      $or: [
        { customerName: { $regex: query, $options: "i" } },
        { customerEmail: { $regex: query, $options: "i" } },
        { productName: { $regex: query, $options: "i" } },
        { "messages.message": { $regex: query, $options: "i" } },
      ],
    };

    const chats = await Chat.find(searchFilter)
      .populate("productId", "name images price offerPrice")
      .populate("customerId", "name email")
      .sort({ lastActivity: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit);

    const total = await Chat.countDocuments(searchFilter);

    res.json({
      success: true,
      data: chats,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error("Error searching chats:", error);
    res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
});

module.exports = router;
