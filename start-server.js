#!/usr/bin/env node

const { spawn } = require("child_process");
const http = require("http");

console.log("🚀 Starting server with comprehensive checks...\n");

// Test database connection first
console.log("1️⃣ Testing database connection...");
const dbTest = spawn("npm", ["run", "test-connection"], { stdio: "inherit" });

dbTest.on("close", (code) => {
  if (code === 0) {
    console.log("\n2️⃣ Starting server...");

    // Start the server
    const server = spawn("node", ["index.js"], { stdio: "inherit" });

    // Wait a moment for server to start, then test it
    setTimeout(() => {
      console.log("\n3️⃣ Testing server health...");

      const req = http.get("http://localhost:3001/health", (res) => {
        let data = "";
        res.on("data", (chunk) => (data += chunk));
        res.on("end", () => {
          try {
            const result = JSON.parse(data);
            console.log("✅ Server health check passed!");
            console.log(`   Status: ${res.statusCode}`);
            console.log(`   Environment: ${result.environment}`);
            console.log(`   Database: ${result.database}`);
            console.log("\n🎉 Server is running successfully!");
            console.log("🔗 API available at: http://localhost:3001");
            console.log("🔗 Health check: http://localhost:3001/health");
            console.log("\n💡 Press Ctrl+C to stop the server");
          } catch (e) {
            console.log("⚠️  Server started but health check failed");
          }
        });
      });

      req.on("error", (err) => {
        console.log("⚠️  Server may still be starting up...");
      });

      req.setTimeout(5000, () => {
        console.log("⚠️  Health check timeout - server may still be starting");
      });
    }, 3000);

    // Handle server process
    server.on("close", (code) => {
      console.log(`\n🛑 Server stopped with code ${code}`);
      process.exit(code);
    });

    // Handle Ctrl+C
    process.on("SIGINT", () => {
      console.log("\n🛑 Stopping server...");
      server.kill("SIGINT");
    });
  } else {
    console.log(
      "\n❌ Database connection test failed. Please fix database issues before starting server."
    );
    process.exit(1);
  }
});
