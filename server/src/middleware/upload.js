const multer = require("multer");
function createUpload() {
  return multer({
    storage: multer.memoryStorage(),
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

const upload = createUpload();
const designUpload = createUpload();
const productImageUpload = createUpload();
const mockupUpload = createUpload();
const displacementMapUpload = createUpload();

module.exports = {
  upload,
  designUpload,
  productImageUpload,
  mockupUpload,
  displacementMapUpload,
};
