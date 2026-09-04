const { PrismaClient } = require("@prisma/client");
const { createRefund: createPaymongoRefund } = require("../services/paymongo");
const prisma = new PrismaClient();

function serialize(r) {
  return {
    id: r.id.toString(),
    orderId: r.orderId.toString(),
    orderNumber: r.order?.orderNumber,
    customerName: r.order?.user?.name,
    amount: r.amount,
    reason: r.reason,
    status: r.status,
    createdAt: r.createdAt,
    processedAt: r.processedAt,
    payment: r.payment ? { transactionRef: r.payment.transactionRef, gateway: r.payment.gateway } : null,
    items: r.items.map((i) => ({
      id: i.id.toString(),
      productName: i.orderItem?.productName,
      variantLabel: i.orderItem?.variantLabel,
      quantity: i.quantity,
      amount: i.amount,
    })),
  };
}

const include = {
  order: { include: { user: { select: { name: true } } } },
  payment: true,
  items: { include: { orderItem: true } },
};

async function listRefunds(req, res) {
  try {
    const { status } = req.query;
    const refunds = await prisma.refund.findMany({
      where: status ? { status } : undefined,
      include,
      orderBy: { createdAt: "desc" },
    });
    res.json(refunds.map(serialize));
  } catch (error) {
    res.status(500).json({ message: "Failed to fetch refunds.", error: error.message });
  }
}

async function updateRefundStatus(req, res) {
  try {
    const id = BigInt(req.params.id);
    const { status } = req.body;

    if (!["approved", "rejected", "completed"].includes(status)) {
      return res.status(400).json({ message: "status must be approved, rejected, or completed." });
    }

    const refund = await prisma.refund.findUnique({ where: { id }, include });
    if (!refund) return res.status(404).json({ message: "Refund not found." });

    if (status === "approved") {
      if (!refund.payment.gatewayPaymentId) {
        return res.status(409).json({
          message: "This payment doesn't have a gateway payment ID on file yet — it may predate the fix, or the webhook hasn't processed it. Refund can't be completed automatically.",
        });
      }
      try {
        await createPaymongoRefund(refund.payment.gatewayPaymentId, Math.round(Number(refund.amount) * 100), refund.reason);
      } catch (gatewayError) {
        return res.status(502).json({ message: `Gateway refund failed: ${gatewayError.message}` });
      }

      await prisma.$transaction(async (tx) => {
        await tx.refund.update({ where: { id }, data: { status: "completed", processedAt: new Date() } });

        if (["paid", "processing", "printing"].includes(refund.order.status)) {
          await tx.order.update({ where: { id: refund.orderId }, data: { status: "refunded" } });
          await tx.orderStatusHistory.create({
            data: { orderId: refund.orderId, status: "refunded", note: "Refund processed.", changedBy: BigInt(req.user.userId) },
          });
        }
      });
    } else {
      await prisma.refund.update({
        where: { id },
        data: { status, processedAt: status === "rejected" ? new Date() : undefined },
      });
    }

    const updated = await prisma.refund.findUnique({ where: { id }, include });
    res.json(serialize(updated));
  } catch (error) {
    res.status(500).json({ message: "Failed to update refund.", error: error.message });
  }
}

module.exports = { listRefunds, updateRefundStatus };