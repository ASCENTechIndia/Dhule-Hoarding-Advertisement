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
  limit,
  search
) {
  return getIllegalHoardPaymentListRepo(
    ulbId,
    userId,
    fromDate,
    toDate,
    page,
    limit,
    search
  );
}


module.exports = {
  illegalHoardPaymentService,
  getIllegalHoardPaymentListService
};