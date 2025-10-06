const bcrypt = require("bcryptjs");

// Test password comparison with the hash from your database
const testPassword = async () => {
  const plainPassword = "your_password_here"; // Replace with the actual password
  const hashedPassword =
    "$2b$10$R2zsPgZGbesWeikUnYPzWOmSy.tVN8LZUoc1kvK2Mz0pHx4lBr3oG";

  try {
    const isMatch = await bcrypt.compare(plainPassword, hashedPassword);
    console.log("Password match:", isMatch);

    // Test creating a new hash
    const newHash = await bcrypt.hash(plainPassword, 10);
    console.log("New hash:", newHash);

    const newMatch = await bcrypt.compare(plainPassword, newHash);
    console.log("New hash match:", newMatch);
  } catch (error) {
    console.error("Error:", error);
  }
};

testPassword();
