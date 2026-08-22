const {
  illegalHoardPaymentRepo,
  getIllegalHoardPaymentListRepo
} = require("./payment.repo");

async function illegalHoardPaymentService(payload) {
  return illegalHoardPaymentRepo(payload);
}

async function getIllegalHoardPaymentListService(
  ulbId,
  userId,
  fromDate,
  toDate,
  page,
  limit
) {
  return getIllegalHoardPaymentListRepo(
    ulbId,
    userId,
    fromDate,
    toDate,
    page,
    limit
  );
}


module.exports = {
  illegalHoardPaymentService,
  getIllegalHoardPaymentListService
};