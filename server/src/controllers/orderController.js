const { PrismaClient } = require("@prisma/client");
const { validateAndComputeDiscount } = require("./couponController");
const prisma = new PrismaClient();

function generateOrderNumber() {
  const year = new Date().getFullYear();
  const rand = Math.floor(10000 + Math.random() * 90000);
  return `PRX-${year}-${rand}`;
}

function serializeOrder(order) {
  return {
    id: order.id.toString(),
    orderNumber: order.orderNumber,
    status: order.status,
    subtotal: order.subtotal,
    discountTotal: order.discountTotal,
    shippingTotal: order.shippingTotal,
    taxTotal: order.taxTotal,
    grandTotal: order.grandTotal,
    placedAt: order.placedAt,
    items: order.items.map((item) => ({
      id: item.id.toString(),
      productName: item.productName,
      variantLabel: item.variantLabel,
      quantity: item.quantity,
      unitPrice: item.unitPrice,
      lineTotal: item.lineTotal,
      mockupUrl: item.designSnapshot?.mockupImageUrl || null,
    })),
    shipment: order.shipments?.[0]
      ? {
          carrier: order.shipments[0].carrier,
          trackingNumber: order.shipments[0].trackingNumber,
          shippedAt: order.shipments[0].shippedAt,
          deliveredAt: order.shipments[0].deliveredAt,
          estimatedDelivery: order.shipments[0].estimatedDelivery,
        }
      : null,
  };
}

const FLAT_SHIPPING = 5.0;

async function createOrder(req, res) {
  try {
    const userId = BigInt(req.user.userId);
    const { shippingAddressId, billingAddressId, couponCode } = req.body;

    if (!shippingAddressId || !billingAddressId) {
      return res.status(400).json({ message: "Shipping and billing address are required." });
    }

    const [shippingAddress, billingAddress] = await Promise.all([
      prisma.address.findFirst({ where: { id: BigInt(shippingAddressId), userId } }),
      prisma.address.findFirst({ where: { id: BigInt(billingAddressId), userId } }),
    ]);
    if (!shippingAddress || !billingAddress) {
      return res.status(404).json({ message: "One or both addresses were not found." });
    }

    const cart = await prisma.cart.findFirst({
      where: { userId },
      include: {
        items: {
          include: {
            variant: { include: { product: true } },
            design: { include: { snapshots: { orderBy: { createdAt: "desc" }, take: 1 } } },
          },
        },
      },
    });

    if (!cart || cart.items.length === 0) {
      return res.status(400).json({ message: "Your cart is empty." });
    }

    for (const item of cart.items) {
      if (item.variant.stockQuantity < item.quantity) {
        return res.status(409).json({ message: `Not enough stock for ${item.variant.product.name}.` });
      }
    }

    const subtotal = cart.items.reduce((sum, item) => sum + Number(item.unitPrice) * item.quantity, 0);
    const shippingTotal = FLAT_SHIPPING;
    const taxTotal = 0;

    let discountTotal = 0;
    let appliedCoupon = null;
    if (couponCode) {
      const { coupon, discountAmount } = await validateAndComputeDiscount(couponCode, userId, subtotal);
      discountTotal = discountAmount;
      appliedCoupon = coupon;
    }

    const grandTotal = subtotal - discountTotal + shippingTotal + taxTotal;

    const order = await prisma.$transaction(async (tx) => {
      const created = await tx.order.create({
        data: {
          userId,
          orderNumber: generateOrderNumber(),
          status: "pending",
          subtotal,
          discountTotal,
          shippingTotal,
          taxTotal,
          grandTotal,
          shippingAddressId: shippingAddress.id,
          billingAddressId: billingAddress.id,
          placedAt: new Date(),
        },
      });

      if (appliedCoupon) {
        await tx.couponRedemption.create({
          data: { couponId: appliedCoupon.id, userId, orderId: created.id },
        });
      }

      for (const item of cart.items) {
        let designSnapshotId = null;
        if (item.design) {
          const snapshot = item.design.snapshots[0];
          if (snapshot) {
            designSnapshotId = snapshot.id;
          } else {
            const elements = await tx.designElement.findMany({
              where: { designId: item.design.id },
              include: { image: true, text: true },
            });
            const printableAreaId = elements[0]?.printableAreaId;
            if (printableAreaId) {
              const created2 = await tx.designSnapshot.create({
                data: {
                  designId: item.design.id,
                  printableAreaId,
                  mockupImageUrl: "",
                  elementsJson: JSON.parse(JSON.stringify(elements, (k, v) => (typeof v === "bigint" ? v.toString() : v))),
                },
              });
              designSnapshotId = created2.id;
            }
          }
        }

        await tx.orderItem.create({
          data: {
            orderId: created.id,
            productVariantId: item.productVariantId,
            designSnapshotId,
            productName: item.variant.product.name,
            variantLabel: `${item.variant.color} / ${item.variant.size}`,
            quantity: item.quantity,
            unitPrice: item.unitPrice,
            lineTotal: Number(item.unitPrice) * item.quantity,
          },
        });

        await tx.productVariant.update({
          where: { id: item.productVariantId },
          data: { stockQuantity: { decrement: item.quantity } },
        });

        await tx.stockMovement.create({
          data: {
            productVariantId: item.productVariantId,
            changeQty: -item.quantity,
            reason: "order",
            referenceId: created.id,
            createdBy: userId,
          },
        });
      }

      for (const item of cart.items) {
        if (item.design) {
          await tx.design.update({ where: { id: item.design.id }, data: { status: "ordered" } });
        }
      }

      await tx.orderStatusHistory.create({
        data: { orderId: created.id, status: "pending", note: "Order placed.", changedBy: userId },
      });

      await tx.cartItem.deleteMany({ where: { cartId: cart.id } });

      return tx.order.findUnique({
        where: { id: created.id },
        include: { items: { include: { designSnapshot: true } }, shipments: true },
      });
    });

    res.status(201).json(serializeOrder(order));
  } catch (error) {
    res.status(500).json({ message: "Failed to create order.", error: error.message });
  }
}

async function listMyOrders(req, res) {
  try {
    const orders = await prisma.order.findMany({
      where: { userId: BigInt(req.user.userId) },
      include: { items: { include: { designSnapshot: true } }, shipments: true },
      orderBy: { createdAt: "desc" },
    });
    res.json(orders.map(serializeOrder));
  } catch (error) {
    res.status(500).json({ message: "Failed to fetch orders.", error: error.message });
  }
}

module.exports = { createOrder, listMyOrders };