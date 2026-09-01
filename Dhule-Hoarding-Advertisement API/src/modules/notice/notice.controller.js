const {
  renderNoticeHtmlService,
  getNoticeByIdService,
  generateNoticeService,
  generateNoticeFromDbService
} = require('./notice.service');

const {repoGetNoticeData} = require('./notice.repo')
const { logApiSuccess, logApiError } = require('../../utils/log');

async function renderNoticeHtml(req, res, next) {
  try {
    const payload = { ...req.query, ...req.body };

    const noticeData = await repoGetNoticeData(payload.ID);

      if (!noticeData) {
        throw new Error(
          "Notice data not found for ID: 26"
        );
      }

    const html = await renderNoticeHtmlService({...noticeData,...payload});

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

async function generateNotice(req, res, next) {
  try {
    const payload = req.body;

    // Service returns the signed PDF Buffer directly
    const signedPdfBuffer =
      await generateNoticeService(payload);

    // Validate signed PDF
    if (
      !Buffer.isBuffer(signedPdfBuffer) ||
      signedPdfBuffer.length === 0
    ) {
      throw new Error(
        "Signed PDF was not generated"
      );
    }

    // PDF response headers
    res.setHeader(
      "Content-Type",
      "application/pdf"
    );

    res.setHeader(
      "Content-Disposition",
      `inline; filename="notice-${payload.PANCHANAMA_NO || "document"}.pdf"`
    );

    res.setHeader(
      "Content-Length",
      signedPdfBuffer.length
    );

    // Return signed PDF
    return res.send(
      signedPdfBuffer
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

async function generateNoticeFromDb(req, res, next) {
  try {
    const payload = req.body;

    const signedPdfBuffer =
      await generateNoticeFromDbService(payload);

    if (
      !Buffer.isBuffer(signedPdfBuffer) ||
      signedPdfBuffer.length === 0
    ) {
      throw new Error("Signed PDF was not generated");
    }

    res.setHeader(
      "Content-Type",
      "application/pdf"
    );

    res.setHeader(
      "Content-Disposition",
      `inline; filename="notice-${
        payload.PANCHANAMA_NO || "document"
      }.pdf"`
    );

    res.setHeader(
      "Content-Length",
      signedPdfBuffer.length
    );

    return res.send(signedPdfBuffer);

  } catch (error) {
    logApiError(
      req,
      500,
      error.message,
      "Generate Notice From DB error"
    );

    return next(error);
  }
}

module.exports = {
  renderNoticeHtml,
  getNotice,
  generateNotice,
  generateNoticeFromDb
};
