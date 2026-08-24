const express = require('express');
const authRoutes = require('../modules/auth/auth.routes');

const router = express.Router();

router.get('/health', (req, res) => {
  return res.ok(null, 'ok');
});

router.get('/ready', (req, res) => {
  return res.ok(null, 'ready');
});

router.use('/auth', authRoutes);
router.use('/advertisement',require('../modules/registerComplaint/registerComplaint.routes'));
router.use('/notice', require('../modules/notice/notice.routes'));
router.use('/payment', require('../modules/payment/payment.routes'));
router.use('/report', require('../modules/report/report.routes'));
module.exports = router;
