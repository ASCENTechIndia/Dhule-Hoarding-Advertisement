const express = require('express');
const {
  getNoticeNirmitiReport
} = require('./report.controller');

const router = express.Router();

router.get(
  "/getNoticeNirmitiReport",
  getNoticeNirmitiReport
);

module.exports = router;
