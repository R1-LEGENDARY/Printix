const prisma = require("../db");

/*
 * DOCU: Serializes a wishlist row with its variant/product info for API responses.
 * @param {Object} w - Prisma wishlist record, including variant->product->images
 * @returns {Object} - Plain-object wishlist item safe for JSON.stringify
 *
 * Author: JC
 */
function serialize(w) {
  return {
    id: w.id.toString(),
    createdAt: w.createdAt,
    variant: {
      id: w.variant.id.toString(),
      color: w.variant.color,
      size: w.variant.size,
      stockQuantity: w.variant.stockQuantity,
      product: {
        name: w.variant.product.name,
        slug: w.variant.product.slug,
        basePrice: w.variant.product.basePrice,
        image: w.variant.product.images[0]?.imageUrl || null,
      },
    },
  };
}

async function listWishlist(req, res) {
  try {
    const items = await prisma.wishlist.findMany({
      where: { userId: BigInt(req.user.userId) },
      include: {
        variant: {
          include: {
            product: {
              include: { images: { where: { isPrimary: true }, take: 1 } },
            },
          },
        },
      },
      orderBy: { createdAt: "desc" },
    });
    res.json(items.map(serialize));
  } catch (error) {
    res
      .status(500)
      .json({ message: "Failed to fetch wishlist.", error: error.message });
  }
}

async function addToWishlist(req, res) {
  try {
    const userId = BigInt(req.user.userId);
    const { productVariantId } = req.body;
    if (!productVariantId) {
      return res.status(400).json({ message: "productVariantId is required." });
    }

    const item = await prisma.wishlist.upsert({
      where: {
        userId_productVariantId: {
          userId,
          productVariantId: BigInt(productVariantId),
        },
      },
      update: {},
      create: { userId, productVariantId: BigInt(productVariantId) },
      include: {
        variant: {
          include: {
            product: {
              include: { images: { where: { isPrimary: true }, take: 1 } },
            },
          },
        },
      },
    });

    res.status(201).json(serialize(item));
  } catch (error) {
    res
      .status(500)
      .json({ message: "Failed to add to wishlist.", error: error.message });
  }
}

async function removeFromWishlist(req, res) {
  try {
    const userId = BigInt(req.user.userId);
    const { variantId } = req.params;

    await prisma.wishlist.deleteMany({
      where: { userId, productVariantId: BigInt(variantId) },
    });

    res.status(204).send();
  } catch (error) {
    res
      .status(500)
      .json({
        message: "Failed to remove from wishlist.",
        error: error.message,
      });
  }
}

module.exports = { listWishlist, addToWishlist, removeFromWishlist };
