const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

/*
 * DOCU: Shared validation used both to preview a coupon in checkout and to
 * actually apply it when the order is placed — keeps the two paths consistent.
 * @param {string} code - The coupon code as entered by the customer
 * @param {BigInt} userId - The requesting user's id
 * @param {number} subtotal - Cart subtotal to check against minOrderAmount
 * @returns {Object} - { coupon, discountAmount } or throws with a status/message
 *
 * Author: JC
 */
async function validateAndComputeDiscount(code, userId, subtotal) {
  const coupon = await prisma.coupon.findUnique({ where: { code: code.toUpperCase().trim() } });

  if (!coupon || !coupon.isActive) {
    const err = new Error("This coupon code isn't valid.");
    err.status = 404;
    throw err;
  }

  const now = new Date();
  if (coupon.startsAt && now < coupon.startsAt) {
    const err = new Error("This coupon isn't active yet.");
    err.status = 400;
    throw err;
  }
  if (coupon.expiresAt && now > coupon.expiresAt) {
    const err = new Error("This coupon has expired.");
    err.status = 400;
    throw err;
  }
  if (coupon.minOrderAmount && subtotal < Number(coupon.minOrderAmount)) {
    const err = new Error(`This coupon requires a minimum order of ₱${coupon.minOrderAmount}.`);
    err.status = 400;
    throw err;
  }

  if (coupon.usageLimit != null) {
    const totalUses = await prisma.couponRedemption.count({ where: { couponId: coupon.id } });
    if (totalUses >= coupon.usageLimit) {
      const err = new Error("This coupon has reached its usage limit.");
      err.status = 400;
      throw err;
    }
  }

  if (coupon.usageLimitPerUser != null) {
    const userUses = await prisma.couponRedemption.count({ where: { couponId: coupon.id, userId } });
    if (userUses >= coupon.usageLimitPerUser) {
      const err = new Error("You've already used this coupon the maximum number of times.");
      err.status = 400;
      throw err;
    }
  }

  const discountAmount =
    coupon.discountType === "percent"
      ? subtotal * (Number(coupon.value) / 100)
      : Math.min(Number(coupon.value), subtotal);

  return { coupon, discountAmount };
}

async function previewCoupon(req, res) {
  try {
    const { code, subtotal } = req.body;
    const userId = BigInt(req.user.userId);

    if (!code || subtotal == null) {
      return res.status(400).json({ message: "code and subtotal are required." });
    }

    const { discountAmount } = await validateAndComputeDiscount(code, userId, Number(subtotal));
    res.json({ valid: true, discountAmount: Number(discountAmount.toFixed(2)) });
  } catch (error) {
    res.status(error.status || 500).json({ message: error.message || "Failed to validate coupon." });
  }
}

module.exports = { previewCoupon, validateAndComputeDiscount };