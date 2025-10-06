const express = require("express");
const router = express.Router();
const Poster = require("../model/poster");
const { posterUpload, cloudinary } = require("../config/cloudinary");
const multer = require("multer");
const asyncHandler = require("express-async-handler");

// Get all posters
router.get(
  "/",
  asyncHandler(async (req, res) => {
    try {
      const posters = await Poster.find({}).sort({ createdAt: -1 });
      res.json({
        success: true,
        message: "Posters retrieved successfully.",
        data: posters,
      });
    } catch (error) {
      res.status(500).json({ success: false, message: error.message });
    }
  })
);

// Get a poster by ID
router.get(
  "/:id",
  asyncHandler(async (req, res) => {
    try {
      const posterID = req.params.id;
      const poster = await Poster.findById(posterID);
      if (!poster) {
        return res
          .status(404)
          .json({ success: false, message: "Poster not found." });
      }
      res.json({
        success: true,
        message: "Poster retrieved successfully.",
        data: poster,
      });
    } catch (error) {
      res.status(500).json({ success: false, message: error.message });
    }
  })
);

// Create a new poster
router.post(
  "/",
  asyncHandler(async (req, res) => {
    const contentType = req.get("Content-Type");

    if (contentType && contentType.includes("multipart/form-data")) {
      // Handle multipart form data with image
      posterUpload.single("img")(req, res, async function (err) {
        if (err instanceof multer.MulterError) {
          if (err.code === "LIMIT_FILE_SIZE") {
            err.message = "File size is too large. Maximum filesize is 5MB.";
          }
          return res.json({ success: false, message: err.message });
        } else if (err) {
          return res.json({ success: false, message: err.message });
        }

        const { posterName } = req.body;
        let imageUrl = "no_url";

        if (req.file) {
          imageUrl = req.file.path; // Cloudinary URL
        }

        if (!posterName) {
          return res
            .status(400)
            .json({ success: false, message: "Poster name is required." });
        }

        try {
          const newPoster = new Poster({
            posterName: posterName,
            imageUrl: imageUrl,
          });
          await newPoster.save();
          res.json({
            success: true,
            message: "Poster created successfully.",
            data: newPoster,
          });
        } catch (error) {
          console.error("Error creating Poster:", error);
          res.status(500).json({ success: false, message: error.message });
        }
      });
    } else {
      // Handle JSON data (no image)
      try {
        const { posterName, imageUrl } = req.body;

        if (!posterName) {
          return res
            .status(400)
            .json({ success: false, message: "Poster name is required." });
        }

        const newPoster = new Poster({
          posterName: posterName,
          imageUrl: imageUrl || "no_url",
        });
        await newPoster.save();
        res.json({
          success: true,
          message: "Poster created successfully.",
          data: newPoster,
        });
      } catch (error) {
        console.error("Error creating Poster:", error);
        res.status(500).json({ success: false, message: error.message });
      }
    }
  })
);

// Update a poster
router.put(
  "/:id",
  asyncHandler(async (req, res) => {
    const posterID = req.params.id;
    const contentType = req.get("Content-Type");

    if (contentType && contentType.includes("multipart/form-data")) {
      // Handle multipart form data with image
      posterUpload.single("img")(req, res, async function (err) {
        if (err instanceof multer.MulterError) {
          if (err.code === "LIMIT_FILE_SIZE") {
            err.message = "File size is too large. Maximum filesize is 5MB.";
          }
          return res.json({ success: false, message: err.message });
        } else if (err) {
          return res.json({ success: false, message: err.message });
        }

        try {
          const poster = await Poster.findById(posterID);
          if (!poster) {
            return res
              .status(404)
              .json({ success: false, message: "Poster not found." });
          }

          const { posterName } = req.body;

          if (posterName) poster.posterName = posterName;

          if (req.file) {
            // Delete old image from Cloudinary if it exists
            if (poster.imageUrl && poster.imageUrl !== "no_url") {
              try {
                const publicId = poster.imageUrl.split("/").pop().split(".")[0];
                await cloudinary.uploader.destroy(
                  `online_store/posters/${publicId}`
                );
              } catch (cloudinaryError) {
                console.log(
                  "Error deleting old poster image:",
                  cloudinaryError
                );
              }
            }
            poster.imageUrl = req.file.path; // Cloudinary URL
          }

          await poster.save();
          res.json({
            success: true,
            message: "Poster updated successfully.",
            data: poster,
          });
        } catch (error) {
          res.status(500).json({ success: false, message: error.message });
        }
      });
    } else {
      // Handle JSON data
      try {
        const poster = await Poster.findById(posterID);
        if (!poster) {
          return res
            .status(404)
            .json({ success: false, message: "Poster not found." });
        }

        const { posterName, imageUrl } = req.body;

        if (posterName) poster.posterName = posterName;
        if (imageUrl) poster.imageUrl = imageUrl;

        await poster.save();
        res.json({
          success: true,
          message: "Poster updated successfully.",
          data: poster,
        });
      } catch (error) {
        res.status(500).json({ success: false, message: error.message });
      }
    }
  })
);

// Delete a poster
router.delete(
  "/:id",
  asyncHandler(async (req, res) => {
    const posterID = req.params.id;
    try {
      const poster = await Poster.findById(posterID);
      if (!poster) {
        return res
          .status(404)
          .json({ success: false, message: "Poster not found." });
      }

      // Delete image from Cloudinary if it exists
      if (poster.imageUrl && poster.imageUrl !== "no_url") {
        try {
          const publicId = poster.imageUrl.split("/").pop().split(".")[0];
          await cloudinary.uploader.destroy(`online_store/posters/${publicId}`);
        } catch (cloudinaryError) {
          console.log("Error deleting image from Cloudinary:", cloudinaryError);
        }
      }

      await Poster.findByIdAndDelete(posterID);
      res.json({ success: true, message: "Poster deleted successfully." });
    } catch (error) {
      res.status(500).json({ success: false, message: error.message });
    }
  })
);

module.exports = router;
