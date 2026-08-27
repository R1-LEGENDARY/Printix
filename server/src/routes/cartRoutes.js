const express = require("express");
const { optionalAuth } = require("../middleware/optionalAuth");
const { getCart, addItem, updateItem, removeItem } = require("../controllers/cartController");

const router = express.Router();

router.use(optionalAuth);

router.get("/", getCart);
router.post("/items", addItem);
router.put("/items/:itemId", updateItem);
router.delete("/items/:itemId", removeItem);

module.exports = router;