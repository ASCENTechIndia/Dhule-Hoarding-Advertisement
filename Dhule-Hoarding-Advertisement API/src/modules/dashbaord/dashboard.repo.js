const { executeQuery } = require("../../db/queryExecutor");

async function getSummaryCardsValuesRepo(payload) {
  // Total Toilets
  let query = `select count(num_ctpttype_id) as total_toilets from aorts_ctptlist_mas where num_ctpttype_ulbid = :ulbId`;
  const bind = { ulbId: Number(payload.ulbId ) };
  if (payload.userType === "SI") {
    query += ` and var_ctpttype_sanitinspctorid = :siid`;
    bind.siid = payload.userId;
  } else if (payload.userType === "SUP") {
    query += ` and var_ctpttype_suppid = :supid`;
    bind.supid = payload.userId;
  }

  if (payload.ward) {
    query += ` and num_ctpttype_wardid = :ward `;
    bind.ward = Number(payload.ward);
  }
  const totalToilets = await executeQuery(query, bind);

  //Total Vendors
  let query2 = `select count(num_vendor_id) as total_vendor from aorts_vendor_mas where num_vendor_ulbid = :ulbId`;
  const bind2 = { ulbId: Number(payload.ulbId) };
  const totalVendors = await executeQuery(query2, bind2);

  // Todays inspection
  let query3 = `select count(*) as today_inspection from aorts_empctptwork_mst w 
    inner join aorts_ctptlist_mas ctpt on w.num_empctptwork_toiletid = ctpt.num_ctpttype_id 
    where w.num_empctptwork_ulbid = :ulbId 
    and trunc(w.dat_empctptwork_insdate) = TRUNC(sysdate) `;

  const bind3 = { ulbId: payload.ulbId };
  if (payload.userType === "SI") {
    query3 += `and w.var_empctptwork_siflag in ('A','R') and ctpt.var_ctpttype_sanitinspctorid = :userId`;
    bind3.userId = payload.userId;
  } else if (payload.userType === "SUP") {
    query3 += `and w.var_empctptwork_supflag in ('A','R') and ctpt.var_ctpttype_suppid = :userId`;
    bind3.userId = payload.userId;
  }
  const todaysInspection = await executeQuery(query3, bind3);

  // Pending verification
  let query4 = `select count(*) as pending_verification from aorts_empctptwork_mst w 
          inner join aorts_ctptlist_mas ctpt on w.num_empctptwork_toiletid = ctpt.num_ctpttype_id 
          where w.num_empctptwork_ulbid = :ulbId `;
  const bind4 = { ulbId: payload.ulbId };

  if (payload.fromDate && payload.toDate) {
    query4 += ` AND TRUNC(w.dat_empctptwork_date)
              BETWEEN TO_DATE(:fromDate,'DD-MM-YYYY')
              AND TO_DATE(:toDate,'DD-MM-YYYY') `;

    bind4.fromDate = payload.fromDate;
    bind4.toDate = payload.toDate;
  }
  if (payload.userType === "SI") {
    query4 += ` and w.var_empctptwork_siflag is null and ctpt.var_ctpttype_sanitinspctorid = :userId `;
    bind4.userId = payload.userId;
  } else if (payload.userType === "SUP") {
    query4 += ` and w.var_empctptwork_supflag is null and ctpt.var_ctpttype_suppid = :userId `;
    bind4.userId = payload.userId;
  }
  if (payload.ward) {
    query4 += `and num_ctpttype_wardid = :ward `;
    bind4.ward = Number(payload.ward);
  }
  const pendingVerification = await executeQuery(query4, bind4);

  // Total Fine
  let query7 = `SELECT NVL(SUM(w.num_empctptwork_fine), 0) AS total_fine
              FROM aorts_empctptwork_mst w
              INNER JOIN aorts_ctptlist_mas ctpt
              ON w.num_empctptwork_toiletid = ctpt.num_ctpttype_id `;
  const bind7 = {};
  if (payload.ward) {
    query7 += `and ctpt.num_ctpttype_wardid = :ward `;
    bind7.ward = payload.ward;
  }
  if (payload.fromDate && payload.toDate) {
    query7 += `AND TRUNC(w.dat_empctptwork_date)
              BETWEEN TO_DATE(:fromDate,'DD-MM-YYYY')
              AND TO_DATE(:toDate,'DD-MM-YYYY') `;
    bind7.fromDate = payload.fromDate;
    bind7.toDate = payload.toDate;
  }
  if (payload.userType === "SI") {
    query7 += `and ctpt.var_ctpttype_sanitinspctorid = :userId `;
    bind7.userId = payload.userId;
  } else if (payload.userType === "SUP") {
    query7 += `and ctpt.var_ctpttype_suppid = :userId `;
    bind7.userId = payload.userId;
  }
  const totalFine = await executeQuery(query7, bind7);

  const result = {
    totalToilets: totalToilets.rows[0]?.TOTAL_TOILETS ?? "",
    totalVendors: totalVendors.rows[0]?.TOTAL_VENDOR ?? "",
    todaysInspection: todaysInspection.rows[0]?.TODAY_INSPECTION ?? "",
    pendingVerification:
      pendingVerification.rows[0]?.PENDING_VERIFICATION ?? "",
    approvedBills: 0,
    rejectedBills: 0,
    totalFine: totalFine.rows[0]?.TOTAL_FINE ?? "",
  };
  return result;
}

