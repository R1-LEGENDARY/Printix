const prisma = require("../db");

function serialize(r) {
  return {
    id: r.id.toString(),
    rating: r.rating,
    comment: r.comment,
    isApproved: r.isApproved,
    createdAt: r.createdAt,
    reviewerName: r.user.name,
    reviewerEmail: r.user.email,
    productName: r.product.name,
    verifiedPurchase: !!r.orderItemId,
  };
}

async function listAllReviews(req, res) {
  try {
    const { status } = req.query;
    const where =
      status === "pending"
        ? { isApproved: false }
        : status === "approved"
          ? { isApproved: true }
          : {};

    const reviews = await prisma.review.findMany({
      where,
      include: {
        user: { select: { name: true, email: true } },
        product: { select: { name: true } },
      },
      orderBy: { createdAt: "desc" },
    });
    res.json(reviews.map(serialize));
  } catch (error) {
    res
      .status(500)
      .json({ message: "Failed to fetch reviews.", error: error.message });
  }
}

async function setReviewApproval(req, res) {
  try {
    const id = BigInt(req.params.id);
    const { isApproved } = req.body;
    const review = await prisma.review.update({
      where: { id },
      data: { isApproved: !!isApproved },
      include: {
        user: { select: { name: true, email: true } },
        product: { select: { name: true } },
      },
    });
    res.json(serialize(review));
  } catch (error) {
    res
      .status(500)
      .json({ message: "Failed to update review.", error: error.message });
  }
}

async function deleteReview(req, res) {
  try {
    await prisma.review.delete({ where: { id: BigInt(req.params.id) } });
    res.status(204).send();
  } catch (error) {
    res
      .status(500)
      .json({ message: "Failed to delete review.", error: error.message });
  }
}

module.exports = { listAllReviews, setReviewApproval, deleteReview };
