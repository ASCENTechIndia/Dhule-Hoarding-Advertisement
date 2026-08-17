const oracledb = require("oracledb");
const { executeQuery } = require("../../db/queryExecutor");
const { executeProcedure } = require("../../db/procedureExecutor");

async function authComplaintRepo(payload) {
  const statement = `
    BEGIN
      aorts.aorts_ctptworkauth_ins(
        :in_UserId,
        :in_applid,
        :in_ULBId,
        :in_mode,
        :in_status,
        :in_Remark,
        :Out_ErrorCode,
        :Out_ErrorMsg
      );
    END;
  `;

  const binds = {
    in_UserId: payload.userId,
    in_applid: Number(payload.applId),
    in_ULBId: Number(payload.ulbId),
    in_mode: Number(payload.mode),
    in_status: payload.status,
    in_Remark: payload.remark,
    Out_ErrorCode: {
      dir: oracledb.BIND_OUT,
      type: oracledb.NUMBER,
    },
    Out_ErrorMsg: {
      dir: oracledb.BIND_OUT,
      type: oracledb.STRING,
      maxSize: 1000,
    },
  };

  const result = await executeProcedure({ statement, binds, useTx: false });
  const out = result.outBinds;

  return {
    errorCode: out.Out_ErrorCode,
    message: out.Out_ErrorMsg,
  };
}

async function lobToBase64(lob) {
  if (!lob) return null;

  return new Promise((resolve, reject) => {
    const chunks = [];

    lob.on("data", (chunk) => {
      chunks.push(chunk);
    });

    lob.on("end", () => {
      const buffer = Buffer.concat(chunks);

      resolve(buffer.toString("base64"));
    });

    lob.on("error", (err) => {
      reject(err);
    });
  });
}

async function compListforSupRepo(
  ulbid,
  fromDate,
  toDate,
  status,
  page = 1,
  limit = 10,
) {
  const offset = (Number(page) - 1) * Number(limit);

  let sql = `
    SELECT
      w.num_empctptwork_id,
      w.dat_empctptwork_date,
      w.var_empctptwork_latitude,
      w.var_empctptwork_longitude,
      w.num_empctptwork_id AS unique_id,
      w.var_empctptwork_supremark,
      w.var_empctptwork_supflag,
      u.var_user_username AS username,
      w.var_empctptwork_userid,
      w.num_empctptwork_toiletid,
      w.num_empctptwork_stageid,
      w.var_empctptwork_remark,
      w.num_empctptwork_ulbid,
      c.num_ctpttype_wardid,
      c.var_ctpttype_toiletlocation,
      c.var_ctpttype_femaleseats,
      c.var_ctpttype_maleseats,
      c.var_ctpttype_totalseats,
      c.var_ctpttype_status,
      c.var_ctpttype_username,
      st.var_ctptstage_status,
      st.var_ctptstage_name,
      w.var_empctptwork_status
    FROM aorts.AORTS_EMPCTPTWORK_MST w
    LEFT JOIN aorts_ctptlist_mas c
      ON c.num_ctpttype_id = w.num_empctptwork_toiletid
    LEFT JOIN aorts_ctptstage_mas st
      ON st.num_ctptstage_id = w.num_empctptwork_stageid
    INNER JOIN admins.aoma_user_def u
      ON u.num_user_userid = w.var_empctptwork_userid
    WHERE w.num_empctptwork_ulbid = :ulbid
  `;

  let binds = {
    ulbid: Number(ulbid),
  };

  // Date Filter
  if (fromDate && toDate) {
    sql += `
      AND TRUNC(w.dat_empctptwork_date)
      BETWEEN TO_DATE(:fromDate, 'YYYY-MM-DD')
      AND TO_DATE(:toDate, 'YYYY-MM-DD')
    `;

    binds.fromDate = fromDate;
    binds.toDate = toDate;
  }

  // Status Filter
  if (status && status !== "ALL") {
    if (status === "P") {
      sql += `
        AND w.var_empctptwork_status IS NULL
      `;
    } else {
      sql += `
        AND w.var_empctptwork_status = :status
      `;
      binds.status = status;
    }
  }

  sql += `
    ORDER BY w.num_empctptwork_id DESC
    OFFSET :offset ROWS
    FETCH NEXT :limit ROWS ONLY
  `;

  binds.offset = Number(offset);
  binds.limit = Number(limit);

  const result = await executeQuery(sql, binds);
  const rows = result.rows || [];

  // ================= COUNT QUERY =================

  let countSql = `
    SELECT COUNT(*) AS TOTAL
    FROM aorts.AORTS_EMPCTPTWORK_MST w
    LEFT JOIN aorts_ctptlist_mas c
      ON c.num_ctpttype_id = w.num_empctptwork_toiletid
    LEFT JOIN aorts_ctptstage_mas st
      ON st.num_ctptstage_id = w.num_empctptwork_stageid
    INNER JOIN admins.aoma_user_def u
      ON u.num_user_userid = w.var_empctptwork_userid
    WHERE w.num_empctptwork_ulbid = :ulbid
  `;

  let countBinds = {
    ulbid: Number(ulbid),
  };

  // Date Filter
  if (fromDate && toDate) {
    countSql += `
      AND TRUNC(w.dat_empctptwork_date)
      BETWEEN TO_DATE(:fromDate, 'YYYY-MM-DD')
      AND TO_DATE(:toDate, 'YYYY-MM-DD')
    `;

    countBinds.fromDate = fromDate;
    countBinds.toDate = toDate;
  }

  // Status Filter
  if (status && status !== "ALL") {
    if (status === "P") {
      countSql += `
        AND w.var_empctptwork_status IS NULL
      `;
    } else {
      countSql += `
        AND w.var_empctptwork_status = :status
      `;
      countBinds.status = status;
    }
  }

  const countResult = await executeQuery(countSql, countBinds);
  const total = countResult.rows?.[0]?.TOTAL || 0;
  console.log(total);

  return {
    data: rows,
    pagination: {
      page: Number(page),
      limit: Number(limit),
      total,
      totalPages: Math.ceil(total / Number(limit)),
    },
  };
}

