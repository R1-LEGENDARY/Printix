const express = require("express");
const { requireAuth } = require("../middleware/authMiddleware");
const { createDesign, getDesign, saveDesign } = require("../controllers/designController");

const router = express.Router();

router.use(requireAuth);

router.post("/", createDesign);
router.get("/:id", getDesign);
router.put("/:id", saveDesign);

module.exports = router;