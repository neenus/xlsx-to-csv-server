// Convert Routes

const express = require("express");
const router = express.Router();
const { convertFile, parseHeaders } = require("../controllers/convert.controller");

router.route("/").post(convertFile);
router.route("/parse-headers").post(parseHeaders);

module.exports = router;
