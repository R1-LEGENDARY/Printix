const prisma = require("../db");

function serializeMockupTemplate(template) {
  if (!template) return null;
  return {
    id: template.id.toString(),
    variantId: template.variantId?.toString() || null,
    color: template.variant?.color || null,
    baseImageUrl: template.baseImageUrl,
    perspectiveConfig: template.perspectiveConfig,
    displacementMapUrl: template.displacementMapUrl,
  };
}

async function listProducts(req, res) {
  try {
    const products = await prisma.product.findMany({
      where: { isActive: true },
      include: {
        category: true,
        images: { where: { isPrimary: true }, take: 1 },
        variants: true,
        reviews: { where: { isApproved: true }, select: { rating: true } },
      },
    });

    const formatted = products.map((p) => {
      const ratingCount = p.reviews.length;
      const averageRating =
        ratingCount > 0
          ? p.reviews.reduce((s, r) => s + r.rating, 0) / ratingCount
          : 0;

      return {
        id: p.id.toString(),
        name: p.name,
        slug: p.slug,
        basePrice: p.basePrice,
        category: p.category.name,
        primaryImage: p.images[0]?.imageUrl || null,
        variantCount: p.variants.length,
        colors: [...new Set(p.variants.map((v) => v.color))],
        sizes: [...new Set(p.variants.map((v) => v.size))],
        defaultVariantId: p.variants[0]?.id.toString() || null,
        averageRating,
        reviewCount: ratingCount,
      };
    });

    res.json(formatted);
  } catch (error) {
    res
      .status(500)
      .json({ message: "Failed to fetch products.", error: error.message });
  }
}

async function getProductBySlug(req, res) {
  try {
    const { slug } = req.params;

    const product = await prisma.product.findUnique({
      where: { slug },
      include: {
        category: true,
        images: true,
        variants: true,
        printableAreas: {
          include: { mockupTemplates: { include: { variant: true } } },
        },
      },
    });

    if (!product) {
      return res.status(404).json({ message: "Product not found." });
    }

    const serialized = {
      id: product.id.toString(),
      name: product.name,
      slug: product.slug,
      description: product.description,
      basePrice: product.basePrice,
      isActive: product.isActive,
      category: {
        id: product.category.id.toString(),
        name: product.category.name,
        slug: product.category.slug,
      },
      images: product.images.map((img) => ({
        id: img.id.toString(),
        imageUrl: img.imageUrl,
        isPrimary: img.isPrimary,
      })),
      variants: product.variants.map((v) => ({
        id: v.id.toString(),
        color: v.color,
        size: v.size,
        sku: v.sku,
        stockQuantity: v.stockQuantity,
        priceOverride: v.priceOverride,
      })),
      printableAreas: product.printableAreas.map((pa) => ({
        id: pa.id.toString(),
        name: pa.name,
        x: pa.x,
        y: pa.y,
        width: pa.width,
        height: pa.height,
        mockupTemplate: serializeMockupTemplate(
          pa.mockupTemplates?.find((template) => !template.variantId),
        ),
        mockupTemplates: (pa.mockupTemplates || [])
          .filter((template) => template.variantId)
          .map(serializeMockupTemplate),
      })),
    };

    res.json(serialized);
  } catch (error) {
    res
      .status(500)
      .json({ message: "Failed to fetch product.", error: error.message });
  }
}

module.exports = { listProducts, getProductBySlug };
