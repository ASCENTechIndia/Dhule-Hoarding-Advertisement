const express = require("express");
const validate = require("../../middleware/validate.middleware");
const { authRequired } = require("../../middleware/auth");
const {
  authComplaintSchema,
  complaintWorkStatusSchema,
} = require("./report.validation");
const {
  authComplaint,
  getCompListForSup,
  getCompListForSI,
  getImagesCon,
  resolvedListbyVendor,
  resolvedListbySup,
  complaintStatusUpdate,
  getSolvedComplaintImagesCon,
  getSupervisorStatusCon,
  resolvedListbyVendorList,
  getReworkComplaintImages,
  complaintWorkStatusIns,
  getUserDetailsController,
  fineApplicationListController,
  fineBreakdownController,
} = require("./report.controller");
const { complaintStatusSchema } = require("./report.validation");

const router = express.Router();

router.post("/authComplaint", validate(authComplaintSchema), authComplaint);
router.post(
  "/complaintStatusUpdate",
  validate(complaintStatusSchema),
  complaintStatusUpdate,
); // vendor submitting his work
router.post("/complaintWorkStatusIns", complaintWorkStatusIns);

router.get("/getCompListForSup", getCompListForSup);
router.get("/getCompListForSI", getCompListForSI);
router.get("/getImages", getImagesCon);
router.get("/getSolvedComplaintImages", getSolvedComplaintImagesCon);
router.get("/supervisorStatus", getSupervisorStatusCon);
router.get("/rslvdListbyVendor", resolvedListbyVendor);
router.get("/rslvdListbyVendorList", resolvedListbyVendorList);
router.get("/rslvdListApprovedbySup", resolvedListbySup);
router.get("/getReworkImages", getReworkComplaintImages);
router.post("/get-user-details", getUserDetailsController);
router.get("/get-fine-application-list", fineApplicationListController);
router.get("/get-fine-breakdown", fineBreakdownController);

module.exports = router;
