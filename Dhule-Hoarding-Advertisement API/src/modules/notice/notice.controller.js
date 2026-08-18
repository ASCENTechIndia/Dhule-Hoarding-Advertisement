const {
  renderNoticeHtmlService,
  getNoticeByIdService,
  generateNoticeService,
} = require('./notice.service');
const { logApiSuccess, logApiError } = require('../../utils/log');

async function renderNoticeHtml(req, res, next) {
  try {
    const payload = { ...req.query, ...req.body };
    const html = await renderNoticeHtmlService(payload);

    if (req.query.format === 'html' || req.headers.accept?.includes('text/html')) {
      res.setHeader('Content-Type', 'text/html');
      return res.send(html);
    }

    logApiSuccess(req, 200, { htmlLength: html.length }, 'Render Notice HTML completed');
    return res.ok({ html, data: payload });
  } catch (error) {
    logApiError(req, 500, error.message, 'Render Notice HTML error');
    return next(error);
  }
}

async function getNotice(req, res, next) {
  try {
    const id = req.params.id || req.query.id;
    const result = await getNoticeByIdService(id);

    if (req.query.format === 'html' || req.headers.accept?.includes('text/html')) {
      res.setHeader('Content-Type', 'text/html');
      return res.send(result.html);
    }

    logApiSuccess(req, 200, { id }, 'Get Notice completed');
    return res.ok(result);
  } catch (error) {
    logApiError(req, 500, error.message, 'Get Notice error');
    return next(error);
  }
}

async function generateNotice(
  req,
  res,
  next
) {

  try {

    const payload =
      req.body;


    const result =
      await generateNoticeService(
        payload
      );


    if (
      !result?.pdf ||
      !Buffer.isBuffer(
        result.pdf
      )
    ) {

      throw new Error(
        "Signed PDF was not generated"
      );
    }


    res.setHeader(
      "Content-Type",
      "application/pdf"
    );


    res.setHeader(
      "Content-Disposition",
      `inline; filename="notice-${
        result.noticeData?.noticeNo ||
        "document"
      }.pdf"`
    );


    res.setHeader(
      "Content-Length",
      result.pdf.length
    );


    return res.send(
      result.pdf
    );

  } catch (error) {

    logApiError(
      req,
      500,
      error.message,
      "Generate Notice error"
    );

    return next(error);
  }
}

module.exports = {
  renderNoticeHtml,
  getNotice,
  generateNotice,
};
