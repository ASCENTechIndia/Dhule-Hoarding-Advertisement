const express = require('express');
const {
  getNoticeNirmitiReport,getNoticePaymentReport,getPanchanamaNirmitiReport
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

router.get(
  "/getPanchanamaNirmitiReport",
  getPanchanamaNirmitiReport
);

module.exports = router;
