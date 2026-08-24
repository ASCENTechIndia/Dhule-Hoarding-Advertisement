const {
 getNoticeNirmitiReportRepo,
 getNoticePaymentReportRepo,
 getPanchanamaNirmitiReportRepo,
 getIllegalHoardWardwiseReportRepo,
 getIllegalHoardMonthwiseReportRepo
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

async function getPanchanamaNirmitiReportService(
  ulbId,
  officerDivision,
  ward,
  fromDate,
  toDate,
  page,
  limit
) {
  return getPanchanamaNirmitiReportRepo(
    ulbId,
    officerDivision,
    ward,
    fromDate,
    toDate,
    page,
    limit
  );
}

async function getIllegalHoardWardwiseReportService(
  ulbId,
  ward,
  fromDate,
  toDate,
  page,
  limit
) {
  return getIllegalHoardWardwiseReportRepo(
    ulbId,
    ward,
    fromDate,
    toDate,
    page,
    limit
  );
}

async function getIllegalHoardMonthwiseReportService(
  ulbId,
  year,
  monthNo,
  page,
  limit
) {
  return getIllegalHoardMonthwiseReportRepo(
    ulbId,
    year,
    monthNo,
    page,
    limit
  );
}


module.exports = {
  getNoticeNirmitiReportService,
  getNoticePaymentReportService,
  getPanchanamaNirmitiReportService,
  getIllegalHoardWardwiseReportService,
  getIllegalHoardMonthwiseReportService
};