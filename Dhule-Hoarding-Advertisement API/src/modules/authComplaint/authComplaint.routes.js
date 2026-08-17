const express = require("express");
const validate = require("../../middleware/validate.middleware");
const { authRequired } = require("../../middleware/auth");
const {
  authComplaintSchema,
  complaintWorkStatusSchema,
} = require("./authComplaint.validation");
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
  getVendorList,complaintWorkStatusIns,getUserDetailsController,getComplaintInspectionImagesCon,getInspectionImagesCon
} = require("./authComplaint.controller");
const { complaintStatusSchema } = require("./authComplaint.validation");

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
router.get('/getInspectionImages', getInspectionImagesCon);
router.get('/getComplaintInspectionImages', getComplaintInspectionImagesCon);
router.get("/getSolvedComplaintImages", getSolvedComplaintImagesCon);
router.get("/supervisorStatus", getSupervisorStatusCon);
router.get("/rslvdListbyVendor", resolvedListbyVendor);
router.get("/rslvdListbyVendorList", resolvedListbyVendorList);
router.get("/rslvdListApprovedbySup", resolvedListbySup);
router.get("/getReworkImages", getReworkComplaintImages);
router.get("/vendorList", getVendorList);
router.post('/get-user-details', getUserDetailsController);

module.exports = router;
