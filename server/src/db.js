const { PrismaClient } = require("@prisma/client");

const prisma = globalThis.__printixPrisma || new PrismaClient();

if (process.env.NODE_ENV !== "production") {
  globalThis.__printixPrisma = prisma;
}

module.exports = prisma;