async function compListforSIRepo(
  ulbid,
  fromDate,
  toDate,
  status,
  page = 1,
  limit = 10,
) {
  const safePage = Number.isFinite(Number(page)) ? Number(page) : 1;
  const safeLimit = Number.isFinite(Number(limit)) ? Number(limit) : 10;
  const offset = (safePage - 1) * safeLimit;

  let sql = `
    SELECT * FROM (
      SELECT
        e.num_empctptentry_id,
        e.dat_empctptentry_date,
        e.var_empctptentry_latitude,
        e.num_empctptentry_id AS uniqueid,
        u.var_user_username AS username,
        e.var_empctptentry_userid AS userid,
        e.var_empctptentry_longitude,
        e.num_empctptentry_toiletid,
        e.num_empctptentry_stageid,
        e.var_empctptentry_remark,
        e.dat_empctptentry_insdate,
        e.num_empctptentry_ulbid,

        ctpt.num_ctpttype_wardid,
        ctpt.var_ctpttype_toiletlocation,
        ctpt.var_ctpttype_femaleseats,
        ctpt.var_ctpttype_maleseats,
        ctpt.var_ctpttype_totalseats,
        ctpt.var_ctpttype_status,
        ctpt.var_ctpttype_username,

        st.var_ctptstage_status,
        st.var_ctptstage_name,

        e.var_empctptentry_supflag,
        e.var_empctptentry_siflag,
        e.var_empctptentry_siremark,

        ROW_NUMBER() OVER (
          PARTITION BY
            e.var_empctptentry_userid,
            e.num_empctptentry_toiletid,
            TRUNC(e.dat_empctptentry_date)
          ORDER BY e.dat_empctptentry_date DESC
        ) AS rn

      FROM aorts_empctptentry_mst e

      INNER JOIN admins.aoma_user_def u
        ON u.num_user_userid = e.var_empctptentry_userid

      LEFT JOIN aorts_ctptlist_mas ctpt
        ON ctpt.num_ctpttype_id = e.num_empctptentry_toiletid

      LEFT JOIN aorts_ctptstage_mas st
        ON st.num_ctptstage_id = e.num_empctptentry_stageid

      LEFT JOIN aorts_ctptcitizencomplaint_mas c
        ON e.num_empctptentry_toiletid = c.num_complaint_toilet

      WHERE e.num_empctptentry_stageid = 3
        AND e.var_empctptentry_supflag = 'A'
  `;

  const binds = {
    ulbid: Number(ulbid),
  };

  // ================= DATE FILTER =================
  if (fromDate && toDate) {
    sql += `
      AND TRUNC(e.dat_empctptentry_date)
      BETWEEN TO_DATE(:fromDate, 'YYYY-MM-DD')
      AND TO_DATE(:toDate, 'YYYY-MM-DD')
    `;
    binds.fromDate = fromDate;
    binds.toDate = toDate;
  }

  // ================= STATUS FILTER =================
  if (status && status !== "ALL") {
    if (status === "P") {
      sql += `
      AND e.var_empctptentry_siflag IS NULL
    `;
    } else {
      sql += `
      AND e.var_empctptentry_siflag = :status
    `;
      binds.status = status;
    }
  }

  sql += `
    )
    WHERE rn = 1
      AND num_empctptentry_ulbid = :ulbid
    ORDER BY num_empctptentry_id DESC
    OFFSET :offset ROWS FETCH NEXT :limit ROWS ONLY
  `;

  binds.offset = offset;
  binds.limit = safeLimit;

  const result = await executeQuery(sql, binds);
  const rows = result.rows || [];

  // ================= COUNT QUERY =================
  let countSql = `
    SELECT COUNT(*) AS total FROM (
      SELECT
        ROW_NUMBER() OVER (
          PARTITION BY
            e.var_empctptentry_userid,
            e.num_empctptentry_toiletid,
            TRUNC(e.dat_empctptentry_date)
          ORDER BY e.dat_empctptentry_date DESC
        ) AS rn,
        e.num_empctptentry_ulbid
      FROM aorts_empctptentry_mst e

      LEFT JOIN aorts_ctptcitizencomplaint_mas c
        ON e.num_empctptentry_toiletid = c.num_complaint_toilet

      WHERE e.num_empctptentry_stageid = 3
        AND e.var_empctptentry_supflag = 'A'
  `;

  const countBinds = {
    ulbid: Number(ulbid),
  };

  if (fromDate && toDate) {
    countSql += `
      AND TRUNC(e.dat_empctptentry_date)
      BETWEEN TO_DATE(:fromDate, 'YYYY-MM-DD')
      AND TO_DATE(:toDate, 'YYYY-MM-DD')
    `;
    countBinds.fromDate = fromDate;
    countBinds.toDate = toDate;
  }

  if (status && status !== "ALL") {
    if (status === "P") {
      countSql += `
      AND e.var_empctptentry_siflag IS NULL
    `;
    } else {
      countSql += `
      AND e.var_empctptentry_siflag = :status
    `;
      countBinds.status = status;
    }
  }

  countSql += `
    )
    WHERE rn = 1
      AND num_empctptentry_ulbid = :ulbid
  `;

  const countResult = await executeQuery(countSql, countBinds);
  const total = countResult.rows?.[0]?.TOTAL || 0;

  return {
    data: rows,
    pagination: {
      page: safePage,
      limit: safeLimit,
      total,
      totalPages: Math.ceil(total / safeLimit),
    },
  };
}

