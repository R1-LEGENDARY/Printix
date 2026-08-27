const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

async function main() {
  const category = await prisma.category.create({
    data: {
      name: "T-Shirts",
      slug: "t-shirts",
    },
  });

  const product = await prisma.product.create({
    data: {
      categoryId: category.id,
      name: "Classic Crew Tee",
      slug: "classic-crew-tee",
      description: "A soft, everyday cotton t-shirt — customize it with your own design.",
      basePrice: 19.99,
      isActive: true,
    },
  });

  await prisma.printableArea.createMany({
    data: [
      { productId: product.id, name: "Front", x: 100, y: 100, width: 300, height: 400 },
      { productId: product.id, name: "Back", x: 100, y: 100, width: 300, height: 400 },
    ],
  });

  await prisma.productVariant.createMany({
    data: [
      { productId: product.id, color: "White", size: "M", sku: "TEE-WHITE-M", stockQuantity: 50 },
      { productId: product.id, color: "Black", size: "M", sku: "TEE-BLACK-M", stockQuantity: 50 },
    ],
  });

  await prisma.productImage.create({
    data: {
      productId: product.id,
      imageUrl: "https://placehold.co/600x600?text=Classic+Crew+Tee",
      isPrimary: true,
    },
  });

  console.log("Seed complete:", product.name);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });