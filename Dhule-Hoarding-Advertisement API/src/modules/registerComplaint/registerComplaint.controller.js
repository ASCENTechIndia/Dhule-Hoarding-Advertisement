const {serviceWardList,serviceToiletList,serviceComplaintTypeList,regComplaintService, assignComplaintService, compListService,
  serviceSupervisorList,serviceVendorList,regParticipantService,getPanchanamalistService,illegalHoardService,getPanchanamaDetailsService, generatePanchnamaPdfService
} = require('./registerComplaint.service');
const { auditLog } = require('../../utils/audit-log');
const { logApiSuccess, logApiError } = require('../../utils/log');
function requestMeta(req) {
  return {
    ip: req.ip,
    method: req.method,
    path: req.originalUrl,
  };
}
async function getWardList(req, res, next) {
  try {
    const rows = await serviceWardList(req.query.ulbid);
    logApiSuccess( req, 200, { count: rows?.length || 0 }, 'Ward List Report completed' );
    return res.ok(rows);
  } catch (error) {
    logApiError(req, 500, error.message, 'Ward List Report search error');
    return next(error);
  }
}

async function getVendorList(req, res, next) {
  try {
    const rows = await serviceVendorList(req.query.ulbid);
    logApiSuccess( req, 200, { count: rows?.length || 0 }, 'Vendor List Report completed' );
    return res.ok(rows);
  } catch (error) {
    logApiError(req, 500, error.message, 'Vendor List Report search error');
    return next(error);
  }
}

async function getToiletList(req, res, next) {
  try {
    const rows = await serviceToiletList(req.query.ulbid, req.query.wardid);
    logApiSuccess( req, 200, { count: rows?.length || 0 }, 'Toilet List Report completed' );
    return res.ok(rows);
  } catch (error) {
    logApiError(req, 500, error.message, 'Toilet List Report search error');
    return next(error);
  }
}

async function getComplaintTypeList(req, res, next) {
  try {
    const rows = await serviceComplaintTypeList(req.query.ulbid);
    logApiSuccess(req, 200, { count: rows?.length || 0 }, 'Complaint Type List completed');
    return res.ok(rows);
  } catch (error) {
    logApiError(req, 500, error.message, 'Complaint Type List search error');
    return next(error);
  }
}

async function registerComplaint(req, res, next) {
  try {
    const payload = req.body;

    const out = await regComplaintService(payload);

    console.log("OUT:", out);

    const isSuccess = String(out.errorCode) === "9999";

    if (isSuccess) {
      logApiSuccess(req, 200, out.message);
    } else {
      logApiError(req, 400, out.message, "Complaint Registration failed");
    }

    auditLog({
      action: "COMPLAINT_REGISTRATION",
      actor: req.user?.userId || "system",
      module: "users",
      status: isSuccess ? "SUCCESS" : "FAILED",
      details: {
        outErrorCode: out.errorCode,
        outErrorMsg: out.message,
      },
      requestMeta: requestMeta(req),
    });
    return res.ok(out);
  } catch (error) {
    logApiError(req, 500, error.message, "Complaint Registration error");
    return next(error);
  }
}

async function assignComplaint(req, res, next) {
  try {
    const payload = req.body;

    const out = await assignComplaintService(payload);

    const isSuccess = String(out.errorCode) === "9999";

    if (isSuccess) {
      logApiSuccess(req, 200, "Complaint Assigned Successfully");
    } else {
      logApiError(req, 400, out.message, "Complaint Assignment failed");
    }

    auditLog({
      action: "COMPLAINT_ASSIGNMENT",
      actor: req.user?.userId || "system",
      module: "registerComplaint",
      status: isSuccess ? "SUCCESS" : "FAILED",
      details: {
        outErrorCode: out.errorCode,
        outErrorMsg: out.message,
      },
      requestMeta: requestMeta(req),
    });
    return res.ok(out);
  } catch (error) {
    logApiError(req, 500, error.message, "Complaint Assignment error");
    return next(error);
  }
}


async function getComplaintList(req, res, next) {
  try {
    const {si_id, ulbid, fromDate=null, toDate=null, status=null, page = 1, limit = 10 } = req.query;
    const rows = await compListService(si_id,ulbid, fromDate, toDate, status, page, limit);
    logApiSuccess( req, 200, { count: rows?.length || 0 }, 'Complaint List completed' );
    return res.ok(rows);
  } catch (error) {
    logApiError(req, 500, error.message, 'Complaint List search error');
    return next(error);
  }
}