async function getImages(ulbid, toiletId, applid) {
  let sql = `
  select w.num_empctptwork_id , 
  d.dat_insdate , 
  d.num_stage_id ,
  d.bolb_empctptworkdetails_image , 
  d.bolb_empctptworkdetails_image2 , 
  d.bolb_empctptworkdetails_image3,
  w.num_empctptwork_ulbid,
  st.var_ctptstage_name,
  st.var_ctptstage_status
  from aorts.AORTS_EMPCTPTWORK_MST w
  inner join aorts.AORTS_EMPCTPTWORKDETAILS_MST d on 
  w.num_empctptwork_id = d.num_empctptwork_id
  LEFT JOIN aorts_ctptstage_mas st ON st.num_ctptstage_id = d.num_stage_id
  WHERE w.num_empctptwork_ulbid = :ulbid AND w.num_empctptwork_id = :applid
  AND TRUNC(DAT_INSDATE)= (SELECT TRUNC(DAT_INSDATE) FROM AORTS_EMPCTPTWORK_MST WHERE num_empctptwork_id= :applid )
  ORDER BY d.num_stage_id ASC
  `;

  const binds = {
    ulbid: Number(ulbid),
    applid: Number(applid),
  };

  const result = await executeQuery(sql, binds);

  const rows = result.rows || [];

  for (const row of rows) {
    row.BOLB_EMPCTPTWORKDETAILS_IMAGE = await lobToBase64(
      row.BOLB_EMPCTPTWORKDETAILS_IMAGE,
    );

    row.BOLB_EMPCTPTWORKDETAILS_IMAGE2 = await lobToBase64(
      row.BOLB_EMPCTPTWORKDETAILS_IMAGE2,
    );

    row.BOLB_EMPCTPTWORKDETAILS_IMAGE3 = await lobToBase64(
      row.BOLB_EMPCTPTWORKDETAILS_IMAGE3,
    );
  }

  return rows;
}