async function getWardWiseCleaningStatusRepo(payload) {
  let query = `SELECT
    c.num_ctpttype_wardid AS Wards,
    COUNT(c.num_ctpttype_id) AS Total_toilets,
    SUM(CASE WHEN e.var_empctptwork_status = 'A' THEN 1 ELSE 0 END) AS Cleaned,
    SUM(CASE WHEN e.var_empctptwork_status IS NULL OR e.var_empctptwork_status = 'P' THEN 1 ELSE 0 END) AS Not_cleaned,
    SUM(CASE WHEN e.var_empctptwork_status = 'C' THEN 1 ELSE 0 END) AS Pending,
    SUM(CASE WHEN e.var_empctptwork_status = 'R' THEN 1 ELSE 0 END) AS Rejected
    FROM aorts_ctptlist_mas c
    LEFT JOIN aorts_empctptwork_mst e
    ON e.num_empctptwork_toiletid = c.num_ctpttype_id `;
  const bind = {};

  if (payload.date) {
    // query += ` AND TRUNC(e.dat_empctptwork_date) = TO_DATE(:date,'DD-MM-YYYY') `;
    query += ` AND TRUNC(e.dat_empctptwork_date) = TO_DATE(:workDate,'DD-MM-YYYY') `;
    bind.workDate = payload.date;
  }

  if(payload.ulbId){
    query += ` where c.num_ctpttype_ulbid = :ulbId `;
    bind.ulbId = Number(payload.ulbId);
  }

  if (payload.userType === "SI") {
    query += ` AND (:userId IS NOT NULL AND c.var_ctpttype_sanitinspctorid = :userId) `;
    bind.userId = payload.userId;
  } else if (payload.userType === "SUP") {
    query += ` AND (:userId IS NOT NULL AND c.var_ctpttype_suppid = :userId) `;
    bind.userId = payload.userId;
  }

  if (payload.ward) {
    query += ` and c.num_ctpttype_wardid = :ward `;
    bind.ward = Number(payload.ward);
  }
  query += ` GROUP BY c.num_ctpttype_wardid
            ORDER BY c.num_ctpttype_wardid `;

            console.log("full query :", query)
  const result = await executeQuery(query, bind);
  return result.rows;
}

