const express = require("express");
const asyncHandler = require("express-async-handler");
const router = express.Router();
const User = require("../model/user");
const { userUpload, cloudinary } = require("../config/cloudinary");

// ---------------------- GET ALL USERS ----------------------
router.get(
  "/",
  asyncHandler(async (req, res) => {
    const users = await User.find().select("-password");
    res.json({
      success: true,
      message: "Users retrieved successfully.",
      data: users,
    });
  })
);

// ---------------------- LOGIN ----------------------
router.post(
  "/login",
  asyncHandler(async (req, res) => {
    const { email, password } = req.body;
    if (!email || !password) {
      return res
        .status(400)
        .json({ success: false, message: "Email and password are required." });
    }

    const user = await User.findOne({ email });
    if (!user) {
      return res
        .status(400)
        .json({ success: false, message: "Invalid email or password." });
    }

    const isPasswordValid = await user.comparePassword(password);
    if (!isPasswordValid) {
      return res
        .status(400)
        .json({ success: false, message: "Invalid email or password." });
    }

    res.json({
      success: true,
      message: "Login successful.",
      data: {
        user: {
          id: user._id.toString(),
          name: user.name,
          email: user.email,
          phone: user.phone,
          photo: user.photo,
          createdAt: user.createdAt,
          updatedAt: user.updatedAt,
        },
        token: `auth_token_${user._id}`,
      },
    });
  })
);

// ---------------------- REGISTER ----------------------
router.post(
  "/register",
  userUpload.single("photo"),
  asyncHandler(async (req, res) => {
    const { name, email, phone, password } = req.body;

    if (!name || !email || !phone || !password) {
      if (req.file) {
        // Optional: delete temp file
      }
      return res.status(400).json({
        success: false,
        message: "Name, email, phone, and password are required.",
      });
    }

    const existingUser = await User.findOne({ email });
    if (existingUser) {
      if (req.file) {
        // Optional: delete temp file
      }
      return res
        .status(400)
        .json({ success: false, message: "User already exists." });
    }

    let photoUrl = null;
    if (req.file) {
      const result = await cloudinary.uploader.upload(req.file.path, {
        folder: "users",
      });
      photoUrl = result.secure_url;
    }

    const user = new User({ name, email, phone, password, photo: photoUrl });
    await user.save();

    res.status(201).json({
      success: true,
      message: "User registered successfully.",
      data: {
        user: {
          id: user._id.toString(),
          name: user.name,
          email: user.email,
          phone: user.phone,
          photo: user.photo,
          createdAt: user.createdAt,
          updatedAt: user.updatedAt,
        },
        token: `auth_token_${user._id}`,
      },
    });
  })
);

// ---------------------- GET USER BY ID ----------------------
router.get(
  "/:id",
  asyncHandler(async (req, res) => {
    const user = await User.findById(req.params.id).select("-password");
    if (!user)
      return res
        .status(404)
        .json({ success: false, message: "User not found." });
    res.json({
      success: true,
      message: "User retrieved successfully.",
      data: user,
    });
  })
);

// ---------------------- GET PROFILE ----------------------
router.get(
  "/profile/:id",
  asyncHandler(async (req, res) => {
    const user = await User.findById(req.params.id).select("-password");
    if (!user)
      return res
        .status(404)
        .json({ success: false, message: "User not found." });
    res.json({
      success: true,
      message: "User profile retrieved successfully.",
      data: user,
    });
  })
);

// ---------------------- UPLOAD PROFILE PHOTO ----------------------
router.post(
  "/photo-upload",
  userUpload.single("photo"),
  asyncHandler(async (req, res) => {
    const { id } = req.body;
    if (!id)
      return res
        .status(400)
        .json({ success: false, message: "User ID is required." });
    if (!req.file)
      return res
        .status(400)
        .json({ success: false, message: "Photo file is required." });

    const user = await User.findById(id);
    if (!user)
      return res
        .status(404)
        .json({ success: false, message: "User not found." });

    const result = await cloudinary.uploader.upload(req.file.path, {
      folder: "users",
    });
    user.photo = result.secure_url;
    user.updatedAt = Date.now();
    await user.save();

    const userObj = user.toObject();
    delete userObj.password;

    res.json({
      success: true,
      message: "Photo uploaded and profile updated.",
      data: { user: userObj },
    });
  })
);

// ---------------------- UPDATE PROFILE ----------------------
router.put(
  "/profile/:id",
  asyncHandler(async (req, res) => {
    const { name, email, phone, password } = req.body;
    if (!name)
      return res
        .status(400)
        .json({ success: false, message: "Name is required." });

    const user = await User.findById(req.params.id);
    if (!user)
      return res
        .status(404)
        .json({ success: false, message: "User not found." });

    if (name) user.name = name;
    if (email) user.email = email;
    if (phone) user.phone = phone;
    if (password) user.password = password;

    user.updatedAt = Date.now();
    await user.save();

    const userObj = user.toObject();
    delete userObj.password;

    res.json({
      success: true,
      message: "Profile updated successfully.",
      data: userObj,
    });
  })
);

// ---------------------- DELETE USER ----------------------
router.delete(
  "/profile/:id",
  asyncHandler(async (req, res) => {
    const deletedUser = await User.findByIdAndDelete(req.params.id);
    if (!deletedUser)
      return res
        .status(404)
        .json({ success: false, message: "User not found." });
    res.json({ success: true, message: "User deleted successfully." });
  })
);

module.exports = router;
