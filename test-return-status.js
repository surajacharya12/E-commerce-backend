const axios = require("axios");

// Test the return status update endpoint
async function testReturnStatusUpdate() {
  try {
    console.log("🧪 Testing Return Status Update API...");

    const baseURL = "http://localhost:5000";

    // First, let's test if the server is running
    try {
      const healthCheck = await axios.get(`${baseURL}/health`);
      console.log("✅ Server is running:", healthCheck.data);
    } catch (err) {
      console.log(
        "❌ Server not running. Please start the server first with: npm run dev"
      );
      return;
    }

    // Test getting all returns first
    try {
      const returnsResponse = await axios.get(`${baseURL}/returns/admin/all`);
      console.log("📦 Returns found:", returnsResponse.data.data?.length || 0);

      if (returnsResponse.data.data && returnsResponse.data.data.length > 0) {
        const firstReturn = returnsResponse.data.data[0];
        console.log("🎯 Testing with return:", {
          id: firstReturn._id,
          returnNumber: firstReturn.returnNumber,
          currentStatus: firstReturn.returnStatus,
        });

        // Test status update
        const updateResponse = await axios.put(
          `${baseURL}/returns/${firstReturn._id}/status`,
          {
            status: "approved",
            adminNotes: "Test status update from API test",
            processedBy: "test-admin",
            previousStatus: firstReturn.returnStatus,
            timestamp: new Date().toISOString(),
          }
        );

        console.log("✅ Status update successful:", updateResponse.data);

        // Revert back to original status
        await axios.put(`${baseURL}/returns/${firstReturn._id}/status`, {
          status: firstReturn.returnStatus,
          adminNotes: "Reverted back to original status",
          processedBy: "test-admin",
        });

        console.log("🔄 Reverted back to original status");
      } else {
        console.log(
          "⚠️  No returns found to test with. Please create a return first."
        );
      }
    } catch (err) {
      console.error(
        "❌ Error testing returns API:",
        err.response?.data || err.message
      );
    }
  } catch (error) {
    console.error("❌ Test failed:", error.message);
  }
}

// Run the test
testReturnStatusUpdate();
