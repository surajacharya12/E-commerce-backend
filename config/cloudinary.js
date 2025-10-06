const cloudinary = require("cloudinary").v2;
const { CloudinaryStorage } = require("multer-storage-cloudinary");
const multer = require("multer");
require("dotenv").config();

// Configure Cloudinary
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

// Function to create Cloudinary storage
const createCloudinaryStorage = (folder) => {
  return new CloudinaryStorage({
    cloudinary: cloudinary,
    params: {
      folder: folder,
      allowed_formats: ["jpg", "jpeg", "png", "gif", "webp", "avif"],
      transformation: [
        { width: 1000, height: 1000, crop: "limit" },
        { quality: "auto" },
      ],
    },
  });
};

// Multer instances for different uploads
const productUpload = multer({
  storage: createCloudinaryStorage("online_store/products"),
  limits: { fileSize: 5 * 1024 * 1024 },
});

const categoryUpload = multer({
  storage: createCloudinaryStorage("online_store/categories"),
  limits: { fileSize: 5 * 1024 * 1024 },
});

const brandUpload = multer({
  storage: createCloudinaryStorage("online_store/brands"),
  limits: { fileSize: 5 * 1024 * 1024 },
});

const posterUpload = multer({
  storage: createCloudinaryStorage("online_store/posters"),
  limits: { fileSize: 5 * 1024 * 1024 },
});

const storeUpload = multer({
  storage: createCloudinaryStorage("online_store/stores"),
  limits: { fileSize: 5 * 1024 * 1024 },
});

const discountUpload = multer({
  storage: createCloudinaryStorage("online_store/discounts"),
  limits: { fileSize: 5 * 1024 * 1024 },
});

const notificationUpload = multer({
  storage: createCloudinaryStorage("online_store/notifications"),
  limits: { fileSize: 5 * 1024 * 1024 },
});
const subcategoryUpload = multer({
  storage: createCloudinaryStorage("online_store/subcategories"),
  limits: { fileSize: 5 * 1024 * 1024 },
});
module.exports = {
  cloudinary,
  productUpload,
  categoryUpload,
  brandUpload,
  posterUpload,
  storeUpload,
  discountUpload,
  notificationUpload,
  subcategoryUpload,
};
