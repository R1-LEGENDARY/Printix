const crypto = require("crypto");
const { PrismaClient } = require("@prisma/client");
const { createCheckoutSession } = require("../services/paymongo");

const prisma = new PrismaClient();

function toCentavos(amount) {
  return Math.round(Number(amount) * 100);
}

async function createPaymentSession(req, res) {
  try {
    const { orderId } = req.body;
    const userId = BigInt(req.user.userId);

    const order = await prisma.order.findFirst({
      where: { id: BigInt(orderId), userId },
      include: { items: true },
    });

    if (!order) return res.status(404).json({ message: "Order not found." });
    if (order.status !== "pending") {
      return res.status(409).json({ message: `Order is already ${order.status}.` });
    }

    const lineItems = order.items.map((item) => ({
      currency: "PHP",
      amount: toCentavos(item.unitPrice),
      name: `${item.productName} (${item.variantLabel})`,
      quantity: item.quantity,
    }));

    if (Number(order.discountTotal) > 0) {
      const discountCentavos = toCentavos(order.discountTotal);
      const lastProductItem = lineItems[lineItems.length - 1];
      if (lastProductItem) {
        lastProductItem.amount = Math.max(0, lastProductItem.amount - discountCentavos);
      }
    }

    if (Number(order.shippingTotal) > 0) {
      lineItems.push({
        currency: "PHP",
        amount: toCentavos(order.shippingTotal),
        name: "Shipping",
        quantity: 1,
      });
    }

    const session = await createCheckoutSession({
      orderNumber: order.orderNumber,
      lineItems,
      successUrl: `${process.env.CLIENT_URL}/orders/${order.id}?payment=success`,
      cancelUrl: `${process.env.CLIENT_URL}/orders/${order.id}?payment=cancelled`,
      metadata: { orderId: order.id.toString(), orderNumber: order.orderNumber },
    });

    await prisma.payment.create({
      data: {
        orderId: order.id,
        gateway: "paymongo",
        transactionRef: session.id,
        amount: order.grandTotal,
        status: "pending",
      },
    });

    res.status(201).json({ checkoutUrl: session.attributes.checkout_url });
  } catch (error) {
    res.status(500).json({ message: "Failed to start payment.", error: error.message });
  }
}

function verifyWebhookSignature(rawBody, signatureHeader, secret) {
  if (!signatureHeader) return false;

  const parts = Object.fromEntries(
    signatureHeader.split(",").map((p) => p.split("="))
  );
  const timestamp = parts.t;
  const testSig = parts.te;
  const liveSig = parts.li;
  const signature = testSig || liveSig;
  if (!timestamp || !signature) return false;

  const signedPayload = `${timestamp}.${rawBody}`;
  const expected = crypto.createHmac("sha256", secret).update(signedPayload).digest("hex");

  try {
    return crypto.timingSafeEqual(Buffer.from(expected), Buffer.from(signature));
  } catch {
    return false;
  }
}

async function handleWebhook(req, res) {
  try {
    const signature = req.headers["paymongo-signature"];
    const rawBody = req.body.toString("utf8");

    const valid = verifyWebhookSignature(rawBody, signature, process.env.PAYMONGO_WEBHOOK_SECRET);
    if (!valid) {
      return res.status(401).json({ message: "Invalid webhook signature." });
    }

    const event = JSON.parse(rawBody);
    const eventType = event.data?.attributes?.type;
    const eventData = event.data?.attributes?.data;

    if (eventType === "checkout_session.payment.paid") {
      const sessionId = eventData?.id;
      const metadata = eventData?.attributes?.metadata;
      const orderId = metadata?.orderId;
      const gatewayPaymentId = eventData?.attributes?.payments?.[0]?.id || null;

      if (!orderId) return res.status(200).json({ received: true });

      await prisma.$transaction(async (tx) => {
        const payment = await tx.payment.findFirst({
          where: { orderId: BigInt(orderId), transactionRef: sessionId },
        });

        if (payment && payment.status !== "succeeded") {
          await tx.payment.update({
            where: { id: payment.id },
            data: { status: "succeeded", paidAt: new Date(), gatewayPaymentId },
          });
        }

        const order = await tx.order.findUnique({ where: { id: BigInt(orderId) } });
        if (order && order.status === "pending") {
          await tx.order.update({ where: { id: order.id }, data: { status: "paid" } });
          await tx.orderStatusHistory.create({
            data: { orderId: order.id, status: "paid", note: "Payment confirmed via PayMongo webhook." },
          });
        }
      });
    }

    if (eventType === "checkout_session.payment.failed") {
      const sessionId = eventData?.id;
      const metadata = eventData?.attributes?.metadata;
      const orderId = metadata?.orderId;

      if (orderId) {
        await prisma.payment.updateMany({
          where: { orderId: BigInt(orderId), transactionRef: sessionId },
          data: { status: "failed" },
        });
      }
    }

    res.status(200).json({ received: true });
  } catch (error) {
    console.error("Webhook processing error:", error.message);
    res.status(500).json({ message: "Webhook processing failed." });
  }
}

async function getPaymentStatus(req, res) {
  try {
    const { orderId } = req.params;
    const userId = BigInt(req.user.userId);

    const order = await prisma.order.findFirst({
      where: { id: BigInt(orderId), userId },
      select: { status: true },
    });
    if (!order) return res.status(404).json({ message: "Order not found." });

    res.json({ status: order.status });
  } catch (error) {
    res.status(500).json({ message: "Failed to fetch status.", error: error.message });
  }
}

module.exports = { createPaymentSession, handleWebhook, getPaymentStatus };