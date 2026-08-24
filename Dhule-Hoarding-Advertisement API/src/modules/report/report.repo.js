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

async function getNoticeNirmitiReportRepo(
  ulbId,
  ward,
  officerDivision,
  paymentStatus,
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
      num_notgen_id,
      var_notgen_no,
      var_notgen_panchanama_no,
      dt_notgen_date,
      var_notgen_detail,
      num_notgen_ward,
      num_notgen_amt,
      var_notgen_paymentstatus,
      payment_date,
      num_illegalhoard_notgen_ulbid,
      var_officer_division
    FROM VW_NOTICE_NIRMITI_REPORT
    WHERE num_illegalhoard_notgen_ulbid = :ulbId
  `;

  const binds = {
    ulbId,
  };

  // Ward filter
  if (ward) {
    sql += `
      AND num_notgen_ward = :ward
    `;

    binds.ward = ward;
  }

  // Officer Division filter
  if (officerDivision) {
    sql += `
      AND var_officer_division = :officerDivision
    `;

    binds.officerDivision = officerDivision;
  }

  // Payment Status filter
  if (paymentStatus) {
    sql += `
      AND var_notgen_paymentstatus = :paymentStatus
    `;

    binds.paymentStatus = paymentStatus;
  }

  // Date filter
  if (fromDate && toDate) {
    sql += `
      AND TRUNC(dt_notgen_date) BETWEEN
        TO_DATE(:fromDate, 'YYYY-MM-DD')
        AND TO_DATE(:toDate, 'YYYY-MM-DD')
    `;

    binds.fromDate = fromDate;
    binds.toDate = toDate;
  } else if (fromDate) {
    sql += `
      AND TRUNC(dt_notgen_date) >=
        TO_DATE(:fromDate, 'YYYY-MM-DD')
    `;

    binds.fromDate = fromDate;
  } else if (toDate) {
    sql += `
      AND TRUNC(dt_notgen_date) <=
        TO_DATE(:toDate, 'YYYY-MM-DD')
    `;

    binds.toDate = toDate;
  }

  sql += `
    ORDER BY num_notgen_id DESC
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

  // ============================
  // Count Query
  // ============================

  let countSql = `
    SELECT COUNT(*) AS TOTAL
    FROM VW_NOTICE_NIRMITI_REPORT
    WHERE num_illegalhoard_notgen_ulbid = :ulbId
  `;

  const countBinds = {
    ulbId,
  };

  if (ward) {
    countSql += `
      AND num_notgen_ward = :ward
    `;

    countBinds.ward = ward;
  }

  if (officerDivision) {
    countSql += `
      AND var_officer_division = :officerDivision
    `;

    countBinds.officerDivision = officerDivision;
  }

  if (paymentStatus) {
    countSql += `
      AND var_notgen_paymentstatus = :paymentStatus
    `;

    countBinds.paymentStatus = paymentStatus;
  }

  if (fromDate && toDate) {
    countSql += `
      AND TRUNC(dt_notgen_date) BETWEEN
        TO_DATE(:fromDate, 'YYYY-MM-DD')
        AND TO_DATE(:toDate, 'YYYY-MM-DD')
    `;

    countBinds.fromDate = fromDate;
    countBinds.toDate = toDate;
  } else if (fromDate) {
    countSql += `
      AND TRUNC(dt_notgen_date) >=
        TO_DATE(:fromDate, 'YYYY-MM-DD')
    `;

    countBinds.fromDate = fromDate;
  } else if (toDate) {
    countSql += `
      AND TRUNC(dt_notgen_date) <=
        TO_DATE(:toDate, 'YYYY-MM-DD')
    `;

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
      totalPages: Math.ceil(total / limitNumber),
    },
  };
}


