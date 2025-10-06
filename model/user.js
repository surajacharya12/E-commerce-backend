const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");

const userSchema = new mongoose.Schema({
  name: { type: String, required: true },
  password: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  phone: { type: String },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now },
  photo: { type: String }, // Optional photo URL
});

// Middleware: Hash password before saving
userSchema.pre("save", async function (next) {
  if (!this.isModified("password")) {
    return next();
  }
  const saltRounds = 10;
  this.password = await bcrypt.hash(this.password, saltRounds);
  next();
});

// Method to compare password
userSchema.methods.comparePassword = async function (enteredPassword) {
  try {
    console.log("Comparing password for user:", this.email);
    console.log("Entered password length:", enteredPassword.length);
    console.log("Stored hash format:", this.password.substring(0, 4));

    // Handle both $2a$ (bcryptjs) and $2b$ (bcrypt) formats
    const result = await bcrypt.compare(enteredPassword, this.password);
    console.log("Password comparison result:", result);
    return result;
  } catch (error) {
    console.error("Password comparison error:", error);
    return false;
  }
};

const User = mongoose.model("User", userSchema);
module.exports = User;
