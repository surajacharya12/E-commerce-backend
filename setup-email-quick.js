const fs = require("fs");
const path = require("path");

console.log("📧 Quick Email Setup for Forgot Password");
console.log("=====================================");

const envPath = path.join(__dirname, ".env");

// Read current .env file
let envContent = "";
try {
  envContent = fs.readFileSync(envPath, "utf8");
} catch (error) {
  console.log("📝 Creating new .env file...");
}

// Check if email configuration exists
const hasEmailConfig =
  envContent.includes("EMAIL_USER") && envContent.includes("EMAIL_PASS");

if (hasEmailConfig) {
  console.log("✅ Email configuration already exists in .env");

  // Test the configuration
  const emailUser = process.env.EMAIL_USER;
  const emailPass = process.env.EMAIL_PASS;

  if (emailUser && emailPass) {
    console.log("📧 EMAIL_USER:", emailUser);
    console.log("🔑 EMAIL_PASS:", emailPass ? "✅ Set" : "❌ Not set");
  } else {
    console.log(
      "⚠️  Email variables exist but are not loaded. Restart the server."
    );
  }
} else {
  console.log("📝 Adding email configuration to .env...");

  const emailConfig = `
# Email Configuration for Forgot Password
EMAIL_USER=shopease.demo@gmail.com
EMAIL_PASS=demo_app_password_here
EMAIL_SERVICE=gmail
`;

  // Append to .env file
  fs.appendFileSync(envPath, emailConfig);
  console.log("✅ Email configuration added to .env");
}

console.log("");
console.log("🔧 Next Steps:");
console.log("1. Update EMAIL_USER with your Gmail address");
console.log("2. Update EMAIL_PASS with your Gmail App Password");
console.log("3. Restart the server: npm run dev");
console.log("4. Test with: npm run check-email");
console.log("");
console.log("📖 For Gmail App Password setup:");
console.log("   - Enable 2FA on Gmail");
console.log("   - Go to Google Account > Security > App passwords");
console.log("   - Generate password for 'Mail'");
console.log("   - Use the 16-character password in EMAIL_PASS");
console.log("");
console.log("🧪 For testing without email setup:");
console.log(
  "   The system will work in development mode and show codes in console."
);