async function getNoticePaymentReportRepo(
  ulbId,
  payMode,
  ward,
  notgenNo,
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
      num_notgen_id,
      var_notgen_no,
      var_notgen_detail,
      num_notgen_ward,
      num_illegalhoard_coll_amt,
      var_notgen_paymentstatus,
      TO_CHAR(payment_date, 'YYYY-MM-DD') AS payment_date,
      num_illegalhoard_paymode,
      var_illegalhoard_tranid,
      num_illegalhoard_notgen_ulbid
    FROM VW_NOTICE_PAYMENT_REPORT
    WHERE num_illegalhoard_notgen_ulbid = :ulbId
  `;

  const binds = {
    ulbId,
  };

  // Payment Mode
  if (payMode) {
    sql += `
      AND num_illegalhoard_paymode = :payMode
    `;

    binds.payMode = payMode;
  }

  // Ward
  if (ward) {
    sql += `
      AND num_notgen_ward = :ward
    `;

    binds.ward = ward;
  }

  // Notice Number
  if (notgenNo) {
    sql += `
      AND var_notgen_no = :notgenNo
    `;

    binds.notgenNo = notgenNo;
  }

  // Payment Date Range
  if (fromDate && toDate) {
    sql += `
      AND TRUNC(payment_date) BETWEEN
        TO_DATE(:fromDate, 'YYYY-MM-DD')
        AND TO_DATE(:toDate, 'YYYY-MM-DD')
    `;

    binds.fromDate = fromDate;
    binds.toDate = toDate;
  } else if (fromDate) {
    sql += `
      AND TRUNC(payment_date) >=
        TO_DATE(:fromDate, 'YYYY-MM-DD')
    `;

    binds.fromDate = fromDate;
  } else if (toDate) {
    sql += `
      AND TRUNC(payment_date) <=
        TO_DATE(:toDate, 'YYYY-MM-DD')
    `;

    binds.toDate = toDate;
  }

  sql += `
    ORDER BY num_notgen_id DESC
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

  // ============================
  // Count Query
  // ============================

  let countSql = `
    SELECT COUNT(*) AS TOTAL
    FROM VW_NOTICE_PAYMENT_REPORT
    WHERE num_illegalhoard_notgen_ulbid = :ulbId
  `;

  const countBinds = {
    ulbId,
  };

  if (payMode) {
    countSql += `
      AND num_illegalhoard_paymode = :payMode
    `;

    countBinds.payMode = payMode;
  }

  if (ward) {
    countSql += `
      AND num_notgen_ward = :ward
    `;

    countBinds.ward = ward;
  }

  if (notgenNo) {
    countSql += `
      AND var_notgen_no = :notgenNo
    `;

    countBinds.notgenNo = notgenNo;
  }

  if (fromDate && toDate) {
    countSql += `
      AND TRUNC(payment_date) BETWEEN
        TO_DATE(:fromDate, 'YYYY-MM-DD')
        AND TO_DATE(:toDate, 'YYYY-MM-DD')
    `;

    countBinds.fromDate = fromDate;
    countBinds.toDate = toDate;
  } else if (fromDate) {
    countSql += `
      AND TRUNC(payment_date) >=
        TO_DATE(:fromDate, 'YYYY-MM-DD')
    `;

    countBinds.fromDate = fromDate;
  } else if (toDate) {
    countSql += `
      AND TRUNC(payment_date) <=
        TO_DATE(:toDate, 'YYYY-MM-DD')
    `;

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
      totalPages: Math.ceil(total / limitNumber),
    },
  };
}

async function getPanchanamaNirmitiReportRepo(
  ulbId,
  officerDivision,
  ward,
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
      var_illegalhoard_panchanama_no,
      TO_CHAR(dat_cap_dt, 'YYYY-MM-DD') AS dat_cap_dt,
      var_cap_time,
      var_notgen_no,
      var_user1,
      var_illegalhoard_add,
      var_illegalhoard_ward,
      var_officer_division,
      num_illegalhoard_ulbid
    FROM VW_PANCHANAMA_NIRMITI_REPORT
    WHERE num_illegalhoard_ulbid = :ulbId
  `;

  const binds = {
    ulbId,
  };

  // Officer Division
  if (officerDivision) {
    sql += `
      AND var_officer_division = :officerDivision
    `;

    binds.officerDivision = officerDivision;
  }

  // Ward
  if (ward) {
    sql += `
      AND var_illegalhoard_ward = :ward
    `;

    binds.ward = ward;
  }

  // Date Range
  if (fromDate && toDate) {
    sql += `
      AND dat_cap_dt >= TO_DATE(:fromDate, 'YYYY-MM-DD')
      AND dat_cap_dt < TO_DATE(:toDate, 'YYYY-MM-DD') + 1
    `;

    binds.fromDate = fromDate;
    binds.toDate = toDate;
  } else if (fromDate) {
    sql += `
      AND dat_cap_dt >= TO_DATE(:fromDate, 'YYYY-MM-DD')
    `;

    binds.fromDate = fromDate;
  } else if (toDate) {
    sql += `
      AND dat_cap_dt < TO_DATE(:toDate, 'YYYY-MM-DD') + 1
    `;

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

  // ============================
  // Count Query
  // ============================

  let countSql = `
    SELECT COUNT(*) AS TOTAL
    FROM VW_PANCHANAMA_NIRMITI_REPORT
    WHERE num_illegalhoard_ulbid = :ulbId
  `;

  const countBinds = {
    ulbId,
  };

  if (officerDivision) {
    countSql += `
      AND var_officer_division = :officerDivision
    `;

    countBinds.officerDivision = officerDivision;
  }

  if (ward) {
    countSql += `
      AND var_illegalhoard_ward = :ward
    `;

    countBinds.ward = ward;
  }

  if (fromDate && toDate) {
    countSql += `
      AND dat_cap_dt >= TO_DATE(:fromDate, 'YYYY-MM-DD')
      AND dat_cap_dt < TO_DATE(:toDate, 'YYYY-MM-DD') + 1
    `;

    countBinds.fromDate = fromDate;
    countBinds.toDate = toDate;
  } else if (fromDate) {
    countSql += `
      AND dat_cap_dt >= TO_DATE(:fromDate, 'YYYY-MM-DD')
    `;

    countBinds.fromDate = fromDate;
  } else if (toDate) {
    countSql += `
      AND dat_cap_dt < TO_DATE(:toDate, 'YYYY-MM-DD') + 1
    `;

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
      totalPages: Math.ceil(total / limitNumber),
    },
  };
}

module.exports = {
  getNoticeNirmitiReportRepo,
  getNoticePaymentReportRepo,
  getPanchanamaNirmitiReportRepo
  
};
