const express = require("express");
const {
	register,
	login,
	googleLogin,
	me,
	requestPasswordReset,
	resetPassword,
} = require("../controllers/authController");
const { updateProfile, changePassword } = require("../controllers/profileController");
const { requireAuth } = require("../middleware/authMiddleware");

const router = express.Router();

router.post("/register", register);
router.post("/login", login);
router.post("/google", googleLogin);
router.post("/forgot-password", requestPasswordReset);
router.post("/reset-password/:token", resetPassword);
router.get("/me", requireAuth, me);
router.put("/me", requireAuth, updateProfile);
router.put("/me/password", requireAuth, changePassword);

module.exports = router;