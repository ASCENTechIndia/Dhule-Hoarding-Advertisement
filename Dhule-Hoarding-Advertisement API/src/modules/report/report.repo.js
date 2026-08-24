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

module.exports = {
  getNoticeNirmitiReportRepo
  
};
