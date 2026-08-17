const { logApiSuccess, logApiError } = require("../../utils/log");
const {
  getSummaryCardsValueService,
  getWardWiseCleaningStatusService,
  getTopComplaintCategoryService,
  getRecentInspectionService,
  getCleaningComplienceService,
  getCitizenComplaintStatusService,
  getBillOverviewService,
  getRecentComplaintService,
  serviceWardList
} = require("./dashboard.service");

async function getSummaryCardValuesController(req, res, next) {
  try {
    const payload = req.query;
    const result = await getSummaryCardsValueService(payload);

    logApiSuccess(
      req,
      200,
      { count: result?.length || 0 },
      "Summary cards value fetched successfully",
    );

    return res.ok({ data: result?.data || result });
  } catch (error) {
    logApiError(req, 500, error.message, "Summary cards fetching error");
    return next(error);
  }
}

async function getWardWiseCleaningStatusController(req, res, next) {
  try {
    const payload = req.query
    const result = await getWardWiseCleaningStatusService(payload);

    logApiSuccess(
      req,
      200,
      { count: result?.length || 0 },
      "Ward wise cleaning status values fetched successfully",
    );

    return res.ok({ data: result?.data || result || [] });
  } catch (error) {
    logApiError(
      req,
      500,
      error.message,
      "Ward wise cleaning status fetching error",
    );
    return next(error);
  }
}

async function getTopComplaintCategoryController(req, res, next) {
  try {
    const payload = req.query;
    const result = await getTopComplaintCategoryService(payload);

    logApiSuccess(
      req,
      200,
      { count: result?.length || 0 },
      "Top complaint category values fetched successfully",
    );

    return res.ok({ data: result?.data || result || [] });
  } catch (error) {
    logApiError(
      req,
      500,
      error.message,
      "Top complaint category fetching error",
    );
    return next(error);
  }
}

async function getRecentInspectionController(req, res, next) {
  try {
    const payload = req.query;
    const result = await getRecentInspectionService(payload);

    logApiSuccess(
      req,
      200,
      { count: result?.length || 0 },
      "Recent inspections values fetched successfully",
    );

    return res.ok({ data: result?.data || result || [] });
  } catch (error) {
    logApiError(req, 500, error.message, "Recent inspections fetching error");
    return next(error);
  }
}

async function getCleaningComplienceController(req, res, next) {
  try {
    const payload = req.query
    const result = await getCleaningComplienceService(payload);

    logApiSuccess(
      req,
      200,
      { count: result?.length || 0 },
      "Cleaning complience values fetched successfully",
    );

    return res.ok({ data: result?.data || result || [] });
  } catch (error) {
    logApiError(req, 500, error.message, "Cleaning complience fetching error");
    return next(error);
  }
}

async function getCitizenComplaintStatusController(req, res, next) {
  try {
    const payload = req.query
    const result = await getCitizenComplaintStatusService(payload);

    logApiSuccess(
      req,
      200,
      { count: result?.length || 0 },
      "Citizen complaint status values fetched successfully",
    );

    return res.ok({ data: result?.data || result || [] });
  } catch (error) {
    logApiError(
      req,
      500,
      error.message,
      "Citizen complaint status fetching error",
    );
    return next(error);
  }
}

async function getBillOverviewController(req, res) {
  try {
    const result = await getBillOverviewService();

    logApiSuccess(
      req,
      200,
      { count: result?.length || 0 },
      "Bill overview fetched successfully",
    );

    return res.ok({ data: result?.data || result || [] });
  } catch (error) {
    logApiError(req, 500, error.message, "Bill overview fetching error");
    return next(error);
  }
}

async function getRecentComplaintController(req, res, next) {
  try {
    const payload = req.query
    const result = await getRecentComplaintService(payload);

    logApiSuccess(
      req,
      200,
      { count: result?.length || 0 },
      "Recent complaint fetched successfully",
    );

    return res.ok({ data: result?.data || result || [] });
  } catch (error) {
    logApiError(req, 500, error.message, "Recent complaint fetching error");
    return next(error);
  }
}

async function getWardList(req, res, next) {
  try {
    const rows = await serviceWardList(req.query);
    logApiSuccess( req, 200, { count: rows?.length || 0 }, 'Ward List Report completed' );
    return res.ok(rows);
  } catch (error) {
    logApiError(req, 500, error.message, 'Ward List Report search error');
    return next(error);
  }
}

module.exports = {
  getSummaryCardValuesController,
  getWardWiseCleaningStatusController,
  getTopComplaintCategoryController,
  getRecentInspectionController,
  getCleaningComplienceController,
  getCitizenComplaintStatusController,
  getBillOverviewController,
  getRecentComplaintController,
  getWardList
};
