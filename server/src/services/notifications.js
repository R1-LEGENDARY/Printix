async function createNotification(prisma, { userId, type, message, relatedType, relatedId }) {
  try {
    return await prisma.notification.create({
      data: {
        userId,
        type,
        channel: "in_app",
        message,
        relatedType,
        relatedId,
      },
    });
  } catch (error) {
    console.error("Notification creation failed:", error.message);
    return null;
  }
}

module.exports = { createNotification };