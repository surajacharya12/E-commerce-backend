#!/usr/bin/env node

const http = require("http");
const https = require("https");

// Test local server
function testLocal() {
  return new Promise((resolve, reject) => {
    const req = http.get("http://localhost:3001/health", (res) => {
      let data = "";
      res.on("data", (chunk) => (data += chunk));
      res.on("end", () => {
        try {
          const result = JSON.parse(data);
          resolve({ status: res.statusCode, data: result });
        } catch (e) {
          reject(e);
        }
      });
    });

    req.on("error", reject);
    req.setTimeout(5000, () => reject(new Error("Timeout")));
  });
}

// Test deployed server
function testDeployed(url) {
  return new Promise((resolve, reject) => {
    const client = url.startsWith("https") ? https : http;
    const req = client.get(`${url}/health`, (res) => {
      let data = "";
      res.on("data", (chunk) => (data += chunk));
      res.on("end", () => {
        try {
          const result = JSON.parse(data);
          resolve({ status: res.statusCode, data: result });
        } catch (e) {
          reject(e);
        }
      });
    });

    req.on("error", reject);
    req.setTimeout(10000, () => reject(new Error("Timeout")));
  });
}

async function runTests() {
  console.log("🧪 Testing API deployment...\n");

  // Test local development server
  console.log("📍 Testing local server (http://localhost:3001)...");
  try {
    const localResult = await testLocal();
    console.log("✅ Local server is working!");
    console.log(`   Status: ${localResult.status}`);
    console.log(`   Environment: ${localResult.data.environment}`);
    console.log(`   Database: ${localResult.data.database}`);
  } catch (error) {
    console.log("❌ Local server test failed:", error.message);
    console.log('   Make sure to run "npm start" in another terminal');
  }

  console.log("");

  // Test deployed server if URL provided
  const deployedUrl = process.argv[2];
  if (deployedUrl) {
    console.log(`📍 Testing deployed server (${deployedUrl})...`);
    try {
      const deployedResult = await testDeployed(deployedUrl);
      console.log("✅ Deployed server is working!");
      console.log(`   Status: ${deployedResult.status}`);
      console.log(`   Environment: ${deployedResult.data.environment}`);
      console.log(`   Database: ${deployedResult.data.database}`);
      console.log(`   Uptime: ${Math.round(deployedResult.data.uptime)}s`);
    } catch (error) {
      console.log("❌ Deployed server test failed:", error.message);
    }
  } else {
    console.log("💡 To test deployed server, run:");
    console.log(
      "   node test-deployment.js https://your-api-domain.vercel.app"
    );
  }

  console.log("\n🎯 Test completed!");
}

runTests().catch(console.error);
