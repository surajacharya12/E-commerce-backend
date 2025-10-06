const nodemailer = require("nodemailer");
require("dotenv").config();

const checkEmailConfiguration = async () => {
  console.log("🔧 Checking Email Configuration...");
  console.log("================================");

  // Check environment variables
  console.log(
    "📧 EMAIL_USER:",
    process.env.EMAIL_USER ? "✅ Set" : "❌ Not set"
  );
  console.log(
    "🔑 EMAIL_PASS:",
    process.env.EMAIL_PASS ? "✅ Set" : "❌ Not set"
  );

  if (!process.env.EMAIL_USER || !process.env.EMAIL_PASS) {
    console.log("");
    console.log("❌ Email configuration incomplete!");
    console.log("📝 Please update your .env file with:");
    console.log("   EMAIL_USER=your-email@gmail.com");
    console.log("   EMAIL_PASS=your-gmail-app-password");
    console.log("");
    console.log("📖 For Gmail setup instructions, see EMAIL_SETUP.md");
    return false;
  }

  try {
    // Create transporter
    const transporter = nodemailer.createTransporter({
      service: "gmail",
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS,
      },
      tls: {
        rejectUnauthorized: false,
      },
    });

    // Verify connection
    console.log("🧪 Testing email connection...");
    await transporter.verify();

    console.log("✅ Email configuration is valid!");
    console.log("📤 Ready to send verification emails");

    return true;
  } catch (error) {
    console.log("❌ Email configuration test failed:");
    console.log("   Error:", error.message);

    if (error.code === "EAUTH") {
      console.log("");
      console.log("🔧 Authentication failed. Please check:");
      console.log("   1. EMAIL_USER is correct");
      console.log(
        "   2. EMAIL_PASS is your Gmail App Password (not regular password)"
      );
      console.log("   3. 2-Factor Authentication is enabled on Gmail");
      console.log(
        "   4. App Password is generated from Google Account settings"
      );
    }

    return false;
  }
};

// Run the check
checkEmailConfiguration().then((isValid) => {
  console.log("");
  if (isValid) {
    console.log("🚀 Your forgot password system is ready!");
  } else {
    console.log(
      "⚠️  Please fix email configuration before using forgot password feature"
    );
  }
  console.log("================================");
});
