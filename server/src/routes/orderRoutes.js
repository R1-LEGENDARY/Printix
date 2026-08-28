const express = require("express");
const { requireAuth } = require("../middleware/authMiddleware");
const { createOrder, listMyOrders } = require("../controllers/orderController");

const router = express.Router();

router.use(requireAuth);

router.post("/", createOrder);
router.get("/", listMyOrders);

module.exports = router;