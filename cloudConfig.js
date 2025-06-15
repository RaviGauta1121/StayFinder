const cloudinary = require("cloudinary").v2;
const { CloudinaryStorage } = require("multer-storage-cloudinary");

cloudinary.config({
  cloud_name: process.env.CLOUD_NAME,
  api_key: process.env.CLOUD_API_KEY, // ✅ typo fixed
  api_secret: process.env.CLOUD_API_SECRET,
});

const storage = new CloudinaryStorage({
  cloudinary: cloudinary,
  params: {
    folder: "StayFinder_DEV",
    allowedFormats: ["png", "jpg", "jpeg"], // optional: consider renaming to "allowed_formats"
  },
});

module.exports = {
  cloudinary,
  storage,
};
