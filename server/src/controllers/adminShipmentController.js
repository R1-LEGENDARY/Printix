const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();
const { createNotification } = require("../services/notifications");

const shipmentMessages = {
  shipped: "Your order is on the way.",
  delivered: "Your order has been delivered.",
};

function serialize(s) {
  return {
    id: s.id.toString(),
    orderId: s.orderId.toString(),
    carrier: s.carrier,
    trackingNumber: s.trackingNumber,
    shippedAt: s.shippedAt,
    deliveredAt: s.deliveredAt,
    estimatedDelivery: s.estimatedDelivery,
  };
}

/*
 * DOCU: Creates or updates the shipment record for an order, and optionally
 * advances the order status to shipped/delivered with a matching history entry.
 * @param {Object} req - Express request; params.orderId, body.carrier/trackingNumber/estimatedDelivery/markAs
 * @param {Object} res - Express response
 * @returns {void} - Sends the shipment as JSON
 *
 * Author: JC
 */
async function upsertShipment(req, res) {
  try {
    const orderId = BigInt(req.params.orderId);
    const { carrier, trackingNumber, estimatedDelivery, markAs } = req.body;
    const adminId = BigInt(req.user.userId);

    if (!carrier || !trackingNumber) {
      return res.status(400).json({ message: "carrier and trackingNumber are required." });
    }

    const order = await prisma.order.findUnique({ where: { id: orderId } });
    if (!order) return res.status(404).json({ message: "Order not found." });

    const existing = await prisma.shipment.findFirst({ where: { orderId } });

    const now = new Date();
    const shipmentData = {
      carrier,
      trackingNumber,
      estimatedDelivery: estimatedDelivery ? new Date(estimatedDelivery) : null,
    };
    if (markAs === "shipped" && !existing?.shippedAt) shipmentData.shippedAt = now;
    if (markAs === "delivered") shipmentData.deliveredAt = now;

    const shipment = existing
      ? await prisma.shipment.update({ where: { id: existing.id }, data: shipmentData })
      : await prisma.shipment.create({ data: { orderId, ...shipmentData, shippedAt: markAs === "shipped" ? now : null } });

    if (markAs === "shipped" || markAs === "delivered") {
      const newStatus = markAs;
      if (order.status !== newStatus) {
        await prisma.$transaction([
          prisma.order.update({ where: { id: orderId }, data: { status: newStatus } }),
          prisma.orderStatusHistory.create({
            data: { orderId, status: newStatus, note: `Marked ${newStatus} with tracking ${trackingNumber}.`, changedBy: adminId },
          }),
        ]);
        await createNotification(prisma, {
          userId: order.userId,
          type: `order_${newStatus}`,
          message: `${shipmentMessages[newStatus]} Tracking number: ${trackingNumber}.`,
          relatedType: "order",
          relatedId: order.id,
        });
      }
    }

    res.status(201).json(serialize(shipment));
  } catch (error) {
    res.status(500).json({ message: "Failed to save shipment.", error: error.message });
  }
}

module.exports = { upsertShipment };