async function rslvdListbyVendorRepo(
  ulbid,
  supervisorId,
  fromDate,
  toDate,
  status,
  page = 1,
  limit = 10,
) {
  // console.log("Repo Params:", { ulbid, supervisorId, fromDate, toDate, status, page, limit });
  const offset = (Number(page) - 1) * Number(limit);

  let sql = `
    SELECT
      a.prbhag,
      a.prbhagid,
      a.superwiser_id,
      a.superwiser,
      a.location,
      a.var_complaint_status,
      a.var_complaint_citizname,
      a.num_complaint_toilet,
      a.mobileno,
      a.complaint_date,
      a.var_complaint_remark,
      a.var_ctptsanitinspctor_name,
      a.blob_complaint_unitimg1,
      a.blob_complaint_unitimg2,
      a.blob_complaint_unitimg3,
      a.blob_complaint_unitimg4,
      a.blob_complaint_unitimg5,
      a.ulbid,
      a.si_id,
      a.complaintid,
      a.venderemark,
      a.superstatus,
      a.superremark
    FROM vw_ctptsuperwisercomplaint_list a
    WHERE a.ulbid = :ulbid
      AND a.superwiser_id = :supervisorId
  `;

  const binds = {
    ulbid: Number(ulbid),
    supervisorId: String(supervisorId),
  };

  // Date Filter
  if (fromDate && toDate) {
    sql += `
      AND TRUNC(a.complaint_date)
      BETWEEN TO_DATE(:fromDate,'YYYY-MM-DD')
      AND TO_DATE(:toDate,'YYYY-MM-DD')
    `;

    binds.fromDate = fromDate;
    binds.toDate = toDate;
  }

  // Status Filter
  if (status && status !== "ALL") {
    sql += `
      AND a.var_complaint_status = :status
    `;

    binds.status = status;
  }

  sql += `
    ORDER BY a.complaint_date DESC
    OFFSET :offset ROWS
    FETCH NEXT :limit ROWS ONLY
  `;

  binds.offset = offset;
  binds.limit = Number(limit);

  const result = await executeQuery(sql, binds);

  const rows = result.rows || [];

  // Convert images
  for (const row of rows) {
    row.BLOB_COMPLAINT_UNITIMG1 = await lobToBase64(
      row.BLOB_COMPLAINT_UNITIMG1,
    );
    row.BLOB_COMPLAINT_UNITIMG2 = await lobToBase64(
      row.BLOB_COMPLAINT_UNITIMG2,
    );
    row.BLOB_COMPLAINT_UNITIMG3 = await lobToBase64(
      row.BLOB_COMPLAINT_UNITIMG3,
    );
    row.BLOB_COMPLAINT_UNITIMG4 = await lobToBase64(
      row.BLOB_COMPLAINT_UNITIMG4,
    );
    row.BLOB_COMPLAINT_UNITIMG5 = await lobToBase64(
      row.BLOB_COMPLAINT_UNITIMG5,
    );
  }

  // Count Query
  let countSql = `
    SELECT COUNT(*) AS TOTAL
    FROM vw_ctptpendingcomplaint_assinlist a
    WHERE a.ulbid = :ulbid
      AND a.superwiser_id = :supervisorId
  `;

  const countBinds = {
    ulbid: Number(ulbid),
    supervisorId: String(supervisorId),
  };

  if (fromDate && toDate) {
    countSql += `
      AND TRUNC(a.complaint_date)
      BETWEEN TO_DATE(:fromDate,'YYYY-MM-DD')
      AND TO_DATE(:toDate,'YYYY-MM-DD')
    `;

    countBinds.fromDate = fromDate;
    countBinds.toDate = toDate;
  }

  if (status && status !== "ALL") {
    countSql += `
      AND a.var_complaint_status = :status
    `;

    countBinds.status = status;
  }

  const countResult = await executeQuery(countSql, countBinds);

  const total = countResult.rows?.[0]?.TOTAL || 0;

  return {
    data: rows,
    pagination: {
      page: Number(page),
      limit: Number(limit),
      total,
      totalPages: Math.ceil(total / Number(limit)),
    },
  };
}

