const {
illegalHoardPaymentService,getIllegalHoardPaymentListService
} = require('./payment.service');

const { logApiSuccess, logApiError } = require('../../utils/log');

async function illegalHoardPayment(req, res, next) {
  try {
    const payload = req.body;

    const out = await illegalHoardPaymentService(payload);

    console.log("Illegal Hoard Payment OUT:", out);

    const isSuccess =
      String(out.errorCode) === "9999";

    if (isSuccess) {
      logApiSuccess(
        req,
        200,
        out.message
      );
    } else {
      logApiError(
        req,
        400,
        out.message,
        "Illegal Hoard Payment failed"
      );
    }

    auditLog({
      action: "ILLEGAL_HOARD_PAYMENT",
      actor:
        req.user?.userId ||
        payload.userId ||
        "system",

      module: "illegalHoard",

      status:
        isSuccess
          ? "SUCCESS"
          : "FAILED",

      details: {
        outErrorCode:
          out.errorCode,

        outErrorMsg:
          out.message,

        noticeNo:
          payload.noticeNo,
      },

      requestMeta:
        requestMeta(req),
    });

    return res.ok(out);

  } catch (error) {

    console.error(
      "Illegal Hoard Payment error:",
      error
    );

    logApiError(
      req,
      500,
      error.message,
      "Illegal Hoard Payment error"
    );

    return next(error);
  }
}

async function getIllegalHoardPaymentList(req, res, next) {
  try {
    const {
      fromDate = null,
      toDate = null,
      page = 1,
      limit = 10,
      ulbId,
      userId,
    } = req.query;

    const rows =
      await getIllegalHoardPaymentListService(
        ulbId,
        userId,
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
      "Illegal Hoard Payment List completed"
    );

    return res.ok(rows);

  } catch (error) {

    logApiError(
      req,
      500,
      error.message,
      "Illegal Hoard Payment List search error"
    );

    return next(error);
  }
}

module.exports = {
  illegalHoardPayment,
  getIllegalHoardPaymentList
};
