const express = require("express");
const { requireAuth } = require("../middleware/authMiddleware");
const { listAddresses, createAddress } = require("../controllers/addressController");

const router = express.Router();

router.use(requireAuth);

router.get("/", listAddresses);
router.post("/", createAddress);

module.exports = router;