async function rslvdListbyVendorListRepo(
  ulbid,
  vendorId,
  fromDate,
  toDate,
  status,
  page = 1,
  limit = 10,
) {
  // console.log("Repo Params:", { ulbid, supervisorId, fromDate, toDate, status, page, limit });
  const offset = (Number(page) - 1) * Number(limit);

  let sql = `
    SELECT
      a.prbhag,
      a.prbhagid,
      a.superwiser_id,
      a.superwiser,
      a.location,
      a.var_complaint_status,
      a.var_complaint_citizname,
      a.num_complaint_toilet,
      a.mobileno,
      a.complaint_date,
      a.var_complaint_remark,
      a.var_ctptsanitinspctor_name,
      a.blob_complaint_unitimg1,
      a.blob_complaint_unitimg2,
      a.blob_complaint_unitimg3,
      a.blob_complaint_unitimg4,
      a.blob_complaint_unitimg5,
      a.ulbid,
      a.si_id,
      a.complaintid,
      a.assvendorid
    FROM vw_ctptpendingcomplaint_assinlist_new a
    WHERE a.ulbid = :ulbid
      AND a.assvendorid = :vendorId
  `;

  const binds = {
    ulbid: Number(ulbid),
    vendorId: Number(vendorId),
  };

  // Date Filter
  if (fromDate && toDate) {
    sql += `
      AND TRUNC(a.complaint_date)
      BETWEEN TO_DATE(:fromDate,'YYYY-MM-DD')
      AND TO_DATE(:toDate,'YYYY-MM-DD')
    `;

    binds.fromDate = fromDate;
    binds.toDate = toDate;
  }

  // Status Filter
  if (status && status !== "ALL") {
    sql += `
      AND a.var_complaint_status = :status
    `;

    binds.status = status;
  }

  sql += `
    ORDER BY a.complaint_date DESC
    OFFSET :offset ROWS
    FETCH NEXT :limit ROWS ONLY
  `;

  binds.offset = offset;
  binds.limit = Number(limit);

  const result = await executeQuery(sql, binds);

  const rows = result.rows || [];

  // Convert images
  for (const row of rows) {
    row.BLOB_COMPLAINT_UNITIMG1 = await lobToBase64(
      row.BLOB_COMPLAINT_UNITIMG1,
    );
    row.BLOB_COMPLAINT_UNITIMG2 = await lobToBase64(
      row.BLOB_COMPLAINT_UNITIMG2,
    );
    row.BLOB_COMPLAINT_UNITIMG3 = await lobToBase64(
      row.BLOB_COMPLAINT_UNITIMG3,
    );
    row.BLOB_COMPLAINT_UNITIMG4 = await lobToBase64(
      row.BLOB_COMPLAINT_UNITIMG4,
    );
    row.BLOB_COMPLAINT_UNITIMG5 = await lobToBase64(
      row.BLOB_COMPLAINT_UNITIMG5,
    );
  }

  // Count Query
  let countSql = `
    SELECT COUNT(*) AS TOTAL
    FROM vw_ctptpendingcomplaint_assinlist a
    WHERE a.ulbid = :ulbid
      AND a.assvendorid = :vendorId
  `;

  const countBinds = {
    ulbid: Number(ulbid),
    vendorId: Number(vendorId),
  };

  if (fromDate && toDate) {
    countSql += `
      AND TRUNC(a.complaint_date)
      BETWEEN TO_DATE(:fromDate,'YYYY-MM-DD')
      AND TO_DATE(:toDate,'YYYY-MM-DD')
    `;

    countBinds.fromDate = fromDate;
    countBinds.toDate = toDate;
  }

  if (status && status !== "ALL") {
    countSql += `
      AND a.var_complaint_status = :status
    `;

    countBinds.status = status;
  }

  const countResult = await executeQuery(countSql, countBinds);

  const total = countResult.rows?.[0]?.TOTAL || 0;

  return {
    data: rows,
    pagination: {
      page: Number(page),
      limit: Number(limit),
      total,
      totalPages: Math.ceil(total / Number(limit)),
    },
  };
}

async function rslvdListbySupRepo(
  ulbid,
  fromDate,
  toDate,
  status,
  page = 1,
  limit = 10,
) {
  const offset = (Number(page) - 1) * Number(limit);

  let sql = `
    SELECT
      prbhag,
      prbhagid,
      superwiser_id,
      superwiser,
      location,
      var_complaint_status,
      var_complaint_citizname,
      num_complaint_toilet,
      mobileno,
      complaint_date,
      var_complaint_remark,
      var_ctptsanitinspctor_name,
      blob_complaint_unitimg1,
      blob_complaint_unitimg2,
      blob_complaint_unitimg3,
      blob_complaint_unitimg4,
      blob_complaint_unitimg5,
      ulbid,
      si_id,
      var_compaint_superremark,
      var_compaint_siremark,
      complaintid,
      SOLVCOMPIMG1,
      SOLVCOMPIMG2,
      SOLVCOMPIMG3,
      SUPERSTATUS,
      SISTATUS
    FROM vw_ctptpendingcomplaint_Resolved_New
    WHERE ulbid = :ulbid
  `;

  const binds = {
    ulbid: Number(ulbid),
  };

  if (fromDate && toDate) {
    sql += `
      AND TRUNC(complaint_date)
      BETWEEN TO_DATE(:fromDate, 'YYYY-MM-DD')
      AND TO_DATE(:toDate, 'YYYY-MM-DD')
    `;
    binds.fromDate = fromDate;
    binds.toDate = toDate;
  }

  if (status && status !== "ALL") {
    sql += `
      AND var_complaint_status = :status
    `;
    binds.status = status;
  }

  sql += `
    ORDER BY complaint_date DESC
    OFFSET :offset ROWS FETCH NEXT :limit ROWS ONLY
  `;

  binds.offset = Number(offset);
  binds.limit = Number(limit);

  const result = await executeQuery(sql, binds);
  const rows = result.rows || [];

  // Convert images
  for (const row of rows) {
    row.BLOB_COMPLAINT_UNITIMG1 = await lobToBase64(
      row.BLOB_COMPLAINT_UNITIMG1,
    );
    row.BLOB_COMPLAINT_UNITIMG2 = await lobToBase64(
      row.BLOB_COMPLAINT_UNITIMG2,
    );
    row.BLOB_COMPLAINT_UNITIMG3 = await lobToBase64(
      row.BLOB_COMPLAINT_UNITIMG3,
    );
    row.BLOB_COMPLAINT_UNITIMG4 = await lobToBase64(
      row.BLOB_COMPLAINT_UNITIMG4,
    );
    row.BLOB_COMPLAINT_UNITIMG5 = await lobToBase64(
      row.BLOB_COMPLAINT_UNITIMG5,
    );
    row.SOLVCOMPIMG1 = await lobToBase64(row.SOLVCOMPIMG1);
    row.SOLVCOMPIMG2 = await lobToBase64(row.SOLVCOMPIMG2);
    row.SOLVCOMPIMG3 = await lobToBase64(row.SOLVCOMPIMG3);
  }

  let countSql = `
    SELECT COUNT(*) AS total
    FROM vw_ctptpendingcomplaint_Resolved_New
    WHERE ulbid = :ulbid
  `;

  const countBinds = {
    ulbid: Number(ulbid),
  };

  if (fromDate && toDate) {
    countSql += `
      AND TRUNC(complaint_date)
      BETWEEN TO_DATE(:fromDate, 'YYYY-MM-DD')
      AND TO_DATE(:toDate, 'YYYY-MM-DD')
    `;
    countBinds.fromDate = fromDate;
    countBinds.toDate = toDate;
  }

  if (status && status !== "ALL") {
    countSql += `
      AND var_complaint_status = :status
    `;
    countBinds.status = status;
  }

  const countResult = await executeQuery(countSql, countBinds);

  const total =
    countResult.rows?.[0]?.TOTAL || countResult.rows?.[0]?.total || 0;

  return {
    data: rows,
    pagination: {
      page: Number(page),
      limit: Number(limit),
      total,
      totalPages: Math.ceil(total / Number(limit)),
    },
  };
}

