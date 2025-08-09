const express = require('express');
const asyncHandler = require('express-async-handler');
const router = express.Router();
const User = require('../model/user');

/**
 * Get all users (excluding passwords)
 */
router.get('/', asyncHandler(async (req, res) => {
  const users = await User.find().select('-password');
  res.json({ success: true, message: "Users retrieved successfully.", data: users });
}));

/**
 * User login
 * Matches email and plaintext password
 */
router.post('/login', asyncHandler(async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ success: false, message: "Email and password are required." });
  }

  const user = await User.findOne({ email });
  if (!user || user.password !== password) {
    return res.status(400).json({ success: false, message: "Invalid email or password." });
  }

  res.json({
    success: true,
    message: "Logged in successfully.",
    data: {
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        phone: user.phone,
        photo: user.photo,
        createdAt: user.createdAt,
        updatedAt: user.updatedAt,
      }
    }
  });
}));

/**
 * Register a new user
 */
router.post('/register', asyncHandler(async (req, res) => {
  const { name, email, phone, password, photo } = req.body;

  if (!name || !email || !phone || !password) {
    return res.status(400).json({ success: false, message: "Name, email, phone, and password are required." });
  }

  const existingUser = await User.findOne({ email });
  if (existingUser) {
    return res.status(400).json({ success: false, message: "User already exists." });
  }

  const user = new User({ name, email, phone, password, photo });
  await user.save();

  res.json({ success: true, message: "User registered successfully.", data: null });
}));

/**
 * Get user by ID
 */
router.get('/:id', asyncHandler(async (req, res) => {
  const userID = req.params.id;
  const user = await User.findById(userID).select('-password');
  if (!user) {
    return res.status(404).json({ success: false, message: "User not found." });
  }
  res.json({ success: true, message: "User retrieved successfully.", data: user });
}));

/**
 * Get profile by ID
 */
router.get('/profile/:id', asyncHandler(async (req, res) => {
  const userID = req.params.id;
  const user = await User.findById(userID).select('-password');
  if (!user) {
    return res.status(404).json({ success: false, message: "User not found." });
  }
  res.json({ success: true, message: "User profile retrieved successfully.", data: user });
}));

/**
 * Update user profile
 */
router.put('/profile/:id', asyncHandler(async (req, res) => {
  const userID = req.params.id;
  const { name, password, photo } = req.body;

  if (!name) {
    return res.status(400).json({ success: false, message: "Name is required." });
  }

  const user = await User.findById(userID);
  if (!user) {
    return res.status(404).json({ success: false, message: "User not found." });
  }

  user.name = name;
  if (password) user.password = password; // Store as plain text
  if (photo) user.photo = photo;

  await user.save();

  const userObj = user.toObject();
  delete userObj.password;

  res.json({ success: true, message: "Profile updated successfully.", data: userObj });
}));

/**
 * Delete user by ID
 */
router.delete('/profile/:id', asyncHandler(async (req, res) => {
  const userID = req.params.id;

  const deletedUser = await User.findByIdAndDelete(userID);
  if (!deletedUser) {
    return res.status(404).json({ success: false, message: "User not found." });
  }

  res.json({ success: true, message: "User deleted successfully." });
}));

module.exports = router;