async function getTopComplaintCategoryRepo(payload) {
  let query = `select complainttype_id,compainttype, count(compaintid) complaint_count from vw_ctptcategory_summary  
                  where ulbId = :ulbId `;

  const bind = { ulbId: Number(payload.ulbId) };
  if (payload.userType === "SI") {
    query += `and siId = :userId `;
    bind.userId = payload.userId;
  } else if (payload.userType === "SUP") {
    query += `and superid = :userId `;
    bind.userId = payload.userId;
  }
  if (payload.fromDate && payload.toDate) {
    query += `and trunc(compl_date) between to_date(:fromDate, 'DD-MM-YYYY') and to_date(:toDate, 'DD-MM-YYYY') `;
    bind.fromDate = payload.fromDate;
    bind.toDate = payload.toDate;
  }
  if (payload.ward) {
    query += `and wardno = :ward `;
    bind.ward = Number(payload.ward);
  }
  query += `group by complainttype_id,compainttype`;
  const result = await executeQuery(query, bind);
  return result.rows || [];
}

async function getRecentInspectionRepo(payload) {
  let query = `select * from vw_ctptwork_recent where ulbid = :ulbId `;
  const bind = {ulbId: Number(payload.ulbId)};
  if (payload.fromDate && payload.toDate) {
    query += `and trunc(workdate) BETWEEN TO_DATE(:fromDate,'DD-MM-YYYY')
              AND TO_DATE(:toDate,'DD-MM-YYYY') `;
    bind.fromDate = payload.fromDate;
    bind.toDate = payload.toDate;
  }
  if (payload.ward) {
    query += `and wardid = :ward `;
    bind.ward = payload.ward;
  }
  // if (payload.vendor) {
  //   query += `and vendorid = :vendor `;
  //   bind.vendor = payload.vendor;
  // }
  if (payload.userType === "SI") {
    query += `and sistatus in ('A','R') and  siid = :userId `;
    bind.userId = payload.userId;
  } else if (payload.userType === "SUP") {
    query += `and superstatus in ('A','R') and superid  = :userId `;
    bind.userId = payload.userId;
  }
  const result = await executeQuery(query, bind);
  return result.rows;
}

async function getCleaningComplienceRepo(payload) {
  let query = `SELECT
    COUNT(c.num_ctpttype_id) AS Total_Toilets,
    SUM(CASE WHEN e.var_empctptwork_status = 'A' THEN 1 ELSE 0 END) AS Cleaned,
    SUM(CASE WHEN e.var_empctptwork_status = 'C' THEN 1 ELSE 0 END) AS Pending,
    SUM(CASE WHEN e.var_empctptwork_status = 'R' THEN 1 ELSE 0 END) AS Rejected,
    SUM(CASE
            WHEN e.num_empctptwork_toiletid IS NULL
                 OR e.var_empctptwork_status = 'P'
            THEN 1
            ELSE 0
        END) AS Not_Cleaned
    FROM aorts_ctptlist_mas c
    LEFT JOIN aorts_empctptwork_mst e
          ON e.num_empctptwork_toiletid = c.num_ctpttype_id
          AND TRUNC(e.dat_empctptwork_date) = TRUNC(sysdate) `;
  const bind = {};

  if (payload.userType === "SI") {
    query += `WHERE (:userId IS NOT NULL AND c.var_ctpttype_sanitinspctorid = :userId) `;
    bind.userId = payload.userId;
  } else if (payload.userType === "SUP") {
    query += `WHERE (:userId IS NOT NULL AND c.var_ctpttype_suppid = :userId) `;
    bind.userId = payload.userId;
  }
  if (payload.ward) {
    query += `and c.num_ctpttype_wardid = :ward `;
    bind.ward = payload.ward;
  }
  const result = await executeQuery(query, bind);
  return result.rows[0];
}

