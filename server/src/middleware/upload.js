const multer = require("multer");
const path = require("path");
const fs = require("fs");

const uploadDir = path.join(__dirname, "../../uploads");
if (!fs.existsSync(uploadDir)) fs.mkdirSync(uploadDir, { recursive: true });

function safeSegment(value) {
  return String(value || "general").replace(/[^a-z0-9_-]/gi, "-").toLowerCase();
}

function createUpload(folder, getPrefix = () => folder) {
  const folderDir = path.join(uploadDir, folder);
  if (!fs.existsSync(folderDir)) fs.mkdirSync(folderDir, { recursive: true });

  const storage = multer.diskStorage({
    destination: (req, file, cb) => cb(null, folderDir),
    filename: (req, file, cb) => {
      const unique = `${Date.now()}-${Math.round(Math.random() * 1e9)}`;
      const prefix = safeSegment(getPrefix(req, file));
      cb(null, `${prefix}-${unique}${path.extname(file.originalname).toLowerCase()}`);
    },
  });

  return multer({
    storage,
    fileFilter,
    limits: { fileSize: 10 * 1024 * 1024 },
  });
}

const allowedTypes = ["image/jpeg", "image/png", "image/webp"];

function fileFilter(req, file, cb) {
  if (allowedTypes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error("Only JPG, PNG, and WebP images are allowed."));
  }
}

const upload = createUpload("general");
const designUpload = createUpload("designs", (req) => `design-${req.user?.userId || "user"}`);
const productImageUpload = createUpload("product-images", (req) => `product-${req.params.id || "unknown"}`);
const mockupUpload = createUpload("mockups", (req) => `area-${req.params.areaId || "unknown"}`);
const displacementMapUpload = createUpload("displacement-maps", (req) => `area-${req.params.areaId || "unknown"}`);

module.exports = { upload, designUpload, productImageUpload, mockupUpload, displacementMapUpload };