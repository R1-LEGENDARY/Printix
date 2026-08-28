const express = require("express");
const { requireAuth } = require("../middleware/authMiddleware");
const { createPaymentSession, getPaymentStatus } = require("../controllers/paymentController");

const router = express.Router();

router.post("/checkout-session", requireAuth, createPaymentSession);
router.get("/status/:orderId", requireAuth, getPaymentStatus);

module.exports = router;