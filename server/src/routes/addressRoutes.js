const express = require("express");
const { requireAuth } = require("../middleware/authMiddleware");
const { listAddresses, createAddress, updateAddress, deleteAddress, setDefaultAddress } = require("../controllers/addressController");

const router = express.Router();

router.use(requireAuth);

router.get("/", listAddresses);
router.post("/", createAddress);
router.put("/:id", updateAddress);
router.delete("/:id", deleteAddress);
router.patch("/:id/default", setDefaultAddress);

module.exports = router;