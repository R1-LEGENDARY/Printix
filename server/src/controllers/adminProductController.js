const { storeUploadedFile } = require("../services/storage");
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

function serializeProduct(p) {
  return {
    id: p.id.toString(),
    name: p.name,
    slug: p.slug,
    description: p.description,
    basePrice: p.basePrice,
    isActive: p.isActive,
    category: { id: p.category.id.toString(), name: p.category.name },
    images: p.images.map((img) => ({
      id: img.id.toString(),
      imageUrl: img.imageUrl,
      isPrimary: img.isPrimary,
    })),
    variants: p.variants.map((v) => ({
      id: v.id.toString(),
      color: v.color,
      size: v.size,
      sku: v.sku,
      stockQuantity: v.stockQuantity,
      priceOverride: v.priceOverride,
    })),
    printableAreas: (p.printableAreas || []).map((pa) => ({
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
}

const include = {
  category: true,
  images: true,
  variants: true,
  printableAreas: {
    include: { mockupTemplates: { include: { variant: true } } },
  },
};

async function listAllProducts(req, res) {
  try {
    const products = await prisma.product.findMany({
      include,
      orderBy: { createdAt: "desc" },
    });
    res.json(products.map(serializeProduct));
  } catch (error) {
    res
      .status(500)
      .json({ message: "Failed to fetch products.", error: error.message });
  }
}

async function getProductForAdmin(req, res) {
  try {
    const product = await prisma.product.findUnique({
      where: { id: BigInt(req.params.id) },
      include,
    });
    if (!product)
      return res.status(404).json({ message: "Product not found." });
    res.json(serializeProduct(product));
  } catch (error) {
    res
      .status(500)
      .json({ message: "Failed to fetch product.", error: error.message });
  }
}

function slugify(name) {
  return name
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}

async function createProduct(req, res) {
  try {
    const { name, categoryId, description, basePrice, variants } = req.body;

    if (!name || !categoryId || !basePrice) {
      return res
        .status(400)
        .json({ message: "Name, category, and base price are required." });
    }

    const slug = slugify(name);
    const existing = await prisma.product.findUnique({ where: { slug } });
    if (existing) {
      return res
        .status(409)
        .json({ message: "A product with a similar name already exists." });
    }

    const product = await prisma.product.create({
      data: {
        name,
        slug,
        description: description || "",
        basePrice,
        categoryId: BigInt(categoryId),
        isActive: true,
        variants: {
          create: (variants || []).map((v) => ({
            color: v.color,
            size: v.size,
            sku: v.sku,
            stockQuantity: v.stockQuantity || 0,
            priceOverride: v.priceOverride || null,
          })),
        },
      },
      include,
    });

    res.status(201).json(serializeProduct(product));
  } catch (error) {
    res
      .status(500)
      .json({ message: "Failed to create product.", error: error.message });
  }
}

async function updateProduct(req, res) {
  try {
    const id = BigInt(req.params.id);
    const { name, categoryId, description, basePrice, isActive } = req.body;

    const data = {};
    if (name !== undefined) data.name = name;
    if (description !== undefined) data.description = description;
    if (basePrice !== undefined) data.basePrice = basePrice;
    if (categoryId !== undefined) data.categoryId = BigInt(categoryId);
    if (isActive !== undefined) data.isActive = isActive;

    const product = await prisma.product.update({
      where: { id },
      data,
      include,
    });
    res.json(serializeProduct(product));
  } catch (error) {
    res
      .status(500)
      .json({ message: "Failed to update product.", error: error.message });
  }
}

async function toggleActive(req, res) {
  try {
    const id = BigInt(req.params.id);
    const product = await prisma.product.findUnique({ where: { id } });
    if (!product)
      return res.status(404).json({ message: "Product not found." });

    const updated = await prisma.product.update({
      where: { id },
      data: { isActive: !product.isActive },
      include,
    });
    res.json(serializeProduct(updated));
  } catch (error) {
    res.status(500).json({
      message: "Failed to toggle product status.",
      error: error.message,
    });
  }
}

async function upsertVariant(req, res) {
  try {
    const productId = BigInt(req.params.id);
    const { id, color, size, sku, stockQuantity, priceOverride } = req.body;

    if (!color || !size || !sku) {
      return res
        .status(400)
        .json({ message: "Color, size, and SKU are required." });
    }

    let variant;
    if (id) {
      variant = await prisma.productVariant.update({
        where: { id: BigInt(id) },
        data: {
          color,
          size,
          sku,
          stockQuantity: stockQuantity ?? 0,
          priceOverride: priceOverride || null,
        },
      });
    } else {
      variant = await prisma.productVariant.create({
        data: {
          productId,
          color,
          size,
          sku,
          stockQuantity: stockQuantity ?? 0,
          priceOverride: priceOverride || null,
        },
      });
    }

    const product = await prisma.product.findUnique({
      where: { id: productId },
      include,
    });
    res.status(201).json(serializeProduct(product));
  } catch (error) {
    if (error.code === "P2002") {
      return res.status(409).json({ message: "That SKU is already in use." });
    }
    res
      .status(500)
      .json({ message: "Failed to save variant.", error: error.message });
  }
}

async function addProductImage(req, res) {
  try {
    const productId = BigInt(req.params.id);
    if (!req.file)
      return res.status(400).json({ message: "No file uploaded." });

    const existingCount = await prisma.productImage.count({
      where: { productId },
    });

    const image = await prisma.productImage.create({
      data: {
        productId,
        imageUrl: await storeUploadedFile(
          req.file,
          "product-images",
          `product-${productId}`,
        ),
        isPrimary: existingCount === 0,
        sortOrder: existingCount,
      },
    });

    const product = await prisma.product.findUnique({
      where: { id: productId },
      include,
    });
    res.status(201).json({
      image: {
        id: image.id.toString(),
        imageUrl: image.imageUrl,
        isPrimary: image.isPrimary,
      },
      product: serializeProduct(product),
    });
  } catch (error) {
    res
      .status(500)
      .json({ message: "Failed to upload image.", error: error.message });
  }
}

async function deleteProductImage(req, res) {
  try {
    const { productId, imageId } = req.params;
    const image = await prisma.productImage.findUnique({
      where: { id: BigInt(imageId) },
    });
    if (!image || image.productId.toString() !== productId) {
      return res.status(404).json({ message: "Image not found." });
    }

    await prisma.productImage.delete({ where: { id: image.id } });

    if (image.isPrimary) {
      const next = await prisma.productImage.findFirst({
        where: { productId: BigInt(productId) },
        orderBy: { sortOrder: "asc" },
      });
      if (next) {
        await prisma.productImage.update({
          where: { id: next.id },
          data: { isPrimary: true },
        });
      }
    }

    const product = await prisma.product.findUnique({
      where: { id: BigInt(productId) },
      include,
    });
    res.json(serializeProduct(product));
  } catch (error) {
    res
      .status(500)
      .json({ message: "Failed to delete image.", error: error.message });
  }
}

async function setPrimaryImage(req, res) {
  try {
    const { productId, imageId } = req.params;
    const pId = BigInt(productId);

    await prisma.$transaction([
      prisma.productImage.updateMany({
        where: { productId: pId },
        data: { isPrimary: false },
      }),
      prisma.productImage.update({
        where: { id: BigInt(imageId) },
        data: { isPrimary: true },
      }),
    ]);

    const product = await prisma.product.findUnique({
      where: { id: pId },
      include,
    });
    res.json(serializeProduct(product));
  } catch (error) {
    res
      .status(500)
      .json({ message: "Failed to set primary image.", error: error.message });
  }
}

async function upsertPrintableArea(req, res) {
  try {
    const productId = BigInt(req.params.id);
    const { id, name, x, y, width, height } = req.body;

    if (!name || width == null || height == null) {
      return res
        .status(400)
        .json({ message: "Name, width, and height are required." });
    }

    const duplicate = await prisma.printableArea.findFirst({
      where: { productId, name, ...(id ? { NOT: { id: BigInt(id) } } : {}) },
    });
    if (duplicate) {
      return res.status(409).json({
        message:
          "A printable area with that name already exists for this product.",
      });
    }

    if (id) {
      await prisma.printableArea.update({
        where: { id: BigInt(id) },
        data: { name, x: x || 0, y: y || 0, width, height },
      });
    } else {
      await prisma.printableArea.create({
        data: { productId, name, x: x || 0, y: y || 0, width, height },
      });
    }

    const product = await prisma.product.findUnique({
      where: { id: productId },
      include,
    });
    res.status(201).json(serializeProduct(product));
  } catch (error) {
    res.status(500).json({
      message: "Failed to save printable area.",
      error: error.message,
    });
  }
}

async function adjustStock(req, res) {
  try {
    const variantId = BigInt(req.params.variantId);
    const { changeQty, reason } = req.body;
    const adminId = BigInt(req.user.userId);

    if (!changeQty || !Number.isInteger(changeQty)) {
      return res
        .status(400)
        .json({ message: "changeQty must be a non-zero integer." });
    }

    const variant = await prisma.productVariant.findUnique({
      where: { id: variantId },
    });
    if (!variant)
      return res.status(404).json({ message: "Variant not found." });

    const newQty = variant.stockQuantity + changeQty;
    if (newQty < 0) {
      return res.status(409).json({ message: "Stock can't go below zero." });
    }

    await prisma.$transaction([
      prisma.productVariant.update({
        where: { id: variantId },
        data: { stockQuantity: newQty },
      }),
      prisma.stockMovement.create({
        data: {
          productVariantId: variantId,
          changeQty,
          reason: reason || "adjustment",
          createdBy: adminId,
        },
      }),
    ]);

    const product = await prisma.product.findUnique({
      where: { id: variant.productId },
      include,
    });
    res.json(serializeProduct(product));
  } catch (error) {
    res
      .status(500)
      .json({ message: "Failed to adjust stock.", error: error.message });
  }
}

async function uploadMockupTemplate(req, res) {
  try {
    const printableAreaId = BigInt(req.params.areaId);
    const variantId = req.body.variantId ? BigInt(req.body.variantId) : null;
    if (!variantId)
      return res.status(400).json({ message: "Select a product color first." });
    if (!req.file)
      return res.status(400).json({ message: "No file uploaded." });

    const area = await prisma.printableArea.findUnique({
      where: { id: printableAreaId },
    });
    if (!area)
      return res.status(404).json({ message: "Printable area not found." });

    const existing = await prisma.productMockupTemplate.findFirst({
      where: { printableAreaId, variantId },
    });
    const baseImageUrl = await storeUploadedFile(
      req.file,
      "mockups",
      `area-${printableAreaId}`,
    );

    const template = existing
      ? await prisma.productMockupTemplate.update({
          where: { id: existing.id },
          data: { baseImageUrl },
        })
      : await prisma.productMockupTemplate.create({
          data: {
            productId: area.productId,
            printableAreaId,
            variantId,
            baseImageUrl,
          },
        });

    const saved = await prisma.productMockupTemplate.findUnique({
      where: { id: template.id },
      include: { variant: true },
    });
    res.status(201).json(serializeMockupTemplate(saved));
  } catch (error) {
    res.status(500).json({
      message: "Failed to upload mockup template.",
      error: error.message,
    });
  }
}

async function savePerspectiveConfig(req, res) {
  try {
    const areaId = BigInt(req.params.areaId);
    const variantId = req.body.variantId ? BigInt(req.body.variantId) : null;
    if (!variantId)
      return res.status(400).json({ message: "Select a product color first." });
    const { points, holes = [] } = req.body;

    const valid =
      Array.isArray(points) &&
      points.length >= 3 &&
      points.every((p) => typeof p.x === "number" && typeof p.y === "number");
    const validHoles =
      Array.isArray(holes) &&
      holes.every(
        (hole) =>
          Array.isArray(hole) &&
          hole.length >= 3 &&
          hole.every((p) => typeof p.x === "number" && typeof p.y === "number"),
      );
    if (!valid || !validHoles) {
      return res.status(400).json({
        message: "points and holes must contain valid {x, y} coordinates.",
      });
    }

    const template = await prisma.productMockupTemplate.findFirst({
      where: { printableAreaId: areaId, variantId },
    });
    if (!template)
      return res
        .status(404)
        .json({ message: "Upload a mockup photo for this area first." });

    const updated = await prisma.productMockupTemplate.update({
      where: { id: template.id },
      data: { perspectiveConfig: { points, holes } },
    });

    res.json({
      id: updated.id.toString(),
      perspectiveConfig: updated.perspectiveConfig,
    });
  } catch (error) {
    res.status(500).json({
      message: "Failed to save print area shape.",
      error: error.message,
    });
  }
}

async function uploadDisplacementMap(req, res) {
  try {
    const areaId = BigInt(req.params.areaId);
    const variantId = req.body.variantId ? BigInt(req.body.variantId) : null;
    if (!variantId)
      return res.status(400).json({ message: "Select a product color first." });
    if (!req.file)
      return res.status(400).json({ message: "No file uploaded." });

    const template = await prisma.productMockupTemplate.findFirst({
      where: { printableAreaId: areaId, variantId },
    });
    if (!template)
      return res
        .status(404)
        .json({ message: "Upload a mockup photo for this area first." });

    const updated = await prisma.productMockupTemplate.update({
      where: { id: template.id },
      data: {
        displacementMapUrl: await storeUploadedFile(
          req.file,
          "displacement-maps",
          `area-${areaId}`,
        ),
      },
    });

    res.status(201).json({
      id: updated.id.toString(),
      displacementMapUrl: updated.displacementMapUrl,
    });
  } catch (error) {
    res.status(500).json({
      message: "Failed to upload displacement map.",
      error: error.message,
    });
  }
}

async function deleteProduct(req, res) {
  try {
    const id = BigInt(req.params.id);

    const orderItemCount = await prisma.orderItem.count({
      where: { variant: { productId: id } },
    });
    if (orderItemCount > 0) {
      return res.status(409).json({
        message:
          "Can't delete a product that has order history — deactivate it instead.",
      });
    }

    await prisma.$transaction([
      prisma.productImage.deleteMany({ where: { productId: id } }),
      prisma.printableArea.deleteMany({ where: { productId: id } }),
      prisma.productVariant.deleteMany({ where: { productId: id } }),
      prisma.product.delete({ where: { id } }),
    ]);

    res.status(204).send();
  } catch (error) {
    res
      .status(500)
      .json({ message: "Failed to delete product.", error: error.message });
  }
}

module.exports = {
  listAllProducts,
  getProductForAdmin,
  createProduct,
  updateProduct,
  toggleActive,
  deleteProduct,
  upsertVariant,
  addProductImage,
  deleteProductImage,
  setPrimaryImage,
  upsertPrintableArea,
  adjustStock,
  uploadMockupTemplate,
  savePerspectiveConfig,
  uploadDisplacementMap,
};
