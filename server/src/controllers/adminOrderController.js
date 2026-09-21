const prisma = require("../db");
const { createNotification } = require("../services/notifications");

const statusFlow = [
  "pending",
  "paid",
  "processing",
  "printing",
  "shipped",
  "delivered",
];

const statusMessages = {
  pending: "is awaiting payment",
  paid: "has been paid and is ready for processing",
  processing: "is now being prepared",
  printing: "is now being printed",
  shipped: "is on the way",
  delivered: "has been delivered",
  cancelled: "has been cancelled",
  refunded: "has been refunded",
};

function serializeAddress(a) {
  return {
    id: a.id.toString(),
    label: a.label,
    fullName: a.fullName,
    phone: a.phone,
    line1: a.line1,
    line2: a.line2,
    city: a.city,
    province: a.province,
    postalCode: a.postalCode,
    country: a.country,
  };
}

function serializeOrder(o) {
  return {
    id: o.id.toString(),
    orderNumber: o.orderNumber,
    status: o.status,
    subtotal: o.subtotal,
    shippingTotal: o.shippingTotal,
    taxTotal: o.taxTotal,
    grandTotal: o.grandTotal,
    placedAt: o.placedAt,
    customer: {
      id: o.user.id.toString(),
      name: o.user.name,
      email: o.user.email,
    },
    shippingAddress: serializeAddress(o.shippingAddress),
    billingAddress: serializeAddress(o.billingAddress),
    payments: o.payments.map((p) => ({
      id: p.id.toString(),
      gateway: p.gateway,
      amount: p.amount,
      status: p.status,
      paidAt: p.paidAt,
    })),
    items: o.items.map((item) => ({
      id: item.id.toString(),
      productName: item.productName,
      variantLabel: item.variantLabel,
      quantity: item.quantity,
      unitPrice: item.unitPrice,
      lineTotal: item.lineTotal,
      hasDesign: !!item.designSnapshotId,
    })),
    statusHistory: o.statusHistory
      .sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt))
      .map((h) => ({ status: h.status, note: h.note, createdAt: h.createdAt })),
    shipment: o.shipments?.[0]
      ? {
          id: o.shipments[0].id.toString(),
          carrier: o.shipments[0].carrier,
          trackingNumber: o.shipments[0].trackingNumber,
          shippedAt: o.shipments[0].shippedAt,
          deliveredAt: o.shipments[0].deliveredAt,
          estimatedDelivery: o.shipments[0].estimatedDelivery,
        }
      : null,
  };
}

const include = {
  user: { select: { id: true, name: true, email: true } },
  shippingAddress: true,
  billingAddress: true,
  payments: true,
  items: true,
  statusHistory: true,
  shipments: true,
};

async function listOrders(req, res) {
  try {
    const { status } = req.query;
    const orders = await prisma.order.findMany({
      where: status ? { status } : undefined,
      include,
      orderBy: { createdAt: "desc" },
    });
    res.json(orders.map(serializeOrder));
  } catch (error) {
    res
      .status(500)
      .json({ message: "Failed to fetch orders.", error: error.message });
  }
}

async function getOrder(req, res) {
  try {
    const order = await prisma.order.findUnique({
      where: { id: BigInt(req.params.id) },
      include,
    });
    if (!order) return res.status(404).json({ message: "Order not found." });
    res.json(serializeOrder(order));
  } catch (error) {
    res
      .status(500)
      .json({ message: "Failed to fetch order.", error: error.message });
  }
}

async function updateOrderStatus(req, res) {
  try {
    const id = BigInt(req.params.id);
    const { status, note } = req.body;
    const adminId = BigInt(req.user.userId);

    const validStatuses = [...statusFlow, "cancelled", "refunded"];
    if (!validStatuses.includes(status)) {
      return res.status(400).json({ message: "Invalid status." });
    }

    const order = await prisma.order.findUnique({ where: { id } });
    if (!order) return res.status(404).json({ message: "Order not found." });

    const updated = await prisma.$transaction(async (tx) => {
      const result = await tx.order.update({ where: { id }, data: { status } });
      await tx.orderStatusHistory.create({
        data: { orderId: id, status, note: note || null, changedBy: adminId },
      });
      return result;
    });

    const full = await prisma.order.findUnique({
      where: { id: updated.id },
      include,
    });
    await createNotification(prisma, {
      userId: order.userId,
      type: `order_${status}`,
      message: `Your order #${order.orderNumber} ${statusMessages[status] || "has an update"}.`,
      relatedType: "order",
      relatedId: order.id,
    });
    res.json(serializeOrder(full));
  } catch (error) {
    res
      .status(500)
      .json({
        message: "Failed to update order status.",
        error: error.message,
      });
  }
}

module.exports = { listOrders, getOrder, updateOrderStatus };
