const express = require("express");
const { register, login, me } = require("../controllers/authController");
const { updateProfile, changePassword } = require("../controllers/profileController");
const { requireAuth } = require("../middleware/authMiddleware");

const router = express.Router();

router.post("/register", register);
router.post("/login", login);
router.get("/me", requireAuth, me);
router.put("/me", requireAuth, updateProfile);
router.put("/me/password", requireAuth, changePassword);

module.exports = router;