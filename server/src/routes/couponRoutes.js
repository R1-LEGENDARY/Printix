const express = require("express");
const { requireAuth } = require("../middleware/authMiddleware");
const { previewCoupon } = require("../controllers/couponController");

const router = express.Router();

router.post("/preview", requireAuth, previewCoupon);

module.exports = router;