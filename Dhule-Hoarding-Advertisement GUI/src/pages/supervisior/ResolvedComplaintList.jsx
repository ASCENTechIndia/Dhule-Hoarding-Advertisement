import Layout from "../../components/Layout";
import { useState, useEffect } from "react";
import apiClient from "../../services/apiClient";
import ResponseModal from "../../components/ResponseModal";
import { useAuth } from "../../context/AuthContext";
import { useLoader } from "../../context/LoaderContext";

const ResolvedComplaintList = () => {
  const { user } = useAuth();
  const ulbid = user?.orgId;
  const { setLoader } = useLoader();
  const [applications, setApplications] = useState([]);
  const [originalApplicationData, setOriginalApplicationData] = useState([]);
  const [stageWiseImages, setStageWiseImages] = useState([]);
  const [loading, setLoading] = useState(true);

  const [showModal, setShowModal] = useState(false);
  const [selectedApplication, setSelectedApplication] = useState(null);

  // Supervisor action states
  const [supervisorRemark, setSupervisorRemark] = useState("");

  // Response Modal states
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalType, setModalType] = useState("info");
  const [modalTitle, setModalTitle] = useState("");
  const [modalMessage, setModalMessage] = useState("");

  // Pagination states
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalRecords, setTotalRecords] = useState(0);
  const [pageSize, setPageSize] = useState(5);
  const [dateFilter, setDateFilter] = useState({
    from: getTodayDate(),
    to: getTodayDate(),
  });
  const [statusFilter, setStatusFilter] = useState("A");

  // Fetch applications from API
  const fetchApplications = async (page = 1) => {
    try {
      setLoader(true);
      const params = {
        ulbid,
        page,
        limit: pageSize,
        ...(dateFilter.from && { fromDate: dateFilter.from }),
        ...(dateFilter.to && { toDate: dateFilter.to }),
        ...(statusFilter !== "" && { status: statusFilter }),
      };

      const response = await apiClient.get("/authComplaint/getCompListForSup", {
        params,
      });
      console.log(response);
      if (response.success && response.data) {
        setApplications(response.data.data);
        setOriginalApplicationData(response.data.data);
        setCurrentPage(response.data.pagination.page);
        setTotalPages(response.data.pagination.totalPages);
        setTotalRecords(response.data.pagination.total);
      }
    } catch (err) {
      console.error("Error fetching applications:", err);
      setModalType("error");
      setModalTitle("Error");
      setModalMessage("Failed to load applications. Please try again later.");
      setIsModalOpen(true);
    } finally {
      setLoader(false);
    }
  };

  function getTodayDate() {
    const today = new Date();
    const year = today.getFullYear();
    const month = String(today.getMonth() + 1).padStart(2, "0");
    const day = String(today.getDate()).padStart(2, "0");
    return `${year}-${month}-${day}`;
  }

  // Fetch applications on component mount
  useEffect(() => {
    if (ulbid) fetchApplications(1);
  }, [statusFilter, dateFilter, ulbid]);

  // Fetch stage-wise images for selected application
  const fetchStageWiseImages = async (application) => {
    try {
      setLoader(true);
      const response = await apiClient.get(
        `/authComplaint/getImages?ulbid=${ulbid}&toiletId=${application.NUM_EMPCTPTENTRY_TOILETID}&applid=${application.NUM_EMPCTPTENTRY_ID}`,
      );

      if (response.success && response.data) {
        setStageWiseImages(response.data);
      }
    } catch (err) {
      console.error("Error fetching stage-wise images:", err);
    } finally {
      setLoader(false);
    }
  };

  // Open modal and display selected application details
  const handleReviewClick = async (application) => {
    setSelectedApplication(application);
    setSupervisorRemark("");
    setStageWiseImages([]); // Reset images

    // Fetch stage-wise images
    await fetchStageWiseImages(application);

    setShowModal(true);
  };

  // Format date
  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString("en-IN", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  // Group images by stage
  const getImagesByStage = () => {
    const stagesMap = new Map();

    // If stageWiseImages is populated, use it
    if (stageWiseImages && stageWiseImages.length > 0) {
      stageWiseImages.forEach((entry) => {
        const stageName = entry.VAR_CTPTSTAGE_NAME;
        if (!stagesMap.has(stageName)) {
          stagesMap.set(stageName, {
            stageName: stageName,
            images: [],
          });
        }

        const images = [
          entry.BOLB_EMPCTPTENTRY_IMAGE,
          entry.BOLB_EMPCTPTENTRY_IMAGE2,
          entry.BOLB_EMPCTPTENTRY_IMAGE3,
        ].filter((img) => img && img !== null && img.trim() !== "");

        stagesMap.get(stageName).images.push(...images);
      });
    }

    return Array.from(stagesMap.values());
  };

  // Handle Approve action
  const handleApprove = async () => {
    if (!supervisorRemark.trim()) {
      setModalType("warning");
      setModalTitle("Warning");
      setModalMessage("Please add a remark before approving this application.");
      setIsModalOpen(true);
      return;
    }

    try {
      setLoader(true);
      const payload = {
        userId: user.userId,
        applId: selectedApplication.NUM_EMPCTPTENTRY_ID,
        ulbId: ulbid,
        mode: 1,
        status: "A",
        remark: supervisorRemark,
      };

      const response = await apiClient.post(
        "/authComplaint/authComplaint",
        payload,
      );

      if (response.success) {
        setModalType("success");
        setModalTitle("Success");
        setModalMessage(response.data.message);
        setIsModalOpen(true);

        setShowModal(false);
        setSupervisorRemark("");
        fetchApplications(currentPage); // Refresh the list with current page
      }
    } catch (err) {
      console.error("Error approving application:", err);
      setModalType("error");
      setModalTitle("Error");
      setModalMessage("Failed to approve application. Please try again.");
      setIsModalOpen(true);
    } finally {
      setLoader(false);
    }
  };

  // Handle Reject action
  const handleReject = async () => {
    if (!supervisorRemark.trim()) {
      setModalType("warning");
      setModalTitle("Warning");
      setModalMessage("Please add a remark before rejecting this application.");
      setIsModalOpen(true);
      return;
    }

    try {
      setLoader(true);
      const payload = {
        userId: user.userId,
        applId: selectedApplication.NUM_EMPCTPTENTRY_ID,
        ulbId: ulbid,
        mode: 1,
        status: "R",
        remark: supervisorRemark,
      };

      const response = await apiClient.post(
        "/authComplaint/authComplaint",
        payload,
      );

      if (response.success) {
        setModalType("success");
        setModalTitle("Success");
        setModalMessage(response.data.message);
        setIsModalOpen(true);

        setShowModal(false);
        setSupervisorRemark("");
        fetchApplications(currentPage); // Refresh the list with current page
      }
    } catch (err) {
      console.error("Error rejecting application:", err);
      setModalType("error");
      setModalTitle("Error");
      setModalMessage("Failed to reject application. Please try again.");
      setIsModalOpen(true);
    } finally {
      setLoader(false);
    }
  };

  // Handle page change
  const handlePageChange = (newPage) => {
    if (newPage >= 1 && newPage <= totalPages) {
      setCurrentPage(newPage);
      fetchApplications(newPage);
    }
  };

  // Generate pagination page numbers
  const getPaginationPages = () => {
    const pages = [];
    const maxPagesToShow = 5;
    let startPage = Math.max(1, currentPage - Math.floor(maxPagesToShow / 2));
    let endPage = Math.min(totalPages, startPage + maxPagesToShow - 1);

    if (endPage - startPage + 1 < maxPagesToShow) {
      startPage = Math.max(1, endPage - maxPagesToShow + 1);
    }

    for (let i = startPage; i <= endPage; i++) {
      pages.push(i);
    }

    return pages;
  };

  // Render image thumbnails with click handler
  const renderImageGallery = (images) => {
    const openImageInNewTab = (img) => {
      try {
        // Convert base64 to blob
        const binaryString = atob(img);
        const bytes = new Uint8Array(binaryString.length);
        for (let i = 0; i < binaryString.length; i++) {
          bytes[i] = binaryString.charCodeAt(i);
        }
        const blob = new Blob([bytes], { type: "image/jpeg" });

        // Create object URL from blob
        const blobUrl = URL.createObjectURL(blob);

        // Open in new tab
        window.open(blobUrl, "_blank");
      } catch (err) {
        console.error("Error opening image:", err);
        alert("Unable to open image. Please try again.");
      }
    };

    return (
      <div className="d-flex gap-2 flex-wrap">
        {images.length > 0 ? (
          images.map((img, idx) => (
            <div key={idx} style={{ position: "relative" }}>
              <img
                src={`data:image/jpeg;base64,${img}`}
                alt={`stage-${idx}`}
                style={{
                  width: "100px",
                  height: "100px",
                  objectFit: "cover",
                  borderRadius: "8px",
                  border: "2px solid #dee2e6",
                  cursor: "pointer",
                  transition: "all 0.3s ease",
                }}
                onClick={() => openImageInNewTab(img)}
                onMouseEnter={(e) =>
                  (e.target.style.boxShadow = "0 4px 12px rgba(0,0,0,0.15)")
                }
                onMouseLeave={(e) => (e.target.style.boxShadow = "none")}
              />
            </div>
          ))
        ) : (
          <p className="text-muted mb-0">No images available</p>
        )}
      </div>
    );
  };

  const getBadge = (flag) => {
    if (flag === "A") {
      return (
        <span className="badge bg-success rounded-pill px-3 py-2">
          <i className="bi bi-check-circle me-1"></i> Approve
        </span>
      );
    } else if (flag === "R") {
      return (
        <span className="badge bg-danger rounded-pill px-3 py-2">
          <i className="bi bi-x-circle me-1"></i> Rejected
        </span>
      );
    } else {
      return (
        <span className="badge bg-warning rounded-pill px-3 py-2 text-dark">
          <i className="bi bi-clock-history me-1"></i> Pending
        </span>
      );
    }
  };

  // Helper function to compare only the date part (YYYY-MM-DD)
  const isDateInRange = (dateISO, fromDate, toDate) => {
    if (!dateISO) return false;
    const dateOnly = dateISO.split("T")[0]; // "2026-05-29"
    if (fromDate && toDate) {
      return dateOnly >= fromDate && dateOnly <= toDate;
    } else if (fromDate) {
      return dateOnly >= fromDate;
    } else if (toDate) {
      return dateOnly <= toDate;
    }
    return true;
  };

  const handleDateChangeFilter = (e) => {
    const { name, value } = e.target;
    setDateFilter((prev) => ({ ...prev, [name]: value }));
  };

  const handleStatusChange = (e) => {
    setStatusFilter(e.target.value);
  };
  const handleClearFilters = () => {
    setDateFilter({
      from: "",
      to: "",
    });
    setStatusFilter("");
    setCurrentPage(1);
  };

  return (
    <Layout>
      <div className="panel">
        <div className="panel-header d-flex justify-content-between">
          <div>
            <h2 className="h5 mb-1 section-title">
              <i className="bi bi-file-earmark-text" aria-hidden="true"></i>
              <span>All Resolved Complaints ({applications.length})</span>
            </h2>
            <p className="text-muted mb-0">
              View resolved complaint details, images, and location.
            </p>
          </div>
          <div>
            <div className="filter-bar">
              <div className="filter-group">
                <label htmlFor="fromDate">From</label>
                <input
                  type="date"
                  name="from"
                  className="filter-input"
                  style={{ width: "150px" }}
                  value={dateFilter.from}
                  onChange={handleDateChangeFilter}
                />
              </div>
              <div className="filter-group">
                <label htmlFor="toDate">To</label>
                <input
                  type="date"
                  name="to"
                  style={{ width: "150px" }}
                  className="filter-input"
                  value={dateFilter.to}
                  onChange={handleDateChangeFilter}
                />
              </div>
              <div className="filter-group">
                <label htmlFor="statusSelect">Status</label>
                <select
                  name="status"
                  className="filter-select"
                  style={{ width: "107px" }}
                  value={statusFilter}
                  onChange={handleStatusChange}
                >
                  <option value="">All</option>
                  <option value="A">Approve</option>
                  <option value="R">Reject</option>
                  <option value="P">Pending</option>
                </select>
              </div>
              <div
                className="filter-group"
                style={{ justifyContent: "flex-end" }}
              >
                <button
                  type="button"
                  className="btn-clear-filters"
                  onClick={handleClearFilters}
                >
                  <i className="bi bi-x-lg me-1"></i> Clear
                </button>
              </div>
            </div>
          </div>
        </div>
        <div className="table-responsive">
          <table className="table align-middle mb-0">
            <thead>
              <tr>
                <th scope="col">Ward</th>
                <th scope="col">Toilet Location</th>
                <th scope="col">INCHARGE NAME</th>
                <th scope="col">Employee</th>
                <th scope="col">Status</th>
                <th scope="col">Remark</th>
                <th scope="col">Date</th>
                <th scope="col" className="text-end">
                  Action
                </th>
              </tr>
            </thead>
            <tbody>
              {applications.map((app, idx) => (
                <tr key={app.NUM_EMPCTPTENTRY_ID || idx}>
                  <td className="fw-semibold">
                    Ward {app.NUM_CTPTTYPE_WARDID}
                  </td>
                  <td>{app.VAR_CTPTTYPE_TOILETLOCATION}</td>
                  <td>{app.VAR_CTPTTYPE_USERNAME}</td>
                  <td>{app.USERNAME}</td>
                  <td>{getBadge(app.VAR_EMPCTPTENTRY_SUPFLAG)}</td>
                  <td style={{ maxWidth: "250px" }}>
                    <small>{app.VAR_EMPCTPTENTRY_REMARK}</small>
                  </td>
                  <td>{formatDate(app.DAT_EMPCTPTENTRY_DATE)}</td>
                  <td className="text-end">
                    <button
                      className={`btn btn-sm ${
                        app.VAR_EMPCTPTENTRY_SUPFLAG === "A"
                          ? "btn-outline-secondary"
                          : "btn-outline-primary"
                      }`}
                      onClick={() => handleReviewClick(app)}
                      disabled={app.VAR_EMPCTPTENTRY_SUPFLAG === "A"}
                      title={
                        app.VAR_EMPCTPTENTRY_SUPFLAG === "A"
                          ? "Already approved"
                          : ""
                      }
                    >
                      <i className="bi bi-eye me-1"></i> Review
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Pagination Controls */}
        <div className="d-flex align-items-center justify-content-between mt-4">
          <div className="text-muted small">
            Showing <strong>{(currentPage - 1) * pageSize + 1}</strong> to{" "}
            <strong>{Math.min(currentPage * pageSize, totalRecords)}</strong> of{" "}
            <strong>{totalRecords}</strong> applications
          </div>
          <nav aria-label="Page navigation">
            <ul className="pagination mb-0">
              <li
                className={`page-item ${currentPage === 1 ? "disabled" : ""}`}
              >
                <button
                  className="page-link"
                  onClick={() => handlePageChange(1)}
                  disabled={currentPage === 1}
                >
                  <i className="bi bi-chevron-double-left"></i>
                </button>
              </li>
              <li
                className={`page-item ${currentPage === 1 ? "disabled" : ""}`}
              >
                <button
                  className="page-link"
                  onClick={() => handlePageChange(currentPage - 1)}
                  disabled={currentPage === 1}
                >
                  <i className="bi bi-chevron-left"></i>
                </button>
              </li>

              {getPaginationPages().map((page) => (
                <li
                  key={page}
                  className={`page-item ${currentPage === page ? "active" : ""}`}
                >
                  <button
                    className="page-link"
                    onClick={() => handlePageChange(page)}
                  >
                    {page}
                  </button>
                </li>
              ))}

              <li
                className={`page-item ${
                  currentPage === totalPages ? "disabled" : ""
                }`}
              >
                <button
                  className="page-link"
                  onClick={() => handlePageChange(currentPage + 1)}
                  disabled={currentPage === totalPages}
                >
                  <i className="bi bi-chevron-right"></i>
                </button>
              </li>
              <li
                className={`page-item ${
                  currentPage === totalPages ? "disabled" : ""
                }`}
              >
                <button
                  className="page-link"
                  onClick={() => handlePageChange(totalPages)}
                  disabled={currentPage === totalPages}
                >
                  <i className="bi bi-chevron-double-right"></i>
                </button>
              </li>
            </ul>
          </nav>
        </div>
      </div>

      {/* Review Application Modal - Two Column Layout */}
      {showModal && selectedApplication && (
        <div
          className="modal show d-block"
          tabIndex="-1"
          role="dialog"
          style={{ backgroundColor: "rgba(0,0,0,0.5)" }}
        >
          <div className="modal-dialog modal-lg" style={{ maxWidth: "1000px" }}>
            <div className="modal-content">
              <div className="modal-header">
                <h5 className="modal-title">
                  <i className="bi bi-file-earmark-check me-2"></i>
                  Review Application #{selectedApplication.NUM_EMPCTPTENTRY_ID}
                </h5>
                <button
                  type="button"
                  className="btn-close"
                  onClick={() => setShowModal(false)}
                ></button>
              </div>
              <div className="modal-body">
                <div className="row g-3">
                  {/* Left Column - Application Details and Supervisor Action */}
                  <div className="col-lg-5">
                    {/* Application Details */}
                    <div className="card mb-3">
                      <div className="card-header">
                        <h6 className="mb-0">Application Details</h6>
                      </div>
                      <div className="card-body">
                        <div className="row g-3">
                          <div className="col-md-6">
                            <label className="form-label fw-semibold text-muted">
                              Ward
                            </label>
                            <p className="h6 mb-0">
                              Ward {selectedApplication.NUM_CTPTTYPE_WARDID}
                            </p>
                          </div>
                          <div className="col-md-6">
                            <label className="form-label fw-semibold text-muted">
                              Toilet Location
                            </label>
                            <p className="h6 mb-0">
                              {selectedApplication.VAR_CTPTTYPE_TOILETLOCATION}
                            </p>
                          </div>
                          <div className="col-md-6">
                            <label className="form-label fw-semibold text-muted">
                              Incharge Name
                            </label>
                            <p className="h6 mb-0">
                              {selectedApplication.VAR_CTPTTYPE_USERNAME}
                            </p>
                          </div>
                          <div className="col-md-6">
                            <label className="form-label fw-semibold text-muted">
                              Employee Name
                            </label>
                            <p className="h6 mb-0">
                              {selectedApplication.USERNAME}
                            </p>
                          </div>
                          <div className="col-md-6">
                            <label className="form-label fw-semibold text-muted">
                              Employee ID
                            </label>
                            <p className="h6 mb-0">
                              {selectedApplication.USERID}
                            </p>
                          </div>
                          <div className="col-md-6">
                            <label className="form-label fw-semibold text-muted">
                              Submission Date
                            </label>
                            <p className="h6 mb-0">
                              {formatDate(
                                selectedApplication.DAT_EMPCTPTENTRY_DATE,
                              )}
                            </p>
                          </div>
                          <div className="col-md-12">
                            <label className="form-label fw-semibold text-muted">
                              Remark
                            </label>
                            <p className="h6 mb-0">
                              {selectedApplication.VAR_EMPCTPTENTRY_REMARK}
                            </p>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Supervisor Action */}
                    <div className="card">
                      <div className="card-header">
                        <h6 className="mb-0">Supervisor Action</h6>
                      </div>
                      <div className="card-body">
                        <label className="form-label fw-semibold">
                          Remark *
                        </label>
                        <textarea
                          className="form-control"
                          rows="3"
                          placeholder="Add your remarks about this application before approving or rejecting..."
                          value={supervisorRemark}
                          onChange={(e) => setSupervisorRemark(e.target.value)}
                        ></textarea>
                        <small className="text-muted mt-2 d-block">
                          Remark is required to approve or reject this
                          application.
                        </small>
                      </div>
                    </div>
                  </div>

                  {/* Right Column - Location Map and Stage Wise Images */}
                  <div className="col-lg-7">
                    {/* Location Map */}
                    <div className="card mb-3">
                      <div className="card-header">
                        <h6 className="mb-0">Location</h6>
                      </div>
                      <div className="card-body">
                        <div
                          style={{
                            width: "100%",
                            height: "250px",
                            borderRadius: "8px",
                            overflow: "hidden",
                            border: "2px solid #dee2e6",
                            backgroundColor: "#f8f9fa",
                          }}
                        >
                          <iframe
                            width="100%"
                            height="100%"
                            frameBorder="0"
                            style={{ border: 0 }}
                            src={`https://www.google.com/maps/embed/v1/place?key=AIzaSyAMu4Ig2LTmXqP2uIRuDWvj2eqaCpYXNao&q=${selectedApplication.VAR_EMPCTPTENTRY_LATITUDE},${selectedApplication.VAR_EMPCTPTENTRY_LONGITUDE}`}
                            title="Location Map"
                          ></iframe>
                        </div>
                        <div className="mt-2 small text-muted">
                          <p className="mb-1">
                            <strong>Latitude:</strong>{" "}
                            {selectedApplication.VAR_EMPCTPTENTRY_LATITUDE}
                          </p>
                          <p className="mb-0">
                            <strong>Longitude:</strong>{" "}
                            {selectedApplication.VAR_EMPCTPTENTRY_LONGITUDE}
                          </p>
                        </div>
                      </div>
                    </div>

                    <div className="card">
                      <div className="card-header">
                        <h6 className="mb-0">Stage Wise Images</h6>
                      </div>
                      <div
                        className="card-body"
                        style={{ maxHeight: "300px", overflowY: "auto" }}
                      >
                        {getImagesByStage().length > 0 ? (
                          getImagesByStage().map((stage, idx) => (
                            <div key={idx} className="mb-4">
                              <div className="mb-3">
                                <i className="bi bi-images me-2"></i>
                                <strong>{stage.stageName}</strong>
                              </div>
                              {renderImageGallery(stage.images)}
                            </div>
                          ))
                        ) : (
                          <p className="text-muted">No images available</p>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              <div className="modal-footer">
                <button
                  type="button"
                  className="btn btn-outline-secondary"
                  onClick={() => setShowModal(false)}
                >
                  Close
                </button>
                <button
                  type="button"
                  className="btn btn-danger"
                  onClick={handleReject}
                  disabled={!supervisorRemark.trim()}
                >
                  <i className="bi bi-x-circle me-1"></i> Reject
                </button>
                <button
                  type="button"
                  className="btn btn-success"
                  onClick={handleApprove}
                  disabled={!supervisorRemark.trim()}
                >
                  <i className="bi bi-check-circle me-1"></i> Approve
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Response Modal */}
      <ResponseModal
        isOpen={isModalOpen}
        type={modalType}
        title={modalTitle}
        message={modalMessage}
        onClose={() => setIsModalOpen(false)}
      />
    </Layout>
  );
};

export default ResolvedComplaintList;
