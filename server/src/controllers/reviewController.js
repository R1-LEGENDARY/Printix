const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

/*
 * DOCU: Serializes a review row (with its images and reviewer name) for API responses.
 * @param {Object} r - Prisma review record, including images and user relations
 * @returns {Object} - Plain-object review safe for JSON.stringify (no BigInt)
 *
 * Author: JC
 */
function serializeReview(r) {
  return {
    id: r.id.toString(),
    rating: r.rating,
    comment: r.comment,
    isApproved: r.isApproved,
    createdAt: r.createdAt,
    reviewerName: r.user.name,
    verifiedPurchase: !!r.orderItemId,
    images: r.images.map((img) => ({ id: img.id.toString(), imageUrl: img.imageUrl })),
  };
}

/*
 * DOCU: Lists approved reviews for a product, plus the aggregate rating.
 * @param {Object} req - Express request; params.productId
 * @param {Object} res - Express response
 * @returns {void} - Sends { reviews, averageRating, totalCount } as JSON
 *
 * Author: JC
 */
async function listProductReviews(req, res) {
  try {
    const productId = BigInt(req.params.productId);

    const [reviews, aggregate] = await Promise.all([
      prisma.review.findMany({
        where: { productId, isApproved: true },
        include: { user: { select: { name: true } }, images: true },
        orderBy: { createdAt: "desc" },
      }),
      prisma.review.aggregate({
        where: { productId, isApproved: true },
        _avg: { rating: true },
        _count: true,
      }),
    ]);

    res.json({
      reviews: reviews.map(serializeReview),
      averageRating: aggregate._avg.rating || 0,
      totalCount: aggregate._count,
    });
  } catch (error) {
    res.status(500).json({ message: "Failed to fetch reviews.", error: error.message });
  }
}

/*
 * DOCU: Creates a review and optionally links it to an eligible order item owned by
 * the requesting user. Linked reviews are marked as verified purchases and cannot be duplicated.
 * @param {Object} req - Express request; body.productId, body.orderItemId, body.rating, body.comment
 * @param {Object} res - Express response
 * @returns {void} - Sends the created review as JSON, or an error status
 * @throws {Error} 400 if rating missing/out of range, 403 if orderItem isn't the user's, 409 if already reviewed
 *
 * Author: JC
 */
async function createReview(req, res) {
  try {
    const userId = BigInt(req.user.userId);
    const { productId, orderItemId, rating, comment } = req.body;

    if (!productId || !rating || rating < 1 || rating > 5) {
      return res.status(400).json({ message: "productId and a rating from 1-5 are required." });
    }

    let verifiedOrderItemId = null;
    if (orderItemId) {
      const orderItem = await prisma.orderItem.findUnique({
        where: { id: BigInt(orderItemId) },
        include: { order: true },
      });
      if (!orderItem || orderItem.order.userId !== userId) {
        return res.status(403).json({ message: "That order item doesn't belong to you." });
      }
      const existing = await prisma.review.findFirst({ where: { orderItemId: orderItem.id } });
      if (existing) {
        return res.status(409).json({ message: "You've already reviewed this purchase." });
      }
      verifiedOrderItemId = orderItem.id;
    }

    const review = await prisma.review.create({
      data: {
        userId,
        productId: BigInt(productId),
        orderItemId: verifiedOrderItemId,
        rating,
        comment: comment || null,
        isApproved: true,
      },
      include: { user: { select: { name: true } }, images: true },
    });

    res.status(201).json(serializeReview(review));
  } catch (error) {
    res.status(500).json({ message: "Failed to create review.", error: error.message });
  }
}

/*
 * DOCU: Lists order items the current user has purchased for a product but hasn't
 * reviewed yet — used to gate the "write a review" button to verified buyers.
 * @param {Object} req - Express request; params.productId
 * @param {Object} res - Express response
 * @returns {void} - Sends an array of reviewable order items as JSON
 *
 * Author: JC
 */
async function getReviewableOrderItems(req, res) {
  try {
    const userId = BigInt(req.user.userId);
    const productId = BigInt(req.params.productId);

    const items = await prisma.orderItem.findMany({
      where: {
        order: { userId, status: { in: ["paid", "processing", "printing", "shipped", "delivered"] } },
        variant: { productId },
        reviews: { none: {} },
      },
      select: { id: true, variantLabel: true, order: { select: { orderNumber: true } } },
    });

    res.json(items.map((i) => ({ id: i.id.toString(), variantLabel: i.variantLabel, orderNumber: i.order.orderNumber })));
  } catch (error) {
    res.status(500).json({ message: "Failed to fetch reviewable items.", error: error.message });
  }
}

module.exports = { listProductReviews, createReview, getReviewableOrderItems };