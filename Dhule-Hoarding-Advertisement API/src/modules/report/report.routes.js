const express = require('express');
const {
  getNoticeNirmitiReport,getNoticePaymentReport,
  getPanchanamaNirmitiReport,getIllegalHoardWardwiseReport
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

router.get(
  "/getIllegalHoardWardwiseReport",
  getIllegalHoardWardwiseReport
);

module.exports = router;
