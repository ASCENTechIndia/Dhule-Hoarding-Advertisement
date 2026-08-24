const express = require('express');
const {
  getNoticeNirmitiReport,getNoticePaymentReport,
  getPanchanamaNirmitiReport,getIllegalHoardWardwiseReport,
  getIllegalHoardMonthwiseReport
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

router.get(
  "/getIllegalHoardMonthwiseReport",
  getIllegalHoardMonthwiseReport
);

module.exports = router;
