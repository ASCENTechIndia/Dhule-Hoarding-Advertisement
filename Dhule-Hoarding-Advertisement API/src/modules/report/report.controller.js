const {getNoticeNirmitiReportService
} = require('./report.service');

const { auditLog } = require('../../utils/audit-log');

const { logApiSuccess, logApiError } = require('../../utils/log');

function requestMeta(req) {
  return {
    ip: req.ip,
    method: req.method,
    path: req.originalUrl,
  };
}

async function getNoticeNirmitiReport(req, res, next) {
  try {
    const {
      ulbId,
      ward = null,
      officerDivision = null,
      paymentStatus = null,
      fromDate = null,
      toDate = null,
      page = 1,
      limit = 10,
    } = req.query;

    const rows = await getNoticeNirmitiReportService(
      ulbId,
      ward,
      officerDivision,
      paymentStatus,
      fromDate,
      toDate,
      page,
      limit
    );

    logApiSuccess(
      req,
      200,
      {
        count: rows?.data?.length || 0,
      },
      "Notice Nirmiti Report completed"
    );

    return res.ok(rows);

  } catch (error) {
    logApiError(
      req,
      500,
      error.message,
      "Notice Nirmiti Report search error"
    );

    return next(error);
  }
}

module.exports = {
  getNoticeNirmitiReport
};
