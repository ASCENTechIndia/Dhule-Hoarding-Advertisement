const {
  authComplaintRepo,
  compListforSupRepo,
  compListforSIRepo,
  getImages,
  rslvdListbyVendorRepo,
  rslvdListbySupRepo,
  getSolvedComplaintImagesRepo,
  getSupervisorStatusRepo,
  rslvdListbyVendorListRepo,
  getReworkImages,
  complaintWorkStatusInsRepo,
  userDetailsRepo,
  fineApplicationListRepo,
  fineBreakdownRepo,
} = require("./report.repo");

const { complaintStatusUpdateRepo } = require("./report.repo");

async function authComplaintService(payload) {
  return authComplaintRepo(payload);
}

async function getCompListForSupService(
  ulbid,
  fromDate,
  toDate,
  status,
  page,
  limit,
) {
  return compListforSupRepo(ulbid, fromDate, toDate, status, page, limit);
}

async function getCompListSIService(
  ulbid,
  fromDate,
  toDate,
  status,
  page,
  limit,
) {
  return compListforSIRepo(ulbid, fromDate, toDate, status, page, limit);
}

async function getImagesService(ulbid, toiletId, applid) {
  return getImages(ulbid, toiletId, applid);
}

async function getrslvdListbyVendorService(
  ulbid,
  supervisorId,
  fromDate,
  toDate,
  status,
  page,
  limit,
) {
  return rslvdListbyVendorRepo(
    ulbid,
    supervisorId,
    fromDate,
    toDate,
    status,
    page,
    limit,
  );
}

async function getrslvdListbyVendorListService(
  ulbid,
  vendorId,
  fromDate,
  toDate,
  status,
  page,
  limit,
) {
  return rslvdListbyVendorListRepo(
    ulbid,
    vendorId,
    fromDate,
    toDate,
    status,
    page,
    limit,
  );
}

async function getrslvdListbySupService(
  ulbid,
  fromDate,
  toDate,
  status,
  page,
  limit,
) {
  return rslvdListbySupRepo(ulbid, fromDate, toDate, status, page, limit);
}

async function getSolvedComplaintImagesService(ulbid, siid, complaintid) {
  return getSolvedComplaintImagesRepo(ulbid, siid, complaintid);
}

async function getSupervisorStatusService() {
  return getSupervisorStatusRepo();
}

async function getReworkImagesService(complaintid) {
  return getReworkImages(complaintid);
}

async function complaintStatusUpdateService(payload) {
  return complaintStatusUpdateRepo(payload);
}

async function complaintWorkStatusInsService(payload) {
  return complaintWorkStatusInsRepo(payload);
}

async function userDetailsService(userId, ulbId, toiletId) {
  return userDetailsRepo(userId, ulbId, toiletId);
}

async function fineApplicationListService(
  ulbid,
  fromDate,
  toDate,
  page,
  limit,
  designation,
  userId  
) {
  return fineApplicationListRepo(ulbid, fromDate, toDate, page, limit, designation, userId);
}

async function fineBreakdownService(ulbid, workId) {
  return fineBreakdownRepo(ulbid, workId);
}

module.exports = {
  authComplaintService,
  getCompListForSupService,
  getCompListSIService,
  getImagesService,
  getrslvdListbyVendorService,
  getrslvdListbyVendorListService,
  getrslvdListbySupService,
  getSolvedComplaintImagesService,
  getSupervisorStatusService,
  getReworkImagesService,
  complaintWorkStatusInsService,
  userDetailsService,
  fineApplicationListService,
  fineBreakdownService,
};

module.exports.complaintStatusUpdateService = complaintStatusUpdateService;
