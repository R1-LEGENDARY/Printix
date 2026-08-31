const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

function serialize(c) {
  return {
    id: c.id.toString(),
    code: c.code,
    discountType: c.discountType,
    value: c.value,
    minOrderAmount: c.minOrderAmount,
    usageLimit: c.usageLimit,
    usageLimitPerUser: c.usageLimitPerUser,
    startsAt: c.startsAt,
    expiresAt: c.expiresAt,
    isActive: c.isActive,
    redemptionCount: c._count?.redemptions ?? undefined,
  };
}

async function listCoupons(req, res) {
  try {
    const coupons = await prisma.coupon.findMany({
      include: { _count: { select: { redemptions: true } } },
      orderBy: { createdAt: "desc" },
    });
    res.json(coupons.map(serialize));
  } catch (error) {
    res.status(500).json({ message: "Failed to fetch coupons.", error: error.message });
  }
}

async function createCoupon(req, res) {
  try {
    const { code, discountType, value, minOrderAmount, usageLimit, usageLimitPerUser, startsAt, expiresAt } = req.body;

    if (!code || !discountType || value == null) {
      return res.status(400).json({ message: "code, discountType, and value are required." });
    }
    if (!["percent", "fixed"].includes(discountType)) {
      return res.status(400).json({ message: "discountType must be 'percent' or 'fixed'." });
    }

    const coupon = await prisma.coupon.create({
      data: {
        code: code.toUpperCase().trim(),
        discountType,
        value,
        minOrderAmount: minOrderAmount || null,
        usageLimit: usageLimit || null,
        usageLimitPerUser: usageLimitPerUser || null,
        startsAt: startsAt ? new Date(startsAt) : null,
        expiresAt: expiresAt ? new Date(expiresAt) : null,
        isActive: true,
      },
    });
    res.status(201).json(serialize(coupon));
  } catch (error) {
    if (error.code === "P2002") {
      return res.status(409).json({ message: "A coupon with that code already exists." });
    }
    res.status(500).json({ message: "Failed to create coupon.", error: error.message });
  }
}

async function updateCoupon(req, res) {
  try {
    const id = BigInt(req.params.id);
    const { isActive, value, usageLimit, usageLimitPerUser, expiresAt } = req.body;

    const data = {};
    if (isActive !== undefined) data.isActive = isActive;
    if (value !== undefined) data.value = value;
    if (usageLimit !== undefined) data.usageLimit = usageLimit || null;
    if (usageLimitPerUser !== undefined) data.usageLimitPerUser = usageLimitPerUser || null;
    if (expiresAt !== undefined) data.expiresAt = expiresAt ? new Date(expiresAt) : null;

    const coupon = await prisma.coupon.update({ where: { id }, data });
    res.json(serialize(coupon));
  } catch (error) {
    res.status(500).json({ message: "Failed to update coupon.", error: error.message });
  }
}

async function deleteCoupon(req, res) {
  try {
    const id = BigInt(req.params.id);
    const redemptions = await prisma.couponRedemption.count({ where: { couponId: id } });
    if (redemptions > 0) {
      return res.status(409).json({ message: "Can't delete a coupon that's already been used — deactivate it instead." });
    }
    await prisma.coupon.delete({ where: { id } });
    res.status(204).send();
  } catch (error) {
    res.status(500).json({ message: "Failed to delete coupon.", error: error.message });
  }
}

module.exports = { listCoupons, createCoupon, updateCoupon, deleteCoupon };