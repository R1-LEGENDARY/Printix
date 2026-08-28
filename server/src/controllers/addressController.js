const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

function serialize(a) {
  return {
    id: a.id.toString(),
    label: a.label,
    fullName: a.fullName,
    phone: a.phone,
    line1: a.line1,
    line2: a.line2,
    city: a.city,
    province: a.province,
    postalCode: a.postalCode,
    country: a.country,
    isDefault: a.isDefault,
  };
}

async function listAddresses(req, res) {
  try {
    const addresses = await prisma.address.findMany({
      where: { userId: BigInt(req.user.userId) },
      orderBy: { isDefault: "desc" },
    });
    res.json(addresses.map(serialize));
  } catch (error) {
    res.status(500).json({ message: "Failed to fetch addresses.", error: error.message });
  }
}

async function createAddress(req, res) {
  try {
    const userId = BigInt(req.user.userId);
    const { label, fullName, phone, line1, line2, city, province, postalCode, country, isDefault } = req.body;

    if (!fullName || !phone || !line1 || !city || !province || !postalCode || !country) {
      return res.status(400).json({ message: "Missing required address fields." });
    }

    if (isDefault) {
      await prisma.address.updateMany({ where: { userId }, data: { isDefault: false } });
    }

    const address = await prisma.address.create({
      data: { userId, label, fullName, phone, line1, line2, city, province, postalCode, country, isDefault: !!isDefault },
    });

    res.status(201).json(serialize(address));
  } catch (error) {
    res.status(500).json({ message: "Failed to create address.", error: error.message });
  }
}

module.exports = { listAddresses, createAddress };