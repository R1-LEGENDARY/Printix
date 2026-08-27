const express = require("express");
const { listProducts, getProductBySlug } = require("../controllers/productController");

const router = express.Router();

router.get("/", listProducts);
router.get("/:slug", getProductBySlug);

module.exports = router;