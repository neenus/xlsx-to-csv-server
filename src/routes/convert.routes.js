// Convert Routes

const express = require("express");
const router = express.Router();
const { convertFile } = require("../controllers/convert.controller");

router.route("/").post(convertFile);

module.exports = router;
