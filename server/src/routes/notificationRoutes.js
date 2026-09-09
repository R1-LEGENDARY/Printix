const express = require("express");
const { requireAuth } = require("../middleware/authMiddleware");
const { listNotifications, markRead, markAllRead } = require("../controllers/notificationController");

const router = express.Router();

router.use(requireAuth);
router.get("/", listNotifications);
router.patch("/:id/read", markRead);
router.patch("/read-all", markAllRead);

module.exports = router;