async function getSolvedComplaintImagesRepo(ulbid, siid, complaintid) {
  let sql = `
    SELECT 
      SOLVCOMPIMG1,
      SOLVCOMPIMG2,
      SOLVCOMPIMG3
    FROM vw_ctptsolvcompimg_det
    WHERE num_complaint_ulbid = :ulbid
    AND num_complaint_siid = :siid
    AND num_complaint_id = :complaintid
  `;

  const binds = {
    ulbid: Number(ulbid),
    siid: String(siid),
    complaintid: Number(complaintid),
  };

  const result = await executeQuery(sql, binds);
  const rows = result.rows || [];

  for (const row of rows) {
    row.SOLVCOMPIMG1 = await lobToBase64(row.SOLVCOMPIMG1);
    row.SOLVCOMPIMG2 = await lobToBase64(row.SOLVCOMPIMG2);
    row.SOLVCOMPIMG3 = await lobToBase64(row.SOLVCOMPIMG3);
  }

  return rows;
}

async function getReworkImages(complaintid) {
  let sql = `
   select * from vw_complaintrework_list WHERE complaint_id = :complaintid
  `;

  const binds = {
    complaintid: String(complaintid),
  };

  const result = await executeQuery(sql, binds);
  const rows = result.rows || [];

  for (const row of rows) {
    row.IMAGE1 = await lobToBase64(row.IMAGE1);
    row.IMAGE2 = await lobToBase64(row.IMAGE2);
    row.IMAGE3 = await lobToBase64(row.IMAGE3);
  }

  return rows;
}

async function getSupervisorStatusRepo() {
  return [
    { value: "WIP", label: "WIP" },
    { value: "CLOSED", label: "Closed" },
  ];
}

