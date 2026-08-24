const express = require('express');
const {
  getNoticeNirmitiReport,getNoticePaymentReport
} = require('./report.controller');

const router = express.Router();

router.get(
  "/getNoticeNirmitiReport",
  getNoticeNirmitiReport
);

router.get(
  "/getNoticePaymentReport",
  getNoticePaymentReport
);

module.exports = router;
