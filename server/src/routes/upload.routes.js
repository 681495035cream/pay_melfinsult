const express = require("express");
const { uploadFile } = require("../controllers/upload.controller");

const router = express.Router();

router.post("/", express.raw({ type: "*/*", limit: "10mb" }), uploadFile);

module.exports = router;