async function complaintStatusUpdateRepo(payload) {
  const statement = `
    BEGIN
      aorts.aorts_ctptcomplaintrework_ins(
        :in_userid,
        :in_mode,
        :in_compaintid,
        :in_superwiserid,
        :in_superstatus,
        :in_superremark,
        :in_SIID,
        :in_si_status,
        :in_si_remrk,
        :in_wardno,
        :in_ulbid,
        :in_solvcompimg1,
        :in_solvcompimg2,
        :in_solvcompimg3,
        :in_Venderid,
        :in_Venderremark,
        :in_reworkflag,
        :in_reworkid,
        :out_errcode,
        :out_ErrMsg
      );
    END;
  `;

  const binds = {
    in_userid: payload.userId,
    in_mode: Number(payload.mode),
    in_compaintid: Number(
      payload.compaintId ??
        payload.complaintId ??
        payload.compaintid ??
        payload.complaintid,
    ),
    in_superwiserid: payload.superwiserId,
    in_superstatus: payload.superstatus,
    in_superremark: payload.superremark,
    in_SIID: payload.SIID || payload.siId,
    in_si_status: payload.si_status,
    in_si_remrk: payload.si_remrk,
    in_wardno: payload.wardno ? Number(payload.wardno) : null,
    in_ulbid: Number(payload.ulbid),
    in_solvcompimg1: {
      val: payload.solvedImg1
        ? Buffer.from(payload.solvedImg1, "base64")
        : null,
      type: oracledb.BLOB,
    },

    in_solvcompimg2: {
      val: payload.solvedImg2
        ? Buffer.from(payload.solvedImg2, "base64")
        : null,
      type: oracledb.BLOB,
    },

    in_solvcompimg3: {
      val: payload.solvedImg3
        ? Buffer.from(payload.solvedImg3, "base64")
        : null,
      type: oracledb.BLOB,
    },
    in_Venderid: payload.vendorId ? Number(payload.vendorId) : null,
    in_Venderremark: payload.vendorRemark || null,
    in_reworkflag: payload.reworkflag,
    in_reworkid: payload.reworkId || null,
    out_errcode: {
      dir: oracledb.BIND_OUT,
      type: oracledb.NUMBER,
    },
    out_ErrMsg: {
      dir: oracledb.BIND_OUT,
      type: oracledb.STRING,
      maxSize: 1000,
    },
  };

  const result = await executeProcedure({ statement, binds, useTx: false });
  const out = result.outBinds || {};

  return {
    errorCode: out.out_errcode,
    message: out.out_ErrMsg,
  };
}

async function complaintWorkStatusInsRepo(payload) {
  const statement = `
    BEGIN
      aorts.aorts_ctptworkstatus_ins(
        :in_UserId,
        :in_ULBId,
        :in_attnd_date,
        :in_attnd_latitude,
        :in_attnd_longitude,
        :in_appsource,
        :in_flag,
        :in_remark,
        :in_toiletId,
        :in_solvcompimg1,
        :in_solvcompimg2,
        :in_solvcompimg3,
        :in_workid,
        :in_workflag,
        :Out_ErrorCode,
        :Out_ErrorMsg,
        :out_str
      );
    END;
  `;

  const binds = {
    in_UserId: payload.userId,
    in_ULBId: payload.ulbId,
    in_attnd_date: payload.attndDate,
    in_attnd_latitude: payload.attndLat,
    in_attnd_longitude: payload.attndLong,
    in_appsource: payload.appSource,
    in_flag: payload.flag,
    in_remark: payload.remark,
    in_toiletId: payload.toiletId,
    in_solvcompimg1: {
      val: payload.solvcompimg1
        ? Buffer.from(payload.solvcompimg1, "base64")
        : null,
      type: oracledb.BLOB,
    },
    in_solvcompimg2: {
      val: payload.solvcompimg2
        ? Buffer.from(payload.solvcompimg2, "base64")
        : null,
      type: oracledb.BLOB,
    },
    in_solvcompimg3: {
      val: payload.solvcompimg3
        ? Buffer.from(payload.solvcompimg3, "base64")
        : null,
      type: oracledb.BLOB,
    },
    in_workid: payload.workId,
    in_workflag: payload.workFlag,
    Out_ErrorCode: {
      dir: oracledb.BIND_OUT,
      type: oracledb.NUMBER,
    },
    Out_ErrorMsg: {
      dir: oracledb.BIND_OUT,
      type: oracledb.STRING,
      maxSize: 1000,
    },
    out_str: {
      dir: oracledb.BIND_OUT,
      type: oracledb.STRING,
      maxSize: 1000,
    },
  };

  const result = await executeProcedure({ statement, binds, useTx: false });
  const out = result.outBinds || {};

  return {
    errorCode: out.Out_ErrorCode,
    message: out.Out_ErrorMsg,
    out_str: out.out_str,
  };
}

async function userDetailsRepo(userId, ulbId, toiletId) {
  const plsql = `
    BEGIN
      aorts_ctptgetuserdtls_fetch(
        :in_UserId,
        :in_ULBId,
        :in_ctpttoiletid,
        :out_ErrorCode,
        :out_ErrorMsg,
        :out_newstr
      );
    END;
  `;

  const binds = {
    in_UserId: userId,
    in_ULBId: ulbId,
    in_ctpttoiletid: toiletId,

    out_ErrorCode: {
      dir: oracledb.BIND_OUT,
      type: oracledb.NUMBER,
    },

    out_ErrorMsg: {
      dir: oracledb.BIND_OUT,
      type: oracledb.STRING,
      maxSize: 1000,
    },

    out_newstr: {
      dir: oracledb.BIND_OUT,
      type: oracledb.STRING,
      maxSize: 32767,
    },
  };

  const result = await executeProcedure({
    statement: plsql,
    binds,
    useTx: false,
  });

  const out = result.outBinds || {};

  const errorCode = String(out.out_ErrorCode ?? "0");

  if (errorCode !== "9999") {
    return {
      success: false,
      errorCode,
      message: out.out_ErrorMsg || "User details failed",
    };
  }

  const userData = JSON.parse(out.out_newstr || "{}");

  return {
    success: true,
    errorCode,
    message: out.out_ErrorMsg,
    data: userData,
  };
}