async function getCitizenComplaintStatusRepo(payload) {
  let query = `SELECT

              COUNT(*) AS total_complaints,
              SUM(
        CASE
            WHEN c.var_complaint_status IN ('P', 'REJECTED')
            THEN 1
            ELSE 0
        END
    ) AS open_complaints,
              SUM(
        CASE
            WHEN c.var_complaint_status IN ('ASSIGN', 'COMPLETED')
            THEN 1
            ELSE 0
        END
    ) AS in_progress_complaints,
              SUM(
        CASE
            WHEN c.var_complaint_status = 'CLOSED'
            THEN 1
            ELSE 0
        END
    ) AS resolved_complaints
          FROM aorts_ctptcitizencomplaint_mas c
          INNER JOIN aorts_ctptlist_mas ctpt
              ON c.num_complaint_toilet = ctpt.num_ctpttype_id
          WHERE c.var_complaint_status IN ('P', 'ASSIGN', 'CLOSED', 'COMPLETED', 'REJECTED') and c.num_complaint_ulbid = :ulbId `;
  const bind = { ulbId: Number(payload.ulbId) };

  if (payload.fromDate && payload.toDate) {
    query += `AND TRUNC(c.dat_complaint_insdt)
          BETWEEN TO_DATE(:fromDate, 'DD-MM-YYYY')
          AND TO_DATE(:toDate, 'DD-MM-YYYY') `;
    bind.fromDate = payload.fromDate;
    bind.toDate = payload.toDate;
  }
  if (payload.ward) {
    query += `AND c.num_complaint_wardid = :ward `;
    bind.ward = payload.ward;
  }

  if (payload.userType === "SI") {
    query += `and ctpt.var_ctpttype_sanitinspctorid = :userId `;
    bind.userId = payload.userId;
  }
  else if (payload.userType === "SUP") {
    query += `AND ctpt.var_ctpttype_suppid = :userId `;
    bind.userId = payload.userId;
  }

  const result = await executeQuery(query, bind);
  return result.rows[0];
}

async function getBillOverviewRepo() {
  const query = ``;
  const bind = {};
  const result = await executeQuery(query, bind);
  return result;
}

async function getRecentComplaintRepo(payload) {
  let query = `select * from aorts.vw_recent_complaint where ulbid = :ulbId `;
  const bind = { ulbId: payload.ulbId };

  if (payload.fromDate && payload.toDate) {
    query += `and TRUNC(complaint_date) 
        between TO_DATE(:fromDate,'DD-MM-YYYY') and 
        TO_DATE(:toDate,'DD-MM-YYYY') `;
    bind.fromDate = payload.fromDate;
    bind.toDate = payload.toDate;
  }
  if (payload.userType === "SI") {
    query += `and siid = :userId `;
    bind.userId = payload.userId;
  } else if (payload.userType === "SUP") {
    query += `and superid = :userId `;
    bind.userId = payload.userId;
  }
  if (payload.ward) {
    query += `and wardid = :ward`;
    bind.ward = payload.ward;
  }

  query += ` order by complaint_date desc
FETCH FIRST 10 ROWS ONLY`;
  const result = await executeQuery(query, bind);
  return result.rows;
}

async function repoWardList(payload) {
  let sql = `
   SELECT DISTINCT num_ctpttype_wardid
                FROM aorts_ctptlist_mas where num_ctpttype_ulbid=:ulbid and
                var_ctpttype_status='Y' `;
  const binds = { ulbid: Number(payload.ulbid) };
  if (payload.userType === "Sanitary Inspector") {
    sql += `and var_ctpttype_sanitinspctorid = :userId `;
    binds.userId = String(payload.userId);
  } else if (payload.userType === "Supervisor") {
    sql += `and var_ctpttype_suppid = :userId `;
    binds.userId = String(payload.userId);
  }
  sql += `order by num_ctpttype_wardid`;
  const result = await executeQuery(sql, binds);
  return result.rows || [];
}

module.exports = {
  getSummaryCardsValuesRepo,
  getWardWiseCleaningStatusRepo,
  getTopComplaintCategoryRepo,
  getRecentInspectionRepo,
  getCleaningComplienceRepo,
  getCitizenComplaintStatusRepo,
  getBillOverviewRepo,
  getRecentComplaintRepo,
  repoWardList
};
