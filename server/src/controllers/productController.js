const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

async function listProducts(req, res) {
  try {
    const products = await prisma.product.findMany({
      where: { isActive: true },
      include: {
        category: true,
        images: { where: { isPrimary: true }, take: 1 },
        variants: true,
      },
    });

    const formatted = products.map((p) => ({
      id: p.id.toString(),
      name: p.name,
      slug: p.slug,
      basePrice: p.basePrice,
      category: p.category.name,
      primaryImage: p.images[0]?.imageUrl || null,
      variantCount: p.variants.length,
    }));

    res.json(formatted);
  } catch (error) {
    res.status(500).json({ message: "Failed to fetch products.", error: error.message });
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
        printableAreas: { include: { mockupTemplates: true } },
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
        mockupTemplate: pa.mockupTemplates?.[0]
          ? {
              baseImageUrl: pa.mockupTemplates[0].baseImageUrl,
              perspectiveConfig: pa.mockupTemplates[0].perspectiveConfig,
              displacementMapUrl: pa.mockupTemplates[0].displacementMapUrl,
            }
          : null,
      })),
    };

    res.json(serialized);
  } catch (error) {
    res.status(500).json({ message: "Failed to fetch product.", error: error.message });
  }
}

module.exports = { listProducts, getProductBySlug };