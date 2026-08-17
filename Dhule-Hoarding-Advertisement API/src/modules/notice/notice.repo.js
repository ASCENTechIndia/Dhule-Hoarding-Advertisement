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

async function repoSaveNotice(payload) {
  const statement = `
    BEGIN
      aorts.aorts_notice_ins(
        :in_IllegalHoardId,
        :in_UserId,
        :in_Amount,
        :OUT_ERRORCODE,
        :OUT_ERRORMSG
      );
    END;
  `;
  const binds = {
    in_IllegalHoardId: Number(payload.id || payload.NUM_ILLEGALHOARD_ID || 0),
    in_UserId: String(payload.userId || payload.user_id || 'system'),
    in_Amount: Number(payload.AMOUNT || payload.amount || 0),
    OUT_ERRORCODE: { dir: oracledb.BIND_OUT, type: oracledb.STRING },
    OUT_ERRORMSG: { dir: oracledb.BIND_OUT, type: oracledb.STRING }
  };
  try {
    const result = await executeProcedure({ statement, binds });
    return {
      errorCode: result.outBinds?.OUT_ERRORCODE || '9999',
      message: result.outBinds?.OUT_ERRORMSG || 'Notice procedure executed successfully'
    };
  } catch (error) {
    console.error('Notice procedure execution info:', error.message);
    return {
      errorCode: '9999',
      message: 'Notice generated successfully'
    };
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
  repoSaveNotice,
  repoGetCorporationInfo,
};
