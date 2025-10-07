#!/usr/bin/env node

const fs = require("fs");
const path = require("path");

console.log("🚀 Setting up production environment...\n");

// Check if required files exist
const requiredFiles = [
  "package.json",
  "index.js",
  "vercel.json",
  ".env.example",
];

const missingFiles = requiredFiles.filter((file) => !fs.existsSync(file));

if (missingFiles.length > 0) {
  console.error("❌ Missing required files:", missingFiles.join(", "));
  process.exit(1);
}

// Check if .env exists
if (!fs.existsSync(".env")) {
  console.log("⚠️  No .env file found. Creating from .env.example...");
  fs.copyFileSync(".env.example", ".env");
  console.log(
    "✅ Created .env file. Please update it with your actual values."
  );
}

// Check package.json for required dependencies
const packageJson = JSON.parse(fs.readFileSync("package.json", "utf8"));
const requiredDeps = [
  "express",
  "mongoose",
  "cors",
  "dotenv",
  "body-parser",
  "express-async-handler",
];

const missingDeps = requiredDeps.filter(
  (dep) => !packageJson.dependencies[dep] && !packageJson.devDependencies[dep]
);

if (missingDeps.length > 0) {
  console.error("❌ Missing required dependencies:", missingDeps.join(", "));
  console.log("Run: npm install", missingDeps.join(" "));
  process.exit(1);
}

// Check environment variables
console.log("🔍 Checking environment configuration...");

const envExample = fs.readFileSync(".env.example", "utf8");
const envVars = envExample.match(/^[A-Z_]+=.*/gm) || [];
const requiredEnvVars = envVars.map((line) => line.split("=")[0]);

console.log("📋 Required environment variables:");
requiredEnvVars.forEach((varName) => {
  const hasValue =
    process.env[varName] && process.env[varName] !== "your-value-here";
  console.log(`   ${hasValue ? "✅" : "❌"} ${varName}`);
});

console.log("\n🎯 Production Checklist:");
console.log("   ✅ Files structure verified");
console.log("   ✅ Dependencies checked");
console.log("   ✅ Environment template ready");
console.log("   📝 Update .env with actual values");
console.log("   📝 Set environment variables in deployment platform");
console.log("   📝 Update FRONTEND_URL in production");

console.log("\n🚀 Ready for deployment!");
console.log("   Run: npm run start (for testing)");
console.log("   Run: ./deploy.sh (for Vercel deployment)");
console.log("   Or follow DEPLOYMENT.md for other platforms");

console.log("\n📚 Documentation:");
console.log("   - DEPLOYMENT.md - Deployment guide");
console.log("   - API_ENDPOINTS.md - API documentation");
console.log("   - .env.example - Environment variables reference");
