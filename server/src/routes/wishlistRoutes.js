const express = require("express");
const { requireAuth } = require("../middleware/authMiddleware");
const { listWishlist, addToWishlist, removeFromWishlist } = require("../controllers/wishlistController");

const router = express.Router();

router.use(requireAuth);

router.get("/", listWishlist);
router.post("/", addToWishlist);
router.delete("/:variantId", removeFromWishlist);

module.exports = router;