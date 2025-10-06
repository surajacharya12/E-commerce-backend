const mongoose = require("mongoose");

const storeSchema = new mongoose.Schema(
  {
    storeName: {
      type: String,
      required: [true, "Store name is required"],
      trim: true,
    },
    storeManagerName: {
      type: String,
      required: [true, "Manager name is required"],
      trim: true,
    },
    storeEmail: {
      type: String,
      required: [true, "Email is required"],
      unique: true, // KEEP THIS
      lowercase: true,
      match: [
        /^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/,
        "Please enter a valid email",
      ],
    },
    storePhoneNumber: {
      type: String,
      required: [true, "Phone number is required"],
      trim: true,
    },
    storeDescription: {
      type: String,
      trim: true,
    },
    storeLocation: {
      type: String,
      required: [true, "Location is required"],
      trim: true,
    },
    storeManagerPhoto: {
      type: String,
      default: "no_url",
    },
    storeBadge: {
      type: String,
      default: "no_url",
    },
    gradientColor: {
      type: String,
      default: "#2697FF",
    },
    isActive: {
      type: Boolean,
      default: true,
    },
    revenue: {
      type: Number,
      default: 0.0,
      min: 0,
    },
  },
  { timestamps: true }
);

// REMOVE THIS LINE to fix the "Duplicate schema index" warning,
// as the unique index is already defined via { unique: true } above.
// storeSchema.index({ storeEmail: 1 });
storeSchema.index({ isActive: 1 }); // KEEP this for efficient queries

storeSchema.virtual("status").get(function () {
  return this.isActive ? "Active" : "Inactive";
});

storeSchema.methods.updateRevenue = function (amount) {
  this.revenue += amount;
  return this.save();
};

storeSchema.statics.getActiveStores = function () {
  return this.find({ isActive: true });
};

const Store = mongoose.model("Store", storeSchema);

module.exports = Store;
