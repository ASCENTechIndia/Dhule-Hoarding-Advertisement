const express = require('express');
const validate = require('../../middleware/validate.middleware');
const { authRequired } = require('../../middleware/auth');
const { 
    // complaintRegistrationSchema, assignComplaintSchema , 
    participantRegistrationSchema , illegalHoardSchema } = require('./registerComplaint.validation');
const { 
    // getWardList, getToiletList, getComplaintTypeList, registerComplaint, assignComplaint, getComplaintList,
    // getSupervisorList,getVendorList,
    registerParticipant,getPanchanamalist ,registerIllegalHoard,getPanchanamaDetails
 } = require('./registerComplaint.controller');

const router = express.Router();

// router.get('/wardList', getWardList);
// router.get('/vendorList', getVendorList);
// router.get('/toiletList', getToiletList);
// router.get('/complaintTypeList', getComplaintTypeList);
// router.post('/insertComplaint', validate(complaintRegistrationSchema), registerComplaint );
// router.post('/assignComplaint', validate(assignComplaintSchema), assignComplaint );
// router.get('/supervisorList', getSupervisorList);
// router.get('/getCitizenComplaintList', getComplaintList);


router.post(
    "/insertParticipant",
    validate(participantRegistrationSchema),
    registerParticipant
);
router.get('/getPanchanamalist', getPanchanamalist);

router.get(
  '/getPanchanamaDetails',
  getPanchanamaDetails
);

router.post(
    "/insertIllegalHoard",
    validate(illegalHoardSchema),
    registerIllegalHoard
);
module.exports = router;