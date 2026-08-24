const oracledb = require('oracledb');
const { executeQuery } = require('../../db/queryExecutor');
const { executeProcedure } = require('../../db/procedureExecutor');

function parseOracleDate(dateValue) {
  if (!dateValue) return null;

  if (dateValue instanceof Date) {
    return dateValue;
  }

  // Expected input: YYYY-MM-DD
  const [year, month, day] = String(dateValue).split("-").map(Number);

  if (!year || !month || !day) {
    throw new Error(`Invalid cheque date: ${dateValue}`);
  }

  return new Date(year, month - 1, day);
}

async function illegalHoardPaymentRepo(payload) {

  const statement = `
    BEGIN

      AOAD_ILLEGALHOARD_PAYMENT_INS(

        :in_userid,
        :in_ulbid,
        :in_noticeno,
        :in_paymentmode,
        :in_bankname,
        :in_bankbranch,
        :in_chequeno,
        :in_chequedate,
        :in_remark,
        :in_micrcode,
        :in_chequetype,
        :in_tranid,
        :in_mobileno,
        :in_email,
        :in_address,
        :in_name,
        :in_COLL_amount,

        :out_errcode,
        :out_errmsg

      );

    END;
  `;

  const binds = {

    // User ID
    in_userid:
      payload.userId || null,

    // ULB ID
    in_ulbid:
      payload.ulbId || null,

    // Notice Number
    in_noticeno:
      payload.noticeNo || null,

    // Payment Mode
    in_paymentmode:
      payload.paymentMode || null,

    // Bank Name
    in_bankname:
      payload.bankName || null,

    // Bank Branch
    in_bankbranch:
      payload.bankBranch || null,

    // Cheque Number
    in_chequeno:
      payload.chequeNo || null,

    // Cheque Date
    in_chequedate:
  parseOracleDate(payload.chequeDate),

    // Remark
    in_remark:
      payload.remark || null,

    // MICR Code
    in_micrcode:
      payload.micrCode || null,

    // Cheque Type
    in_chequetype:
      payload.chequeType || null,

    // Transaction ID
    in_tranid:
      payload.transactionId || null,

    // Mobile Number
    in_mobileno:
      payload.mobileNo || null,

    // Email
    in_email:
      payload.email || null,

    // Address
    in_address:
      payload.address || null,

    // Name
    in_name:
      payload.name || null,

    // Collection Amount
    in_COLL_amount:
      payload.collectionAmount || null,

    // OUT ERROR CODE
    out_errcode: {
      dir: oracledb.BIND_OUT,
      type: oracledb.NUMBER,
    },

    // OUT ERROR MESSAGE
    out_errmsg: {
      dir: oracledb.BIND_OUT,
      type: oracledb.STRING,
      maxSize: 1000,
    },
  };

  const result = await executeProcedure({
    statement,
    binds,
    useTx: false,
  });

  const out = result.outBinds;

  return {
    errorCode:
      out.out_errcode,

    message:
      out.out_errmsg,
  };
}

async function getIllegalHoardPaymentListRepo(
  ulbId,
  userId,
  fromDate,
  toDate,
  page = 1,
  limit = 10
) {
  const pageNumber = Number(page) || 1;
  const limitNumber = Number(limit) || 10;
  const offset = (pageNumber - 1) * limitNumber;

  let sql = `
    SELECT
      num_illegalhoard_id,
      num_illegalhoard_ulbid,
      var_userid,
      dat_cap_dt,
      var_cap_time,
      var_user1,
      var_user1_post,
      var_illegalhoard_add,
      dat_from_dt,
      var_illegalhoard_ward,
      var_illegalhoard_panchanama_no,
      var_notgen_no,
      num_notgen_amt,
      dt_notgen_date,
      var_notgen_paymentstatus
    FROM VW_ILLEGALHOARD_PAY_VIEW
    WHERE num_illegalhoard_ulbid = :ulbId
      AND var_userid = :userId
  `;

  const binds = {
    ulbId,
    userId,
  };

  if (fromDate && toDate) {
    sql += `
      AND TRUNC(dat_cap_dt) BETWEEN
        TO_DATE(:fromDate, 'YYYY-MM-DD')
        AND TO_DATE(:toDate, 'YYYY-MM-DD')
    `;

    binds.fromDate = fromDate;
    binds.toDate = toDate;
  }

  sql += `
    ORDER BY num_illegalhoard_id DESC
    OFFSET :offset ROWS
    FETCH NEXT :limit ROWS ONLY
  `;

  binds.offset = offset;
  binds.limit = limitNumber;

  const result = await executeQuery(
    sql,
    binds,
    { dbName: "db3" }
  );

  const rows = result.rows || [];

  // Count
  let countSql = `
    SELECT COUNT(*) AS TOTAL
    FROM VW_ILLEGALHOARD_PAY_VIEW
    WHERE num_illegalhoard_ulbid = :ulbId
      AND var_userid = :userId
  `;

  const countBinds = {
    ulbId,
    userId,
  };

  if (fromDate && toDate) {
    countSql += `
      AND TRUNC(dat_cap_dt) BETWEEN
        TO_DATE(:fromDate, 'YYYY-MM-DD')
        AND TO_DATE(:toDate, 'YYYY-MM-DD')
    `;

    countBinds.fromDate = fromDate;
    countBinds.toDate = toDate;
  }

  const countResult = await executeQuery(
    countSql,
    countBinds,
    { dbName: "db3" }
  );

  const total =
    Number(countResult.rows?.[0]?.TOTAL) || 0;

  return {
    data: rows,

    pagination: {
      page: pageNumber,
      limit: limitNumber,
      total,
      totalPages: Math.ceil(
        total / limitNumber
      ),
    },
  };
}

module.exports = {
  illegalHoardPaymentRepo,
  getIllegalHoardPaymentListRepo
  
};
