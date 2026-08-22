const express = require('express');
const validate = require('../../middleware/validate.middleware');
const { illegalHoardPaymentSchema } = require('./payment.validation');
const {
  illegalHoardPayment,
  getIllegalHoardPaymentList
} = require('./payment.controller');

const router = express.Router();

router.post(
  "/add-payment",
  validate(illegalHoardPaymentSchema),
  illegalHoardPayment
);

router.get(
  "/getIllegalHoardPaymentList",
  getIllegalHoardPaymentList
);

module.exports = router;
