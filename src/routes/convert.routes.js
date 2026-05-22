// Convert Routes

const express = require("express");
const router = express.Router();
const { convertFile, parseHeaders } = require("../controllers/convert.controller");
const { requireAuth } = require("../middlewares/auth.middleware");

router.route("/").post(requireAuth, convertFile);
router.route("/parse-headers").post(requireAuth, parseHeaders);

module.exports = router;
