const bcrypt = require("bcrypt");
const prisma = require("../db");

async function updateProfile(req, res) {
  try {
    const userId = BigInt(req.user.userId);
    const { name } = req.body;

    if (!name || !name.trim()) {
      return res.status(400).json({ message: "Name is required." });
    }

    const updated = await prisma.user.update({
      where: { id: userId },
      data: { name: name.trim() },
    });
    res.json({
      id: updated.id.toString(),
      name: updated.name,
      email: updated.email,
      role: updated.role,
    });
  } catch (error) {
    res
      .status(500)
      .json({ message: "Failed to update profile.", error: error.message });
  }
}

async function changePassword(req, res) {
  try {
    const userId = BigInt(req.user.userId);
    const { currentPassword, newPassword } = req.body;

    if (!currentPassword || !newPassword || newPassword.length < 8) {
      return res
        .status(400)
        .json({
          message:
            "Current password and a new password (8+ characters) are required.",
        });
    }

    const user = await prisma.user.findUnique({ where: { id: userId } });
    const valid = await bcrypt.compare(currentPassword, user.passwordHash);
    if (!valid) {
      return res
        .status(401)
        .json({ message: "Current password is incorrect." });
    }

    const passwordHash = await bcrypt.hash(newPassword, 12);
    await prisma.user.update({ where: { id: userId }, data: { passwordHash } });
    res.json({ success: true });
  } catch (error) {
    res
      .status(500)
      .json({ message: "Failed to change password.", error: error.message });
  }
}

module.exports = { updateProfile, changePassword };
