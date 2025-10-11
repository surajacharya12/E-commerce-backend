const express = require("express");
const asyncHandler = require("express-async-handler");
const router = express.Router();
const User = require("../model/user");
const { userUpload, cloudinary } = require("../config/cloudinary"); // Assuming correct path

/**
 * Get all users (excluding passwords)
 */
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

/**
 * User login
 */
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

/**
 * Register a new user with optional photo upload
 */
router.post(
  "/register",
  userUpload.single("photo"),
  asyncHandler(async (req, res) => {
    const { name, email, phone, password } = req.body;
    if (!name || !email || !phone || !password) {
      // Clean up uploaded file if registration fails
      if (req.file) {
        /* Add logic to delete temp file */
      }
      return res.status(400).json({
        success: false,
        message: "Name, email, phone, and password are required.",
      });
    }

    const existingUser = await User.findOne({ email });
    if (existingUser) {
      if (req.file) {
        /* Add logic to delete temp file */
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
      // Optionally delete temp file here using fs.unlinkSync(req.file.path)
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

/**
 * Get user by ID
 */
router.get(
  "/:id",
  asyncHandler(async (req, res) => {
    const userID = req.params.id;
    const user = await User.findById(userID).select("-password");
    if (!user) {
      return res
        .status(404)
        .json({ success: false, message: "User not found." });
    }
    res.json({
      success: true,
      message: "User retrieved successfully.",
      data: user,
    });
  })
);

/**
 * Get profile by ID
 */
router.get(
  "/profile/:id",
  asyncHandler(async (req, res) => {
    const userID = req.params.id;
    const user = await User.findById(userID).select("-password");
    if (!user) {
      return res
        .status(404)
        .json({ success: false, message: "User not found." });
    }
    res.json({
      success: true,
      message: "User profile retrieved successfully.",
      data: user,
    });
  })
);

// --- NEW/UPDATED ENDPOINTS ---

/**
 * Endpoint for photo-only upload (Multipart POST)
 * Updates the user's photo field in the database.
 */
router.post(
  "/photo-upload",
  userUpload.single("photo"), // Middleware to handle file upload
  asyncHandler(async (req, res) => {
    const { id } = req.body; // Expects user ID in the form data
    if (!id) {
      return res
        .status(400)
        .json({ success: false, message: "User ID is required." });
    }
    if (!req.file) {
      return res
        .status(400)
        .json({ success: false, message: "Photo file is required." });
    }

    const user = await User.findById(id);
    if (!user) {
      return res
        .status(404)
        .json({ success: false, message: "User not found." });
    }

    // Upload to Cloudinary
    const result = await cloudinary.uploader.upload(req.file.path, {
      folder: "users",
    });
    // Optionally delete temp file here using fs.unlinkSync(req.file.path)

    user.photo = result.secure_url; // Store the URL in the database
    user.updatedAt = Date.now();

    await user.save();

    const userObj = user.toObject();
    delete userObj.password;

    res.json({
      success: true,
      message: "Photo uploaded and profile updated successfully.",
      data: { user: userObj }, // Send back updated user data
    });
  })
);

/**
 * Update user profile (Name and/or Password) - Expects JSON body
 */
router.put(
  "/profile/:id",
  // 💥 REMOVED: userUpload.single("photo") middleware
  asyncHandler(async (req, res) => {
    const userID = req.params.id;
    // Expects JSON body with 'name' and optionally 'password'
    const { name, password } = req.body;

    if (!name) {
      return res
        .status(400)
        .json({ success: false, message: "Name is required." });
    }

    const user = await User.findById(userID);
    if (!user) {
      return res
        .status(404)
        .json({ success: false, message: "User not found." });
    }

    user.name = name;
    if (password) user.password = password; // Mongoose middleware handles hashing
    user.updatedAt = Date.now();

    // 💥 REMOVED: File upload logic (if (req.file) {...})

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

/**
 * Delete user by ID
 */
router.delete(
  "/profile/:id",
  asyncHandler(async (req, res) => {
    const userID = req.params.id;

    const deletedUser = await User.findByIdAndDelete(userID);
    if (!deletedUser) {
      return res
        .status(404)
        .json({ success: false, message: "User not found." });
    }

    res.json({ success: true, message: "User deleted successfully." });
  })
);

module.exports = router;
