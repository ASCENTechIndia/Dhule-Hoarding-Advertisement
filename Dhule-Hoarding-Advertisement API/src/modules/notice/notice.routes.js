const express = require('express');
const validate = require('../../middleware/validate.middleware');
const { noticeSchema } = require('./notice.validation');
const {
  renderNoticeHtml,
  getNotice,
  generateNotice,
  generateNoticeFromDb
} = require('./notice.controller');

const router = express.Router();

router.get('/render', renderNoticeHtml);
router.post('/render', validate(noticeSchema), renderNoticeHtml);

router.post('/generate', validate(noticeSchema), generateNotice);

router.post(
  "/generate-from-db",
  generateNoticeFromDb
);

router.get('/getNotice', getNotice);
router.get('/:id', getNotice);

module.exports = router;
