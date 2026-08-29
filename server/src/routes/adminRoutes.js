const express = require("express");
const { requireAuth } = require("../middleware/authMiddleware");
const { requireAdmin } = require("../middleware/requireAdmin");
const { getMetrics } = require("../controllers/adminController");
const {
  listAllProducts,
  getProductForAdmin,
  createProduct,
  updateProduct,
  toggleActive,
  upsertVariant,
} = require("../controllers/adminProductController");
const { listOrders, getOrder, updateOrderStatus } = require("../controllers/adminOrderController");
const {
  listCategories,
  createCategory,
  updateCategory,
  deleteCategory,
} = require("../controllers/adminCategoryController");
const {
  addProductImage,
  deleteProductImage,
  setPrimaryImage,
  upsertPrintableArea,
  adjustStock,
  uploadMockupTemplate,
  savePerspectiveConfig,
  uploadDisplacementMap,
} = require("../controllers/adminProductController");

const router = express.Router();

router.use(requireAuth, requireAdmin);

router.get("/metrics", getMetrics);

router.get("/products", listAllProducts);
router.get("/products/:id", getProductForAdmin);
router.post("/products", createProduct);
router.put("/products/:id", updateProduct);
router.patch("/products/:id/toggle-active", toggleActive);
router.post("/products/:id/variants", upsertVariant);
router.post("/products/:id/printable-areas", upsertPrintableArea);
router.patch("/variants/:variantId/stock", adjustStock);
router.post(
  "/printable-areas/:areaId/mockup-template",
  require("../middleware/upload").upload.single("file"),
  uploadMockupTemplate
);
router.put("/printable-areas/:areaId/perspective", savePerspectiveConfig);
router.post(
  "/printable-areas/:areaId/displacement-map",
  require("../middleware/upload").upload.single("file"),
  uploadDisplacementMap
);

router.post("/products/:id/images", require("../middleware/upload").upload.single("file"), addProductImage);
router.delete("/products/:productId/images/:imageId", deleteProductImage);
router.patch("/products/:productId/images/:imageId/primary", setPrimaryImage);

router.get("/categories", listCategories);
router.post("/categories", createCategory);
router.put("/categories/:id", updateCategory);
router.delete("/categories/:id", deleteCategory);

router.get("/orders", listOrders);
router.get("/orders/:id", getOrder);
router.patch("/orders/:id/status", updateOrderStatus);

module.exports = router;