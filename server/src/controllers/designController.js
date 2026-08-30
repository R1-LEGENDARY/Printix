const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

function serializeDesign(design) {
  return {
    id: design.id.toString(),
    name: design.name,
    status: design.status,
    productId: design.productId.toString(),
    latestMockupUrl: design.snapshots?.[0]?.mockupImageUrl || null,
    elements: design.elements.map((el) => ({
      id: el.id.toString(),
      printableAreaId: el.printableAreaId.toString(),
      type: el.type,
      layerOrder: el.layerOrder,
      posX: el.posX,
      posY: el.posY,
      width: el.width,
      height: el.height,
      rotation: el.rotation,
      image: el.image
        ? { fileUrl: el.image.fileUrl, originalFilename: el.image.originalFilename }
        : null,
      text: el.text
        ? {
            content: el.text.content,
            fontFamily: el.text.fontFamily,
            fontSize: el.text.fontSize,
            color: el.text.color,
            bold: el.text.bold,
            italic: el.text.italic,
            align: el.text.align,
          }
        : null,
    })),
  };
}

const designInclude = {
  elements: { include: { image: true, text: true } },
  snapshots: { orderBy: { createdAt: "desc" }, take: 1 },
};

async function createDesign(req, res) {
  try {
    const { productId } = req.body;
    if (!productId) return res.status(400).json({ message: "productId is required." });

    const userId = BigInt(req.user.userId);
    const productIdBig = BigInt(productId);

    let design = await prisma.design.findFirst({
      where: { userId, productId: productIdBig, status: "draft" },
      include: designInclude,
    });

    if (!design) {
      design = await prisma.design.create({
        data: { userId, productId: productIdBig, name: "Untitled design", status: "draft" },
        include: designInclude,
      });
    }

    res.status(201).json(serializeDesign(design));
  } catch (error) {
    res.status(500).json({ message: "Failed to create design.", error: error.message });
  }
}

async function getDesign(req, res) {
  try {
    const { id } = req.params;
    const design = await prisma.design.findUnique({
      where: { id: BigInt(id) },
      include: designInclude,
    });

    if (!design) return res.status(404).json({ message: "Design not found." });
    if (design.userId.toString() !== req.user.userId) {
      return res.status(403).json({ message: "Not authorized to view this design." });
    }

    res.json(serializeDesign(design));
  } catch (error) {
    res.status(500).json({ message: "Failed to fetch design.", error: error.message });
  }
}

async function saveDesign(req, res) {
  try {
    const { id } = req.params;
    const { name, elements, mockupImageDataUrl, printableAreaId } = req.body;

    const design = await prisma.design.findUnique({ where: { id: BigInt(id) } });
    if (!design) return res.status(404).json({ message: "Design not found." });
    if (design.userId.toString() !== req.user.userId) {
      return res.status(403).json({ message: "Not authorized to edit this design." });
    }

    await prisma.$transaction(async (tx) => {
      if (name) {
        await tx.design.update({ where: { id: design.id }, data: { name } });
      }

      const existing = await tx.designElement.findMany({ where: { designId: design.id } });
      const existingIds = existing.map((e) => e.id.toString());
      const incomingIds = elements.filter((e) => e.id).map((e) => e.id);

      const toDelete = existingIds.filter((id) => !incomingIds.includes(id));
      if (toDelete.length > 0) {
        await tx.designElement.deleteMany({ where: { id: { in: toDelete.map(BigInt) } } });
      }

      for (const el of elements) {
        let elementId;

        if (el.id) {
          await tx.designElement.update({
            where: { id: BigInt(el.id) },
            data: {
              printableAreaId: BigInt(el.printableAreaId),
              layerOrder: el.layerOrder,
              posX: el.posX,
              posY: el.posY,
              width: el.width,
              height: el.height,
              rotation: el.rotation,
            },
          });
          elementId = BigInt(el.id);
        } else {
          const created = await tx.designElement.create({
            data: {
              designId: design.id,
              printableAreaId: BigInt(el.printableAreaId),
              type: el.type,
              layerOrder: el.layerOrder,
              posX: el.posX,
              posY: el.posY,
              width: el.width,
              height: el.height,
              rotation: el.rotation,
            },
          });
          elementId = created.id;
        }

        if (el.type === "image" && el.image) {
          await tx.designElementImage.upsert({
            where: { designElementId: elementId },
            update: { fileUrl: el.image.fileUrl, originalFilename: el.image.originalFilename || "", mimeType: el.image.mimeType || "image/png", widthPx: el.image.widthPx || 0, heightPx: el.image.heightPx || 0 },
            create: { designElementId: elementId, fileUrl: el.image.fileUrl, originalFilename: el.image.originalFilename || "", mimeType: el.image.mimeType || "image/png", widthPx: el.image.widthPx || 0, heightPx: el.image.heightPx || 0 },
          });
        }

        if (el.type === "text" && el.text) {
          await tx.designElementText.upsert({
            where: { designElementId: elementId },
            update: { ...el.text },
            create: { designElementId: elementId, ...el.text },
          });
        }
      }
    });

    if (mockupImageDataUrl && printableAreaId) {
      const fs = require("fs");
      const path = require("path");
      const base64 = mockupImageDataUrl.replace(/^data:image\/png;base64,/, "");
      const filename = `mockup-${design.id}-${Date.now()}.png`;
      const filepath = path.join(__dirname, "../../uploads", filename);
      fs.writeFileSync(filepath, Buffer.from(base64, "base64"));

      await prisma.designSnapshot.create({
        data: {
          designId: design.id,
          printableAreaId: BigInt(printableAreaId),
          mockupImageUrl: `/uploads/${filename}`,
          elementsJson: JSON.parse(
            JSON.stringify(elements, (k, v) => (typeof v === "bigint" ? v.toString() : v))
          ),
        },
      });
    }

    const updated = await prisma.design.findUnique({ where: { id: design.id }, include: designInclude });
    res.json(serializeDesign(updated));
  } catch (error) {
    res.status(500).json({ message: "Failed to save design.", error: error.message });
  }
}

module.exports = { createDesign, getDesign, saveDesign };