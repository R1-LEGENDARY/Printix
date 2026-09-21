const prisma = require("../db");

async function getMetrics(req, res) {
  try {
    const [
      totalOrders,
      pendingOrders,
      totalRevenueResult,
      totalProducts,
      totalCustomers,
      lowStockVariants,
      recentOrders,
    ] = await Promise.all([
      prisma.order.count(),
      prisma.order.count({ where: { status: "pending" } }),
      prisma.order.aggregate({
        _sum: { grandTotal: true },
        where: {
          status: {
            in: ["paid", "processing", "printing", "shipped", "delivered"],
          },
        },
      }),
      prisma.product.count({ where: { isActive: true } }),
      prisma.user.count({ where: { role: "customer" } }),
      prisma.productVariant.count({ where: { stockQuantity: { lte: 5 } } }),
      prisma.order.findMany({
        take: 5,
        orderBy: { createdAt: "desc" },
        include: { user: { select: { name: true, email: true } } },
      }),
    ]);

    res.json({
      totalOrders,
      pendingOrders,
      totalRevenue: totalRevenueResult._sum.grandTotal || 0,
      totalProducts,
      totalCustomers,
      lowStockVariants,
      recentOrders: recentOrders.map((o) => ({
        id: o.id.toString(),
        orderNumber: o.orderNumber,
        status: o.status,
        grandTotal: o.grandTotal,
        placedAt: o.placedAt,
        customerName: o.user.name,
      })),
    });
  } catch (error) {
    res
      .status(500)
      .json({ message: "Failed to load metrics.", error: error.message });
  }
}

module.exports = { getMetrics };
