const {
 getNoticeNirmitiReportRepo
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


module.exports = {
  getNoticeNirmitiReportService
};