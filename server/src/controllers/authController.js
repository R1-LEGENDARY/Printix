const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const crypto = require("crypto");
const { PrismaClient } = require("@prisma/client");
const { OAuth2Client } = require("google-auth-library");
const { sendPasswordResetEmail } = require("../services/authEmail");

const prisma = new PrismaClient();
const googleClient = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);

function hashToken(token) {
  return crypto.createHash("sha256").update(token).digest("hex");
}

async function register(req, res) {
  try {
    const { firstName, lastName, name: legacyName, email: rawEmail, password } = req.body;
    const name = firstName && lastName ? `${firstName.trim()} ${lastName.trim()}` : legacyName?.trim();
    const email = rawEmail?.trim().toLowerCase();

    if (!name || !email || !password) {
      return res.status(400).json({ message: "Name, email, and password are required." });
    }
    if (password.length < 8) {
      return res.status(400).json({ message: "Password must be at least 8 characters." });
    }

    const existing = await prisma.user.findUnique({ where: { email } });
    if (existing) {
      return res.status(409).json({ message: "Email is already registered." });
    }

    const passwordHash = await bcrypt.hash(password, 12);

    const user = await prisma.user.create({
      data: { name, email, passwordHash },
    });

    res.status(201).json({
      id: user.id.toString(),
      name: user.name,
      email: user.email,
      message: "Account created. You can log in now.",
    });
  } catch (error) {
    res.status(500).json({ message: "Registration failed.", error: error.message });
  }
}

async function login(req, res) {
  try {
    const { email: rawEmail, password } = req.body;
    const email = rawEmail?.trim().toLowerCase();

    if (!email || !password) {
      return res.status(400).json({ message: "Email and password are required." });
    }

    const user = await prisma.user.findUnique({ where: { email } });
    if (!user) {
      return res.status(401).json({ message: "Invalid credentials." });
    }

    const valid = await bcrypt.compare(password, user.passwordHash);
    if (!valid) {
      return res.status(401).json({ message: "Invalid credentials." });
    }

    const token = jwt.sign(
      { userId: user.id.toString(), role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: "7d" }
    );

    res.json({
      token,
      user: { id: user.id.toString(), name: user.name, email: user.email, role: user.role, emailVerifiedAt: user.emailVerifiedAt },
    });
  } catch (error) {
    res.status(500).json({ message: "Login failed.", error: error.message });
  }
}

async function googleLogin(req, res) {
  try {
    const { credential } = req.body;
    if (!credential || !process.env.GOOGLE_CLIENT_ID) {
      return res.status(400).json({ message: "Google sign-in is not configured." });
    }

    const ticket = await googleClient.verifyIdToken({
      idToken: credential,
      audience: process.env.GOOGLE_CLIENT_ID,
    });
    const payload = ticket.getPayload();
    if (!payload?.sub || !payload.email || payload.email_verified !== true) {
      return res.status(401).json({ message: "Unable to verify your Google account." });
    }

    const email = payload.email.trim().toLowerCase();
    let user = await prisma.user.findFirst({
      where: { OR: [{ googleId: payload.sub }, { email }] },
    });

    if (!user) {
      const passwordHash = await bcrypt.hash(crypto.randomBytes(32).toString("hex"), 12);
      user = await prisma.user.create({
        data: {
          name: payload.name || email.split("@")[0],
          email,
          googleId: payload.sub,
          passwordHash,
          emailVerifiedAt: new Date(),
        },
      });
    } else if (!user.googleId) {
      user = await prisma.user.update({
        where: { id: user.id },
        data: { googleId: payload.sub, emailVerifiedAt: user.emailVerifiedAt || new Date() },
      });
    }

    const token = jwt.sign(
      { userId: user.id.toString(), role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: "7d" }
    );

    res.json({
      token,
      user: {
        id: user.id.toString(),
        name: user.name,
        email: user.email,
        role: user.role,
        emailVerifiedAt: user.emailVerifiedAt,
      },
    });
  } catch (error) {
    res.status(401).json({ message: "Unable to verify your Google account." });
  }
}

async function me(req, res) {
  try {
    const user = await prisma.user.findUnique({ where: { id: BigInt(req.user.userId) } });
    if (!user) return res.status(404).json({ message: "User not found." });

    res.json({
      id: user.id.toString(),
      name: user.name,
      email: user.email,
      role: user.role,
      emailVerifiedAt: user.emailVerifiedAt,
    });
  } catch (error) {
    res.status(500).json({ message: "Failed to fetch user.", error: error.message });
  }
}

async function requestPasswordReset(req, res) {
  try {
    const email = req.body.email?.trim().toLowerCase();
    const genericResponse = { message: "A reset link has been sent. Please check your spam folder if you do not see it in your inbox." };
    if (!email) return res.json(genericResponse);

    const user = await prisma.user.findUnique({ where: { email } });
    if (!user) return res.json(genericResponse);

    const token = crypto.randomBytes(32).toString("hex");
    await prisma.passwordReset.updateMany({ where: { userId: user.id, usedAt: null }, data: { usedAt: new Date() } });
    const reset = await prisma.passwordReset.create({
      data: {
        userId: user.id,
        tokenHash: hashToken(token),
        expiresAt: new Date(Date.now() + 60 * 60 * 1000),
      },
    });

    try {
      await sendPasswordResetEmail(user, token);
    } catch (emailError) {
      await prisma.passwordReset.delete({ where: { id: reset.id } });
      return res.status(502).json({ message: "Unable to send the reset email. Check the server email settings." });
    }

    res.json(genericResponse);
  } catch (error) {
    res.status(500).json({ message: "Unable to request a reset link." });
  }
}

async function resetPassword(req, res) {
  const { password } = req.body;
  if (!password || password.length < 8) {
    return res.status(400).json({ message: "Password must be at least 8 characters." });
  }

  const reset = await prisma.passwordReset.findFirst({
    where: { tokenHash: hashToken(req.params.token), usedAt: null, expiresAt: { gt: new Date() } },
  });
  if (!reset) return res.status(400).json({ message: "This reset link is invalid or expired." });

  const passwordHash = await bcrypt.hash(password, 12);
  await prisma.$transaction([
    prisma.user.update({ where: { id: reset.userId }, data: { passwordHash } }),
    prisma.passwordReset.update({ where: { id: reset.id }, data: { usedAt: new Date() } }),
  ]);
  res.json({ message: "Password updated. You can now log in." });
}

module.exports = {
  register,
  login,
  googleLogin,
  me,
  requestPasswordReset,
  resetPassword,
};