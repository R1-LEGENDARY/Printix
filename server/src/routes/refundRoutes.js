const express = require("express");
const { requireAuth } = require("../middleware/authMiddleware");
const { requestRefund, listMyRefunds } = require("../controllers/refundController");

const router = express.Router();

router.use(requireAuth);
router.post("/", requestRefund);
router.get("/", listMyRefunds);

module.exports = router;