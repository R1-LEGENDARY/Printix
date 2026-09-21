const prisma = require("../db");

const PAID_STATUSES = [
  "paid",
  "processing",
  "printing",
  "shipped",
  "delivered",
];

async function getSalesAnalytics(req, res) {
  try {
    const { days = 30 } = req.query;
    const since = new Date();
    since.setDate(since.getDate() - Number(days));

    const orders = await prisma.order.findMany({
      where: { status: { in: PAID_STATUSES }, placedAt: { gte: since } },
      select: { placedAt: true, grandTotal: true },
      orderBy: { placedAt: "asc" },
    });

    const revenueByDay = {};
    for (const o of orders) {
      const key = o.placedAt.toISOString().slice(0, 10);
      revenueByDay[key] = (revenueByDay[key] || 0) + Number(o.grandTotal);
    }
    const revenueTimeline = Object.entries(revenueByDay).map(
      ([date, revenue]) => ({ date, revenue }),
    );

    const items = await prisma.orderItem.findMany({
      where: {
        order: { status: { in: PAID_STATUSES }, placedAt: { gte: since } },
      },
      select: { productName: true, quantity: true, lineTotal: true },
    });

    const byProduct = {};
    for (const i of items) {
      if (!byProduct[i.productName])
        byProduct[i.productName] = {
          name: i.productName,
          quantitySold: 0,
          revenue: 0,
        };
      byProduct[i.productName].quantitySold += i.quantity;
      byProduct[i.productName].revenue += Number(i.lineTotal);
    }
    const bestSellers = Object.values(byProduct)
      .sort((a, b) => b.quantitySold - a.quantitySold)
      .slice(0, 10);

    const lowStock = await prisma.productVariant.findMany({
      where: { stockQuantity: { lte: 5 } },
      include: { product: { select: { name: true } } },
      orderBy: { stockQuantity: "asc" },
      take: 20,
    });

    res.json({
      revenueTimeline,
      bestSellers,
      lowStock: lowStock.map((v) => ({
        id: v.id.toString(),
        productName: v.product.name,
        color: v.color,
        size: v.size,
        sku: v.sku,
        stockQuantity: v.stockQuantity,
      })),
      totalRevenue: orders.reduce((s, o) => s + Number(o.grandTotal), 0),
      totalOrders: orders.length,
    });
  } catch (error) {
    res
      .status(500)
      .json({ message: "Failed to fetch analytics.", error: error.message });
  }
}

module.exports = { getSalesAnalytics };
