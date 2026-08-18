const oracledb = require('oracledb');
const { executeQuery } = require('../../db/queryExecutor');
const { executeProcedure } = require('../../db/procedureExecutor');

async function repoGetNoticeById(id) {
  const sql = `
    SELECT 
      num_illegalhoard_id, 
      num_illegalhoard_ulbid, 
      var_illegalhoard_panchanama_no, 
      var_illegalhoard_add,
      latitude, 
      longitude, 
      num_size_length,
      num_size_width, 
      amount
    FROM advertisement.VW_ILLEGALHOARD_NOTGEN
    WHERE num_illegalhoard_id = :id
  `;
  const binds = { id: Number(id) };
  try {
    const result = await executeQuery(sql, binds);
    return result.rows?.[0] || null;
  } catch (error) {
    console.error('Error fetching notice from advertisement.VW_ILLEGALHOARD_NOTGEN:', error.message);
    return null;
  }
}

async function repoGenerateNotice(payload) {
  const statement = `
    BEGIN
      AOAD_ILLEGALHOARD_NOTGEN_INS(
        :in_userid,
        :in_panchanamano,
        :in_ulbid,
        :out_refcursor,
        :out_errcode,
        :out_errmsg
      );
    END;
  `;

  const binds = {
    in_userid: String(
      payload.userId ||
      payload.user_id ||
      "system"
    ),

    in_panchanamano: String(
      payload.PANCHANAMA_NO ||
      payload.panchanamaNo ||
      payload.VAR_ILLEGALHOARD_PANCHANAMA_NO ||
      ""
    ),

    in_ulbid: Number(
      payload.ULBID ||
      payload.ulbId ||
      payload.corporationId ||
      0
    ),

    out_refcursor: {
      dir: oracledb.BIND_OUT,
      type: oracledb.CLOB,
    },

    out_errcode: {
      dir: oracledb.BIND_OUT,
      type: oracledb.NUMBER,
    },

    out_errmsg: {
      dir: oracledb.BIND_OUT,
      type: oracledb.STRING,
      maxSize: 4000,
    },
  };

  try {
    const result = await executeProcedure({
      statement,
      binds,
    });

    console.log(
      "AOAD_ILLEGALHOARD_NOTGEN_INS OUT:",
      result.outBinds
    );

    let clobData = result.outBinds?.out_refcursor;

    // ---------------------------------------------------------
    // Read CLOB
    // ---------------------------------------------------------

    if (clobData) {
      if (
        typeof clobData !== "string" &&
        typeof clobData.getData === "function"
      ) {
        clobData = await clobData.getData();
      }
    }

    // ---------------------------------------------------------
    // Convert CLOB to string
    // ---------------------------------------------------------

    clobData = clobData
      ? String(clobData)
      : "";

    // ---------------------------------------------------------
    // Parse $ separated response
    // ---------------------------------------------------------

    const values = clobData.split("$");

    const noticeData = {
      id: values[0] || null,

      address: values[1] || "",

      ward: values[2] || "",

      name: values[3] || "",

      amount: values[4] || "0",

      latitude: values[5] || "",

      longitude: values[6] || "",

      length: values[7] || "",

      width: values[8] || "",

      panchanamaNo: values[9] || "",

      noticeNo: values[10] || "",

      fromDate: values[11] || "",

      toDate: values[12] || "",
    };

    return {
      errorCode:
        result.outBinds?.out_errcode ?? null,

      errorMessage:
        result.outBinds?.out_errmsg || "",

      rawData: clobData,

      noticeData,
    };
  } catch (error) {
    console.error(
      "AOAD_ILLEGALHOARD_NOTGEN_INS Error:",
      error
    );

    throw error;
  }
}

async function readLobData(lobOrBuffer) {
  if (!lobOrBuffer) return null;
  if (Buffer.isBuffer(lobOrBuffer)) {
    return lobOrBuffer.toString('base64');
  }
  if (typeof lobOrBuffer === 'string') {
    return lobOrBuffer;
  }
  if (typeof lobOrBuffer.getData === 'function') {
    try {
      const buf = await lobOrBuffer.getData();
      return buf ? buf.toString('base64') : null;
    } catch (e) {
      console.error('Error reading Lob via getData():', e.message);
    }
  }
  return null;
}

async function repoGetCorporationInfo(corpId) {
  if (!corpId) return null;
  const sql = `
    SELECT 
      num_corporation_id, 
      var_corporation_name, 
      blob_corporation_img 
    FROM admins.aoma_corporation_mas 
    WHERE num_corporation_id = :corpId
  `;
  const binds = { corpId: Number(corpId) };

  try {
    const result = await executeQuery(sql, binds, {
      fetchInfo: {
        BLOB_CORPORATION_IMG: { type: oracledb.BUFFER },
        blob_corporation_img: { type: oracledb.BUFFER }
      }
    });

    if (result.rows && result.rows.length > 0) {
      const row = result.rows[0];
      const rawImg = row.BLOB_CORPORATION_IMG || row.blob_corporation_img || null;
      let base64Str = await readLobData(rawImg);

      let imgData = '';
      if (base64Str && base64Str.trim().length > 0) {
        imgData = base64Str.startsWith('data:') ? base64Str : `data:image/png;base64,${base64Str}`;
      }

      return {
        corporationId: row.NUM_CORPORATION_ID || row.num_corporation_id,
        corporationName: row.VAR_CORPORATION_NAME || row.var_corporation_name,
        corporationLogo: imgData
      };
    }
  } catch (error) {
    console.error('Error fetching corporation info from admins.aoma_corporation_mas:', error.message);
  }
  return null;
}

module.exports = {
  repoGetNoticeById,
  repoGenerateNotice,
  repoGetCorporationInfo,
};
