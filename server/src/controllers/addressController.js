const prisma = require("../db");

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
    res
      .status(500)
      .json({ message: "Failed to fetch addresses.", error: error.message });
  }
}

async function updateAddress(req, res) {
  try {
    const userId = BigInt(req.user.userId);
    const id = BigInt(req.params.id);
    const {
      label,
      fullName,
      phone,
      line1,
      line2,
      city,
      province,
      postalCode,
      country,
      isDefault,
    } = req.body;

    const existing = await prisma.address.findFirst({ where: { id, userId } });
    if (!existing)
      return res.status(404).json({ message: "Address not found." });

    if (isDefault) {
      await prisma.address.updateMany({
        where: { userId },
        data: { isDefault: false },
      });
    }

    const updated = await prisma.address.update({
      where: { id },
      data: {
        label,
        fullName,
        phone,
        line1,
        line2,
        city,
        province,
        postalCode,
        country,
        isDefault: !!isDefault,
      },
    });
    res.json(serialize(updated));
  } catch (error) {
    res
      .status(500)
      .json({ message: "Failed to update address.", error: error.message });
  }
}

async function deleteAddress(req, res) {
  try {
    const userId = BigInt(req.user.userId);
    const id = BigInt(req.params.id);

    const existing = await prisma.address.findFirst({ where: { id, userId } });
    if (!existing)
      return res.status(404).json({ message: "Address not found." });

    const usedInOrders = await prisma.order.count({
      where: { OR: [{ shippingAddressId: id }, { billingAddressId: id }] },
    });
    if (usedInOrders > 0) {
      return res
        .status(409)
        .json({ message: "Can't delete an address used on a past order." });
    }

    await prisma.address.delete({ where: { id } });
    res.status(204).send();
  } catch (error) {
    res
      .status(500)
      .json({ message: "Failed to delete address.", error: error.message });
  }
}

async function setDefaultAddress(req, res) {
  try {
    const userId = BigInt(req.user.userId);
    const id = BigInt(req.params.id);

    const existing = await prisma.address.findFirst({ where: { id, userId } });
    if (!existing)
      return res.status(404).json({ message: "Address not found." });

    await prisma.$transaction([
      prisma.address.updateMany({
        where: { userId },
        data: { isDefault: false },
      }),
      prisma.address.update({ where: { id }, data: { isDefault: true } }),
    ]);

    res.json({ success: true });
  } catch (error) {
    res
      .status(500)
      .json({
        message: "Failed to set default address.",
        error: error.message,
      });
  }
}

async function createAddress(req, res) {
  try {
    const userId = BigInt(req.user.userId);
    const {
      label,
      fullName,
      phone,
      line1,
      line2,
      city,
      province,
      postalCode,
      country,
      isDefault,
    } = req.body;

    if (
      !fullName ||
      !phone ||
      !line1 ||
      !city ||
      !province ||
      !postalCode ||
      !country
    ) {
      return res
        .status(400)
        .json({ message: "Missing required address fields." });
    }

    if (isDefault) {
      await prisma.address.updateMany({
        where: { userId },
        data: { isDefault: false },
      });
    }

    const address = await prisma.address.create({
      data: {
        userId,
        label,
        fullName,
        phone,
        line1,
        line2,
        city,
        province,
        postalCode,
        country,
        isDefault: !!isDefault,
      },
    });

    res.status(201).json(serialize(address));
  } catch (error) {
    res
      .status(500)
      .json({ message: "Failed to create address.", error: error.message });
  }
}

module.exports = {
  listAddresses,
  createAddress,
  updateAddress,
  deleteAddress,
  setDefaultAddress,
};
