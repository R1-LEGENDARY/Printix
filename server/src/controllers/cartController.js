const prisma = require("../db");

async function resolveCart(req) {
  const userId = req.user?.userId ? BigInt(req.user.userId) : null;
  const guestCartId = req.headers["x-cart-id"];

  if (userId) {
    let cart = await prisma.cart.findFirst({ where: { userId } });
    if (!cart) {
      cart = await prisma.cart.create({ data: { userId } });
    }
    return cart;
  }

  if (guestCartId) {
    const cart = await prisma.cart.findUnique({
      where: { id: BigInt(guestCartId) },
    });
    if (cart) return cart;
  }

  return prisma.cart.create({ data: {} });
}

function serializeCart(cart) {
  const items = cart.items.map((item) => ({
    id: item.id.toString(),
    quantity: item.quantity,
    unitPrice: item.unitPrice,
    lineTotal: (Number(item.unitPrice) * item.quantity).toFixed(2),
    mockupUrl: item.design?.snapshots?.[0]?.mockupImageUrl || null,
    variant: {
      id: item.variant.id.toString(),
      color: item.variant.color,
      size: item.variant.size,
      sku: item.variant.sku,
      stockQuantity: item.variant.stockQuantity,
      product: {
        name: item.variant.product.name,
        slug: item.variant.product.slug,
        image: item.variant.product.images[0]?.imageUrl || null,
      },
    },
    designId: item.designId ? item.designId.toString() : null,
  }));

  const subtotal = items.reduce((sum, i) => sum + Number(i.lineTotal), 0);

  return {
    id: cart.id.toString(),
    items,
    subtotal: subtotal.toFixed(2),
    itemCount: items.reduce((sum, i) => sum + i.quantity, 0),
  };
}

const cartInclude = {
  items: {
    include: {
      variant: {
        include: {
          product: {
            include: { images: { where: { isPrimary: true }, take: 1 } },
          },
        },
      },
      design: {
        include: { snapshots: { orderBy: { createdAt: "desc" }, take: 1 } },
      },
    },
  },
};

async function getCart(req, res) {
  try {
    const cart = await resolveCart(req);
    const full = await prisma.cart.findUnique({
      where: { id: cart.id },
      include: cartInclude,
    });
    res.json(serializeCart(full));
  } catch (error) {
    res
      .status(500)
      .json({ message: "Failed to load cart.", error: error.message });
  }
}

async function addItem(req, res) {
  try {
    const { productVariantId, quantity = 1, designId = null } = req.body;
    if (!productVariantId) {
      return res.status(400).json({ message: "productVariantId is required." });
    }

    const variant = await prisma.productVariant.findUnique({
      where: { id: BigInt(productVariantId) },
    });
    if (!variant)
      return res.status(404).json({ message: "Variant not found." });
    if (variant.stockQuantity < quantity) {
      return res.status(409).json({ message: "Not enough stock available." });
    }

    const cart = await resolveCart(req);
    const unitPrice =
      variant.priceOverride ??
      (await prisma.product.findUnique({ where: { id: variant.productId } }))
        .basePrice;

    const existing = await prisma.cartItem.findFirst({
      where: {
        cartId: cart.id,
        productVariantId: variant.id,
        designId: designId ? BigInt(designId) : null,
      },
    });

    if (existing) {
      await prisma.cartItem.update({
        where: { id: existing.id },
        data: { quantity: existing.quantity + quantity },
      });
    } else {
      await prisma.cartItem.create({
        data: {
          cartId: cart.id,
          productVariantId: variant.id,
          designId: designId ? BigInt(designId) : null,
          quantity,
          unitPrice,
        },
      });
    }

    const full = await prisma.cart.findUnique({
      where: { id: cart.id },
      include: cartInclude,
    });
    res.status(201).json(serializeCart(full));
  } catch (error) {
    res
      .status(500)
      .json({ message: "Failed to add item.", error: error.message });
  }
}

async function updateItem(req, res) {
  try {
    const { itemId } = req.params;
    const { quantity } = req.body;

    if (!quantity || quantity < 1) {
      return res.status(400).json({ message: "Quantity must be at least 1." });
    }

    const item = await prisma.cartItem.findUnique({
      where: { id: BigInt(itemId) },
      include: { variant: true },
    });
    if (!item) return res.status(404).json({ message: "Cart item not found." });
    if (item.variant.stockQuantity < quantity) {
      return res.status(409).json({ message: "Not enough stock available." });
    }

    await prisma.cartItem.update({
      where: { id: item.id },
      data: { quantity },
    });

    const full = await prisma.cart.findUnique({
      where: { id: item.cartId },
      include: cartInclude,
    });
    res.json(serializeCart(full));
  } catch (error) {
    res
      .status(500)
      .json({ message: "Failed to update item.", error: error.message });
  }
}

async function removeItem(req, res) {
  try {
    const { itemId } = req.params;
    const item = await prisma.cartItem.findUnique({
      where: { id: BigInt(itemId) },
    });
    if (!item) return res.status(404).json({ message: "Cart item not found." });

    await prisma.cartItem.delete({ where: { id: item.id } });

    const full = await prisma.cart.findUnique({
      where: { id: item.cartId },
      include: cartInclude,
    });
    res.json(serializeCart(full));
  } catch (error) {
    res
      .status(500)
      .json({ message: "Failed to remove item.", error: error.message });
  }
}

module.exports = { getCart, addItem, updateItem, removeItem };
