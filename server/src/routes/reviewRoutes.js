const express = require("express");
const { requireAuth } = require("../middleware/authMiddleware");
const { listProductReviews, createReview, getReviewableOrderItems } = require("../controllers/reviewController");

const router = express.Router();

router.get("/product/:productId", listProductReviews);
router.get("/reviewable/:productId", requireAuth, getReviewableOrderItems);
router.post("/", requireAuth, createReview);

module.exports = router;