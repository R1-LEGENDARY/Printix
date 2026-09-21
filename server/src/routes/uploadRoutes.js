const express = require("express");
const { requireAuth } = require("../middleware/authMiddleware");
const { designUpload } = require("../middleware/upload");
const { storeUploadedFile } = require("../services/storage");

const router = express.Router();

router.post("/", requireAuth, designUpload.single("file"), async (req, res) => {
  if (!req.file) {
    return res.status(400).json({ message: "No file uploaded." });
  }

  const fileUrl = await storeUploadedFile(
    req.file,
    "designs",
    `design-${req.user.userId}`,
  );

  res.status(201).json({
    fileUrl,
    originalFilename: req.file.originalname,
    mimeType: req.file.mimetype,
  });
});

module.exports = router;
