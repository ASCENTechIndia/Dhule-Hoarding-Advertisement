const express = require("express");
const {
  getSummaryCardValuesController,
  getWardWiseCleaningStatusController,
  getTopComplaintCategoryController,
  getRecentInspectionController,
  getCleaningComplienceController,
  getCitizenComplaintStatusController,
  getBillOverviewController,
  getRecentComplaintController,
  getWardList
} = require("./dashboard.controller");

const router = express.Router();

// Dashbaord
router.get("/summary-cards", getSummaryCardValuesController);
router.get("/ward-wise-cleaning-status", getWardWiseCleaningStatusController);
router.get("/top-complaint-category", getTopComplaintCategoryController);
router.get("/recent-inspection", getRecentInspectionController);
router.get("/cleaning-complience", getCleaningComplienceController);
router.get("/citizen-complaint-status", getCitizenComplaintStatusController);
router.get("/bill-overview", getBillOverviewController);

// Comlaint dashboard
router.get("/recent-complaint", getRecentComplaintController);
router.get('/wardList', getWardList);

module.exports = router;