async function getSupervisorList(req, res, next) {
  try {
    const rows = await serviceSupervisorList(req.query.ulbid);
    logApiSuccess( req, 200, { count: rows?.length || 0 }, 'Supervisor List Report completed' );
    return res.ok(rows);
  } catch (error) {
    logApiError(req, 500, error.message, 'Supervisor List Report search error');
    return next(error);
  }
}

async function registerParticipant(req, res, next) {

    try {

        const payload = req.body;

        const out = await regParticipantService(payload);

        console.log("Participant Registration OUT:", out);

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
                "Participant Registration failed"
            );

        }

        auditLog({

            action: "PARTICIPANT_REGISTRATION",

            actor:
                req.user?.userId ||
                "system",

            module: "users",

            status:
                isSuccess
                    ? "SUCCESS"
                    : "FAILED",

            details: {

                outErrorCode:
                    out.errorCode,

                outErrorMsg:
                    out.message,

            },

            requestMeta:
                requestMeta(req),

        });

        return res.ok(out);

    } catch (error) {

        console.error(
            "Participant Registration error:",
            error
        );

        logApiError(
            req,
            500,
            error.message,
            "Participant Registration error"
        );

        return next(error);

    }

}

async function getPanchanamalist(req, res, next) {
  try {
    const {
      fromDate = null,
      toDate = null,
      page = 1,
      limit = 10,
    } = req.query;

    const rows = await getPanchanamalistService(
      fromDate,
      toDate,
      page,
      limit
    );

    logApiSuccess(
      req,
      200,
      { count: rows?.data?.length || 0 },
      'Participant List completed'
    );

    return res.ok(rows);

  } catch (error) {

    logApiError(
      req,
      500,
      error.message,
      'Participant List search error'
    );

    return next(error);
  }
}

async function registerIllegalHoard(req, res, next) {

    try {

        const payload = req.body;

        const out =
            await illegalHoardService(payload);

        console.log(
            "Illegal Hoard Registration OUT:",
            out
        );

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
                "Illegal Hoard Registration failed"
            );

        }

        // ---------------------------------------------
        // Audit Log
        // ---------------------------------------------

        auditLog({

            action:
                "ILLEGAL_HOARD_REGISTRATION",

            actor:
                req.user?.userId ||
                payload.userId ||
                "system",

            module:
                "illegal_hoard",

            status:
                isSuccess
                    ? "SUCCESS"
                    : "FAILED",

            details: {

                outErrorCode:
                    out.errorCode,

                outErrorMsg:
                    out.message,

            },

            requestMeta:
                requestMeta(req),

        });

        return res.ok(out);

    } catch (error) {

        console.error(
            "Illegal Hoard Registration error:",
            error
        );

        logApiError(
            req,
            500,
            error.message,
            "Illegal Hoard Registration error"
        );

        return next(error);
    }
}

async function getPanchanamaDetails(req, res, next) {
  try {
    const { id } = req.query;

    if (!id) {
      return res.badRequest("Panchanama ID is required");
    }

    const result = await getPanchanamaDetailsService(id);

    logApiSuccess(
      req,
      200,
      {
        id,
        detailsCount: result?.details?.length || 0,
        demolitionDetailsCount:
          result?.demolitionDetails?.length || 0,
      },
      'Panchanama Details completed'
    );

    return res.ok(result);

  } catch (error) {

    logApiError(
      req,
      500,
      error.message,
      'Panchanama Details search error'
    );

    return next(error);
  }
}

async function generatePanchnamaPdf(req, res, next) {
  try {
    const { id } = req.body;
    const pdfBuffer = await generatePanchnamaPdfService(id);
    logApiSuccess(req, 200, 'PDF generated successfully');
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `inline; filename="Panchanama_${id}.pdf"`);
    res.send(pdfBuffer);
  } catch (error) {
    logApiError(req, 500, error.message, 'Panchanama pdf generate error');
    return next(error);
  }
}

module.exports = { getWardList, getToiletList, getComplaintTypeList, registerComplaint, assignComplaint, getComplaintList ,
  getSupervisorList,getVendorList,registerParticipant,getPanchanamalist,registerIllegalHoard,getPanchanamaDetails,generatePanchnamaPdf
};
