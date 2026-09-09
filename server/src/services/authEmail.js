const nodemailer = require("nodemailer");

function getClientUrl() {
  return process.env.CLIENT_URL || "http://localhost:5173";
}

/*
 * DOCU: Builds the SMTP transport when email credentials are available and
 * allows local development to fall back to logging preview links.
 * @returns {Object|null} - A Nodemailer transporter, or null outside configured production email
 * @throws {Error} - Throws when production email is not configured
 *
 * Author: JC
 */
function getTransporter() {
  if (!process.env.SMTP_HOST || !process.env.SMTP_USER || !process.env.SMTP_PASS) {
    if (process.env.NODE_ENV === "production") {
      throw new Error("SMTP is not configured.");
    }
    return null;
  }

  return nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: Number(process.env.SMTP_PORT || 587),
    secure: process.env.SMTP_SECURE === "true",
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS,
    },
  });
}

/*
 * DOCU: Sends an authentication email through SMTP or logs its preview URL in local development.
 * @param {Object} data - Recipient, subject, text, HTML, and optional preview URL
 * @returns {Promise<void>} - Resolves after the message is sent or logged
 * @throws {Error} - Propagates SMTP configuration and delivery failures
 *
 * Author: JC
 */
async function sendAuthEmail({ to, subject, text, html, previewUrl }) {
  const transporter = getTransporter();
  if (!transporter) {
    console.log(`[auth email] ${subject} for ${to}: ${previewUrl}`);
    return;
  }

  await transporter.sendMail({
    from: process.env.SMTP_FROM || process.env.SMTP_USER,
    to,
    subject,
    text,
    html,
  });
}

/*
 * DOCU: Sends a password-reset link that expires according to the token policy.
 * @param {Object} user - User record containing name and email
 * @param {string} token - Password-reset token to include in the link
 * @returns {Promise<void>} - Resolves after the reset message is sent or logged
 * @throws {Error} - Propagates email configuration and delivery failures
 *
 * Author: JC
 */
async function sendPasswordResetEmail(user, token) {
  const url = `${getClientUrl()}/reset-password?token=${encodeURIComponent(token)}`;
  return sendAuthEmail({
    to: user.email,
    subject: "Reset your Printix password",
    previewUrl: url,
    text: `Hi ${user.name}, reset your Printix password here: ${url}`,
    html: `<p>Hi ${user.name},</p><p>Use this link to choose a new Printix password:</p><p><a href="${url}">Reset password</a></p><p>This link expires in 1 hour and can only be used once.</p>`,
  });
}

module.exports = { sendPasswordResetEmail };