async function fineApplicationListRepo(
  ulbid,
  fromDate,
  toDate,
  page = 1,
  limit = 10,
  designation,
  userId
) 
{
  const offset = (Number(page) - 1) * Number(limit);

  let sql = `
    select work_id,
    ward_id,
    toilet_id,
    toilet_location,
    superid,
    siid,
    CAST(work_date + 1 AS TIMESTAMP) AS work_date,
    total_fine,
    ulbid,
    var_ctpttype_suppid , 
    var_ctpttype_sanitinspctorid from
     vw_ctptfine_list where ulbid = :ulbid
  `;

  let binds = {
    ulbid: Number(ulbid),
  };

  // Date Filter
  if (fromDate && toDate) {
    sql += `
      AND TRUNC(work_date)
      BETWEEN TO_DATE(:fromDate, 'YYYY-MM-DD')
      AND TO_DATE(:toDate, 'YYYY-MM-DD')
    `;

    binds.fromDate = fromDate;
    binds.toDate = toDate;
  }

  if (designation === 'Supervisor' && userId) {
    sql += `
      AND var_ctpttype_suppid =:userId
    `;
    binds.userId = userId;
  }

  if (designation === 'Sanitary Inspector' && userId) {
    sql += `
      AND var_ctpttype_sanitinspctorid =:userId
    `;
    binds.userId = userId;
  }

  sql += `
    order by work_id
    OFFSET :offset ROWS
    FETCH NEXT :limit ROWS ONLY
  `;

  binds.offset = Number(offset);
  binds.limit = Number(limit);

  const result = await executeQuery(sql, binds);
  const rows = result.rows || [];

  // ================= COUNT QUERY =================

  let countSql = `
  SELECT COUNT(*) AS TOTAL from vw_ctptfine_list where ulbid = :ulbid
`;

  let countBinds = {
    ulbid: Number(ulbid),
  };

  if (fromDate && toDate) {
    countSql += `
    AND TRUNC(work_date)
    BETWEEN TO_DATE(:fromDate, 'YYYY-MM-DD')
    AND TO_DATE(:toDate, 'YYYY-MM-DD')
  `;

    countBinds.fromDate = fromDate;
    countBinds.toDate = toDate;
  }

  if (designation === 'Supervisor' && userId) {
    countSql += `
      AND var_ctpttype_suppid =:userId
    `;
    countBinds.userId = userId;
  }

  if (designation === 'Sanitary Inspector' && userId) {
    countSql += `
      AND var_ctpttype_sanitinspctorid =:userId
    `;
    countBinds.userId = userId;
  }

  const countResult = await executeQuery(countSql, countBinds);

  const total =
    countResult.rows?.[0]?.TOTAL ?? countResult.rows?.[0]?.total ?? 0;

  return {
    data: rows,
    pagination: {
      page: Number(page),
      limit: Number(limit),
      total,
      totalPages: Math.ceil(total / Number(limit)),
    },
  };
}




async function fineBreakdownRepo(ulbid, workId) {
  let sql = `
    select a.num_empctptwork_id,
    c.num_ctpttype_wardid,
    c.var_ctpttype_toiletlocation toilet_location,
    a.var_empctptwork_supby superid,
    a.var_empctptwork_siby as siid,
    nvl(num_ctptworklog_updtamt,0) fine_amt,
    b.dat_ctptworklog_date
    from AORTS_EMPCTPTWORK_MST a 
    inner join AORTS_EMPCTPTWORK_log b on a.num_empctptwork_id = b.num_ctptworklog_workid
    inner join aorts_ctptlist_mas c
    on a.num_empctptwork_toiletid = c.num_ctpttype_id
    where a.num_empctptwork_id = :workId
    and a.num_empctptwork_ulbid = :ulbid
  `;

  let binds = {
    ulbid: Number(ulbid),
    workId: Number(workId),
  };

  const result = await executeQuery(sql, binds);
  const rows = result.rows || [];

  return {
    data: rows,
  };
}

module.exports = {
  authComplaintRepo,
  compListforSupRepo,
  compListforSIRepo,
  getImages,
  rslvdListbyVendorRepo,
  rslvdListbySupRepo,
  rslvdListbyVendorListRepo,
  getSolvedComplaintImagesRepo,
  getSupervisorStatusRepo,
  getReworkImages,
  complaintWorkStatusInsRepo,
  userDetailsRepo,
  fineApplicationListRepo,
  fineBreakdownRepo,
};

module.exports.complaintStatusUpdateRepo = complaintStatusUpdateRepo;
