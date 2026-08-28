const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

function serialize(c) {
  return {
    id: c.id.toString(),
    name: c.name,
    slug: c.slug,
    parentId: c.parentId ? c.parentId.toString() : null,
    productCount: c._count?.products ?? undefined,
  };
}

function slugify(name) {
  return name.toLowerCase().trim().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");
}

async function listCategories(req, res) {
  try {
    const categories = await prisma.category.findMany({
      include: { _count: { select: { products: true } } },
      orderBy: { name: "asc" },
    });
    res.json(categories.map(serialize));
  } catch (error) {
    res.status(500).json({ message: "Failed to fetch categories.", error: error.message });
  }
}

async function createCategory(req, res) {
  try {
    const { name, parentId } = req.body;
    if (!name) return res.status(400).json({ message: "Name is required." });

    const slug = slugify(name);
    const existing = await prisma.category.findUnique({ where: { slug } });
    if (existing) return res.status(409).json({ message: "A category with a similar name already exists." });

    const category = await prisma.category.create({
      data: { name, slug, parentId: parentId ? BigInt(parentId) : null },
    });
    res.status(201).json(serialize(category));
  } catch (error) {
    res.status(500).json({ message: "Failed to create category.", error: error.message });
  }
}

async function updateCategory(req, res) {
  try {
    const id = BigInt(req.params.id);
    const { name, parentId } = req.body;

    const data = {};
    if (name !== undefined) {
      data.name = name;
      data.slug = slugify(name);
    }
    if (parentId !== undefined) {
      data.parentId = parentId ? BigInt(parentId) : null;
    }

    const category = await prisma.category.update({ where: { id }, data });
    res.json(serialize(category));
  } catch (error) {
    res.status(500).json({ message: "Failed to update category.", error: error.message });
  }
}

async function deleteCategory(req, res) {
  try {
    const id = BigInt(req.params.id);

    const productCount = await prisma.product.count({ where: { categoryId: id } });
    if (productCount > 0) {
      return res.status(409).json({
        message: `Can't delete — ${productCount} product(s) still use this category. Reassign them first.`,
      });
    }

    const childCount = await prisma.category.count({ where: { parentId: id } });
    if (childCount > 0) {
      return res.status(409).json({ message: "Can't delete — this category has subcategories. Remove those first." });
    }

    await prisma.category.delete({ where: { id } });
    res.status(204).send();
  } catch (error) {
    res.status(500).json({ message: "Failed to delete category.", error: error.message });
  }
}

module.exports = { listCategories, createCategory, updateCategory, deleteCategory };