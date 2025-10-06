const express = require("express");
const router = express.Router();
const asyncHandler = require("express-async-handler");
const Notification = require("../model/notification");
const { notificationUpload, cloudinary } = require("../config/cloudinary");
const OneSignal = require("onesignal-node");
const dotenv = require("dotenv");
dotenv.config();

// OneSignal client setup
const client = new OneSignal.Client(
  process.env.ONE_SIGNAL_APP_ID,
  process.env.ONE_SIGNAL_REST_API_KEY
);

// GET all notifications
router.get(
  "/",
  asyncHandler(async (req, res) => {
    const notifications = await Notification.find({}).sort({ createdAt: -1 });
    res.json({
      success: true,
      message: "Notifications retrieved successfully.",
      data: notifications,
    });
  })
);

// GET a single notification
router.get(
  "/:id",
  asyncHandler(async (req, res) => {
    const notification = await Notification.findById(req.params.id);
    if (!notification) {
      return res
        .status(404)
        .json({ success: false, message: "Notification not found." });
    }
    res.json({
      success: true,
      message: "Notification retrieved successfully.",
      data: notification,
    });
  })
);

// CREATE a new notification
router.post(
  "/",
  (req, res, next) => {
    // Check if the request is multipart/form-data
    const contentType = req.get("Content-Type");
    if (contentType && contentType.includes("multipart/form-data")) {
      notificationUpload.single("img")(req, res, function (err) {
        if (err) {
          console.error("Upload error:", err);
          return res.status(400).json({
            success: false,
            message: "Image upload failed",
            error: err.message,
          });
        }
        next();
      });
    } else {
      // For JSON requests, skip multer
      next();
    }
  },
  asyncHandler(async (req, res) => {
    const { title, description, sendPush } = req.body;

    if (!title || !description) {
      return res.status(400).json({
        success: false,
        message: "Title and description are required.",
      });
    }

    const imageUrl = req.file ? req.file.path : undefined;

    const newNotification = new Notification({
      title,
      description,
      imageUrl,
    });

    const savedNotification = await newNotification.save();

    if (sendPush === "true") {
      try {
        const notificationBody = {
          contents: { en: description },
          headings: { en: title },
          included_segments: ["All"],
          ...(imageUrl && { big_picture: imageUrl }),
        };
        const response = await client.createNotification(notificationBody);
        savedNotification.notificationId = response.body.id;
        await savedNotification.save();
      } catch (pushError) {
        console.log("Push notification failed:", pushError.body || pushError);
      }
    }

    res.status(201).json({
      success: true,
      message: "Notification created successfully.",
      data: savedNotification,
    });
  })
);

// UPDATE a notification
router.put(
  "/:id",
  (req, res, next) => {
    // Check if the request is multipart/form-data
    const contentType = req.get("Content-Type");
    if (contentType && contentType.includes("multipart/form-data")) {
      notificationUpload.single("img")(req, res, function (err) {
        if (err) {
          console.error("Upload error:", err);
          return res.status(400).json({
            success: false,
            message: "Image upload failed",
            error: err.message,
          });
        }
        next();
      });
    } else {
      // For JSON requests, skip multer
      next();
    }
  },
  asyncHandler(async (req, res) => {
    const notification = await Notification.findById(req.params.id);

    if (!notification) {
      return res
        .status(404)
        .json({ success: false, message: "Notification not found." });
    }

    const { title, description } = req.body;
    const newImageUrl = req.file ? req.file.path : undefined;

    if (title) notification.title = title;
    if (description) notification.description = description;

    if (newImageUrl) {
      if (notification.imageUrl) {
        try {
          const publicId = notification.imageUrl.split("/").pop().split(".")[0];
          await cloudinary.uploader.destroy(
            `online_store/notifications/${publicId}`
          );
        } catch (cloudinaryError) {
          console.log("Error deleting old image:", cloudinaryError);
        }
      }
      notification.imageUrl = newImageUrl;
    }

    const updatedNotification = await notification.save();
    res.json({
      success: true,
      message: "Notification updated successfully.",
      data: updatedNotification,
    });
  })
);

// DELETE a notification
router.delete(
  "/:id",
  asyncHandler(async (req, res) => {
    const notification = await Notification.findById(req.params.id);
    if (!notification) {
      return res
        .status(404)
        .json({ success: false, message: "Notification not found." });
    }

    if (notification.imageUrl) {
      try {
        const publicId = notification.imageUrl.split("/").pop().split(".")[0];
        await cloudinary.uploader.destroy(
          `online_store/notifications/${publicId}`
        );
      } catch (cloudinaryError) {
        console.log("Error deleting image from Cloudinary:", cloudinaryError);
      }
    }

    await Notification.findByIdAndDelete(req.params.id);
    res.json({
      success: true,
      message: "Notification deleted successfully.",
      data: null,
    });
  })
);

module.exports = router;
