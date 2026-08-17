const express = require('express');
const authRoutes = require('../modules/auth/auth.routes');
const authComplaintRoutes = require('../modules/authComplaint/authComplaint.routes');

const router = express.Router();

router.get('/health', (req, res) => {
  return res.ok(null, 'ok');
});

router.get('/ready', (req, res) => {
  return res.ok(null, 'ready');
});

router.use('/auth', authRoutes);
// router.use('/authComplaint', authComplaintRoutes);
router.use('/advertisement',require('../modules/registerComplaint/registerComplaint.routes'));
// router.use('/authComplaint', require('../modules/authComplaint/authComplaint.routes'));
// router.use('/report', require('../modules/report/report.routes'));
// router.use("/dashboard", require("../modules/dashbaord/dashbaord.routes"))
module.exports = router;
