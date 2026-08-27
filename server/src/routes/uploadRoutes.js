const express = require("express");
const { requireAuth } = require("../middleware/authMiddleware");
const { upload } = require("../middleware/upload");

const router = express.Router();

router.post("/", requireAuth, upload.single("file"), (req, res) => {
  if (!req.file) {
    return res.status(400).json({ message: "No file uploaded." });
  }

  res.status(201).json({
    fileUrl: `/uploads/${req.file.filename}`,
    originalFilename: req.file.originalname,
    mimeType: req.file.mimetype,
  });
});

module.exports = router;