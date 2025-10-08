const nodemailer = require("nodemailer");
require("dotenv").config();

const testEmail = async () => {
  try {
    const transporter = nodemailer.createTransport({
      service: "gmail",
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS,
      },
    });

    const testCode = "123456";
    const testEmail = process.env.EMAIL_USER; // Send to yourself for testing

    const mailOptions = {
      from: process.env.EMAIL_USER,
      to: testEmail,
      subject: "Test - Password Reset Verification Code",
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
          <h1 style="color: #4F46E5;">ShopEase - Test Email</h1>
          <p>This is a test email for the forgot password functionality.</p>
          <div style="background: #4F46E5; color: white; padding: 20px; border-radius: 10px; text-align: center;">
            <h2>Test Verification Code</h2>
            <span style="font-size: 24px; font-weight: bold;">${testCode}</span>
          </div>
          <p>If you received this email, your email configuration is working correctly!</p>
        </div>
      `,
    };

    const result = await transporter.sendMail(mailOptions);
    console.log("✅ Test email sent successfully!");
    console.log("Message ID:", result.messageId);
  } catch (error) {
    console.error("❌ Test email failed:");
    console.error(error.message);

    if (error.code === "EAUTH") {
      console.log("\n🔧 Authentication failed. Please check:");
      console.log("1. EMAIL_USER is set correctly in .env");
      console.log(
        "2. EMAIL_PASS is your Gmail App Password (not regular password)"
      );
      console.log("3. 2-Factor Authentication is enabled on Gmail");
      console.log("4. App Password is generated from Google Account settings");
    }
  }
};

console.log("🧪 Testing email configuration...");
console.log("EMAIL_USER:", process.env.EMAIL_USER ? "✅ Set" : "❌ Not set");
console.log("EMAIL_PASS:", process.env.EMAIL_PASS ? "✅ Set" : "❌ Not set");
console.log("");

testEmail();
