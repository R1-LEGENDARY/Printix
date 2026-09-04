const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

function serialize(r) {
  return {
    id: r.id.toString(),
    orderId: r.orderId.toString(),
    amount: r.amount,
    reason: r.reason,
    status: r.status,
    createdAt: r.createdAt,
    processedAt: r.processedAt,
    items: r.items.map((i) => ({
      id: i.id.toString(),
      orderItemId: i.orderItemId.toString(),
      quantity: i.quantity,
      amount: i.amount,
    })),
  };
}

const REFUNDABLE_STATUSES = ["paid", "processing", "printing", "shipped", "delivered"];

async function requestRefund(req, res) {
  try {
    const userId = BigInt(req.user.userId);
    const { orderId, reason, items } = req.body;

    if (!orderId || !Array.isArray(items) || items.length === 0) {
      return res.status(400).json({ message: "orderId and at least one item to refund are required." });
    }

    const order = await prisma.order.findFirst({
      where: { id: BigInt(orderId), userId },
      include: { items: true, payments: { where: { status: "succeeded" }, orderBy: { paidAt: "desc" }, take: 1 } },
    });
    if (!order) return res.status(404).json({ message: "Order not found." });
    if (!REFUNDABLE_STATUSES.includes(order.status)) {
      return res.status(409).json({ message: "This order isn't eligible for a refund." });
    }
    const payment = order.payments[0];
    if (!payment) {
      return res.status(409).json({ message: "No successful payment found for this order." });
    }

    const existingRefunds = await prisma.refund.findMany({
      where: { orderId: order.id, status: { in: ["requested", "approved", "completed"] } },
      include: { items: true },
    });
    const alreadyRefundedQty = {};
    for (const r of existingRefunds) {
      for (const i of r.items) {
        alreadyRefundedQty[i.orderItemId.toString()] = (alreadyRefundedQty[i.orderItemId.toString()] || 0) + i.quantity;
      }
    }

    const discountRatio = Number(order.subtotal) > 0
      ? 1 - Number(order.discountTotal) / Number(order.subtotal)
      : 1;

    let totalAmount = 0;
    const refundItemsData = [];
    for (const requested of items) {
      const orderItem = order.items.find((oi) => oi.id.toString() === requested.orderItemId);
      if (!orderItem) {
        return res.status(400).json({ message: "One of the items doesn't belong to this order." });
      }
      const alreadyRefunded = alreadyRefundedQty[orderItem.id.toString()] || 0;
      const remaining = orderItem.quantity - alreadyRefunded;
      if (requested.quantity < 1 || requested.quantity > remaining) {
        return res.status(400).json({ message: `Invalid quantity for ${orderItem.productName} — ${remaining} left refundable.` });
      }
      const rawAmount = Number(orderItem.unitPrice) * requested.quantity;
      const amount = Math.round(rawAmount * discountRatio * 100) / 100;
      totalAmount += amount;
      refundItemsData.push({ orderItemId: orderItem.id, quantity: requested.quantity, amount });
    }

    const refund = await prisma.refund.create({
      data: {
        orderId: order.id,
        paymentId: payment.id,
        amount: totalAmount,
        reason: reason || null,
        status: "requested",
        requestedBy: userId,
        items: { create: refundItemsData },
      },
      include: { items: true },
    });

    res.status(201).json(serialize(refund));
  } catch (error) {
    res.status(500).json({ message: "Failed to request refund.", error: error.message });
  }
}

async function listMyRefunds(req, res) {
  try {
    const refunds = await prisma.refund.findMany({
      where: { requestedBy: BigInt(req.user.userId) },
      include: { items: true },
      orderBy: { createdAt: "desc" },
    });
    res.json(refunds.map(serialize));
  } catch (error) {
    res.status(500).json({ message: "Failed to fetch refunds.", error: error.message });
  }
}

module.exports = { requestRefund, listMyRefunds, REFUNDABLE_STATUSES };