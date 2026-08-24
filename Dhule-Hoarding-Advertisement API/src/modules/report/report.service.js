const {
 getNoticeNirmitiReportRepo,
 getNoticePaymentReportRepo
} = require("./report.repo");

async function getNoticeNirmitiReportService(
  ulbId,
  ward,
  officerDivision,
  paymentStatus,
  fromDate,
  toDate,
  page,
  limit
) {
  return getNoticeNirmitiReportRepo(
    ulbId,
    ward,
    officerDivision,
    paymentStatus,
    fromDate,
    toDate,
    page,
    limit
  );
}

async function getNoticePaymentReportService(
  ulbId,
  payMode,
  ward,
  notgenNo,
  fromDate,
  toDate,
  page,
  limit
) {
  return getNoticePaymentReportRepo(
    ulbId,
    payMode,
    ward,
    notgenNo,
    fromDate,
    toDate,
    page,
    limit
  );
}


module.exports = {
  getNoticeNirmitiReportService,
  getNoticePaymentReportService
};