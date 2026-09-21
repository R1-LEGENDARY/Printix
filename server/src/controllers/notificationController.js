const prisma = require("../db");

function serialize(notification) {
  return {
    id: notification.id.toString(),
    type: notification.type,
    channel: notification.channel,
    message: notification.message,
    relatedType: notification.relatedType,
    relatedId: notification.relatedId?.toString() || null,
    readAt: notification.readAt,
    createdAt: notification.createdAt,
  };
}

async function listNotifications(req, res) {
  try {
    const userId = BigInt(req.user.userId);
    const notifications = await prisma.notification.findMany({
      where: { userId },
      orderBy: { createdAt: "desc" },
      take: 50,
    });
    const unreadCount = await prisma.notification.count({
      where: { userId, readAt: null },
    });
    res.json({ notifications: notifications.map(serialize), unreadCount });
  } catch (error) {
    res.status(500).json({ message: "Failed to load notifications." });
  }
}

async function markRead(req, res) {
  try {
    await prisma.notification.updateMany({
      where: { id: BigInt(req.params.id), userId: BigInt(req.user.userId) },
      data: { readAt: new Date() },
    });
    res.sendStatus(204);
  } catch (error) {
    res.status(500).json({ message: "Failed to mark notification as read." });
  }
}

async function markAllRead(req, res) {
  try {
    await prisma.notification.updateMany({
      where: { userId: BigInt(req.user.userId), readAt: null },
      data: { readAt: new Date() },
    });
    res.sendStatus(204);
  } catch (error) {
    res.status(500).json({ message: "Failed to mark notifications as read." });
  }
}

module.exports = { listNotifications, markRead, markAllRead };
