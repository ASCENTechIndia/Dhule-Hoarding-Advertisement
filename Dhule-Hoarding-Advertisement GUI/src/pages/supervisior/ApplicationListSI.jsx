import Layout from "../../components/Layout";
import { useState, useEffect } from "react";
import apiClient from "../../services/apiClient";
import ResponseModal from "../../components/ResponseModal";
import { useAuth } from "../../context/AuthContext";
import { useLoader } from "../../context/LoaderContext";

const ApplicationListSI = () => {
  const { user } = useAuth();     
  const ulbId = user?.orgId;
  const [applications, setApplications] = useState([]);
  const [stageWiseImages, setStageWiseImages] = useState([]);
  const [loading, setLoading] = useState(true);
  const { setLoader } = useLoader();

  const [showModal, setShowModal] = useState(false);
  const [selectedApplication, setSelectedApplication] = useState(null);

  // Supervisor action states
  const [supervisorRemark, setSupervisorRemark] = useState("");

  // ----- NEW: Image upload states for review -----
  const [reviewImages, setReviewImages] = useState([]);
  const [reviewPreviewUrls, setReviewPreviewUrls] = useState([]);

  // Response Modal states
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalType, setModalType] = useState("info");
  const [modalTitle, setModalTitle] = useState("");
  const [modalMessage, setModalMessage] = useState("");
  const [inspectionImages, setInspectionImages] = useState([]);

  // Pagination states
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalRecords, setTotalRecords] = useState(0);
  const [pageSize] = useState(10);
  const [dateFilter, setDateFilter] = useState({
    from: getTodayDate(),
    to: getTodayDate(),
  });
  const [statusFilter, setStatusFilter] = useState("all");

  function getTodayDate() {
    const today = new Date();
    const year = today.getFullYear();
    const month = String(today.getMonth() + 1).padStart(2, "0");
    const day = String(today.getDate()).padStart(2, "0");
    return `${year}-${month}-${day}`;
  }

  const fetchApplications = async (page = 1) => {
    try {
      setLoading(true);
      setLoader(true);
      const params = new URLSearchParams();
      params.append("ulbid", 4);
      params.append("page", page);
      params.append("limit", pageSize);
      params.append("userId", user.userId);

      if (dateFilter.from) params.append("fromDate", dateFilter.from);
      if (dateFilter.to) params.append("toDate", dateFilter.to);

      if (statusFilter !== "all") params.append("status", statusFilter);

      const response = await apiClient.get(
        `/authComplaint/getCompListForSI?${params.toString()}`,
      );

      if (response.success && response.data) {
        setApplications(response.data.data);
        setCurrentPage(response.data.pagination.page);
        setTotalPages(response.data.pagination.totalPages);
        setTotalRecords(response.data.pagination.total);
      }
    } catch (err) {
      console.error("Error fetching applications:", err);
      setModalType("");
      setModalTitle("");
      setModalMessage("Failed to load applications. Please try again later.");
      setIsModalOpen(true);
    } finally {
      setLoading(false);
      setLoader(false);
    }
  };

  useEffect(() => {
    fetchApplications(1);
  }, [dateFilter, statusFilter]);

  // Fetch stage-wise images for selected application
  const fetchStageWiseImages = async (application) => {
    try {
      setLoader(true);
      const result = await Promise.allSettled([
        apiClient.get(
          `/authComplaint/getImages?ulbid=${ulbId}&toiletId=${application.NUM_EMPCTPTWORK_TOILETID}&applid=${application.NUM_EMPCTPTWORK_ID}`,
        ),

        apiClient.get(
          `/authComplaint/getInspectionImages?ulbid=${ulbId}&applid=${application.NUM_EMPCTPTWORK_ID}`,
        ),
      ]);
      if (result[0].status === "fulfilled") {
        const response = result[0].value;
        if (response.success && response.data) {
          setStageWiseImages(response.data);
        } else {
          setStageWiseImages([]);
        }
      }

      if (result[1].status === "fulfilled") {
        const response = result[1].value;
        if (response.success && response?.data?.length > 0) {
          setInspectionImages(response.data);
        } else {
          setInspectionImages([]);
        }
      }
    } catch (err) {
      console.error("Error fetching stage-wise images:", err);
      setInspectionImages([]);
      setStageWiseImages([]);
    } finally {
      setLoader(false);
    }
  };

  // Open modal and display selected application details
  const handleReviewClick = async (application) => {
    setSelectedApplication(application);
    setSupervisorRemark("");
    setStageWiseImages([]);
    await fetchStageWiseImages(application);
    setShowModal(true);
  };

  // Format date
  const formatDate = (dateString) => {
  if (!dateString) return "";

  const [year, month, day] = dateString.split("T")[0].split("-");
  return `${day}/${month}/${year}`;
};

  // Group images by stage
const getImagesByStage = () => {
  const stagesMap = new Map();

  if (stageWiseImages && stageWiseImages.length > 0) {
    stageWiseImages.forEach((entry) => {
      const dateObj = new Date(entry.DETAILSDATE);

      const date = dateObj
        .toLocaleDateString("en-GB", {
          timeZone: "Asia/Kolkata",
        })
        .replace(/\//g, "-");

      const time = dateObj
        .toLocaleTimeString("en-GB", {
          timeZone: "Asia/Kolkata",
          hour: "2-digit",
          minute: "2-digit",
          second: "2-digit",
          hour12: true,
        })
        .toUpperCase();

      const stageName = `${entry.STAGENM} (${date} - ${time})`;

      if (!stagesMap.has(stageName)) {
        stagesMap.set(stageName, { stageName, images: [] });
      }

      const images = [entry.IMG1, entry.IMG2, entry.IMG3].filter(
        (img) => img && img.trim() !== ""
      );

      stagesMap.get(stageName).images.push(...images);
    });
  }

  return Array.from(stagesMap.values());
};

 const getInspectionImages = () => {
  const stagesMap = new Map();

  if (inspectionImages && inspectionImages.length > 0) {
    inspectionImages.forEach((entry) => {
      const dateObj = new Date(entry.DAT_CTPTWORKINSPECTION_INSDATE);

      const date = dateObj
        .toLocaleDateString("en-GB", {
          timeZone: "Asia/Kolkata",
        })
        .replace(/\//g, "-");

      const time = dateObj
        .toLocaleTimeString("en-GB", {
          timeZone: "Asia/Kolkata",
          hour: "2-digit",
          minute: "2-digit",
          second: "2-digit",
          hour12: true,
        })
        .toUpperCase();

      const stageName = `${entry.VAR_CTPTWORKINSPECTION_USERTYPE} (${date} - ${time})`;

      if (!stagesMap.has(stageName)) {
        stagesMap.set(stageName, { stageName, images: [] });
      }

      const images = [entry.IMG1, entry.IMG2, entry.IMG3].filter(
        (img) => img && img.trim() !== ""
      );

      stagesMap.get(stageName).images.push(...images);
    });
  }

  return Array.from(stagesMap.values());
};

  const fileToBase64 = (file) => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = () => {
        // Extract the base64 part (remove data:image/...;base64,)
        const result = reader.result.split(",")[1];
        resolve(result);
      };
      reader.onerror = (error) => reject(error);
    });
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
      // Convert review images to Base64
      const base64Images = await Promise.all(
        reviewImages.map((file) => fileToBase64(file)),
      );
      // Prepare image fields (max 3)
      const inspectionImg1 = base64Images[0] || null;
      const inspectionImg2 = base64Images[1] || null;
      const inspectionImg3 = base64Images[2] || null;

      const payload = {
        userId: user.userId,
        applId: selectedApplication.NUM_EMPCTPTWORK_ID,
        ulbId: 4,
        mode: 2,
        status: "A",
        remark: supervisorRemark,
        inspectionImg1,
        inspectionImg2,
        inspectionImg3,
        userType: "SI",
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
        fetchApplications(currentPage);
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
    if (reviewImages.length <= 0) {
      setModalType("warning");
      setModalTitle("Warning");
      setModalMessage("Please select atleast one image before rejecting");
      setIsModalOpen(true);
      return;
    }
    try {
      setLoader(true);
      // Convert review images to Base64
      const base64Images = await Promise.all(
        reviewImages.map((file) => fileToBase64(file)),
      );
      // Prepare image fields (max 3)
      const inspectionImg1 = base64Images[0] || null;
      const inspectionImg2 = base64Images[1] || null;
      const inspectionImg3 = base64Images[2] || null;
      const payload = {
        userId: user.userId,
        applId: selectedApplication.NUM_EMPCTPTWORK_ID,
        ulbId: 4,
        mode: 2,
        status: "R",
        remark: supervisorRemark,
        inspectionImg1,
        inspectionImg2,
        inspectionImg3,
        userType: "SI",
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
        fetchApplications(currentPage);
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

  // Render image thumbnails
  const renderImageGallery = (images) => {
    const openImageInNewTab = (img) => {
      try {
        const binaryString = atob(img);
        const bytes = new Uint8Array(binaryString.length);
        for (let i = 0; i < binaryString.length; i++) {
          bytes[i] = binaryString.charCodeAt(i);
        }
        const blob = new Blob([bytes], { type: "image/jpeg" });
        const blobUrl = URL.createObjectURL(blob);
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
    } else if (flag === "C") {
      return (
        <span className="badge bg-primary rounded-pill px-3 py-2">
          <i className="bi bi-check-circle me-1"></i> Completed
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

  const getSIBadge = (flag) => {
    if (flag === "A") {
      return (
        <span className="badge bg-success-subtle text-success rounded-pill px-3 py-2">
          <i className="bi bi-check-circle me-1"></i> Approve
        </span>
      );
    } else if (flag === "R") {
      return (
        <span className="badge bg-danger-subtle text-danger rounded-pill px-3 py-2">
          <i className="bi bi-x-circle me-1"></i> Rejected
        </span>
      );
    } else {
      // Handles null, undefined, "P", or any other value
      return (
        <span className="badge bg-warning-subtle text-warning rounded-pill px-3 py-2">
          <i className="bi bi-clock-history me-1"></i> Pending
        </span>
      );
    }
  };

  // Filter handlers
  const handleDateChangeFilter = (e) => {
    const { name, value } = e.target;
    setDateFilter((prev) => ({ ...prev, [name]: value }));
  };

  const handleStatusChange = (e) => {
    setStatusFilter(e.target.value);
  };

  const handleClearFilters = () => {
    setDateFilter({ from: "", to: "" });
    setStatusFilter("all");
  };

  const handleReviewImageChange = (e) => {
    const files = Array.from(e.target.files);
    // Allow only up to 3 total images
    if (files.length + reviewImages.length > 3) {
      setModalType("warning");
      setModalTitle("Warning");
      setModalMessage("You can upload a maximum of 3 images.");
      setIsModalOpen(true);
      e.target.value = ""; // reset input
      return;
    }

    setReviewImages((prev) => [...prev, ...files]);
    const newPreviews = files.map((file) => URL.createObjectURL(file));
    setReviewPreviewUrls((prev) => [...prev, ...newPreviews]);
    e.target.value = ""; // reset input to allow re-selection
  };

  // ----- Remove an image by index -----
  const removeReviewImage = (index) => {
    setReviewImages((prev) => prev.filter((_, i) => i !== index));
    // Revoke the object URL to avoid memory leaks
    URL.revokeObjectURL(reviewPreviewUrls[index]);
    setReviewPreviewUrls((prev) => prev.filter((_, i) => i !== index));
  };

  // ----- Cleanup preview URLs on unmount -----
  useEffect(() => {
    return () => {
      reviewPreviewUrls.forEach((url) => URL.revokeObjectURL(url));
    };
  }, [reviewPreviewUrls]);

  return (
    <Layout>
      <div className="panel">
        <div className="panel-header d-flex justify-content-between">
          <div>
            <h2 className="h5 mb-1 section-title">
              <i className="bi bi-file-earmark-text" aria-hidden="true"></i>
              <span>All Applications ({applications.length})</span>
            </h2>
            <p className="text-muted mb-0">
              View application details, images, and location.
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
                  <option value="all">All</option>
                  <option value="A">Approve</option>
                  <option value="R">Reject</option>
                  <option value="C">Pending</option>
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
                <th scope="col">ID</th>
                <th scope="col">Ward</th>
                <th scope="col">Toilet Location</th>
                <th scope="col">INCHARGE NAME</th>
                {/* <th scope="col">Employee</th> */}
                <th scope="col">Status</th>
                <th scope="col">SI Status</th>
                {/* <th scope="col">Remark</th> */}
                <th scope="col">Date</th>
                <th scope="col" className="text-end">
                  Action
                </th>
              </tr>
            </thead>
            <tbody>
              {applications.map((app, idx) => (
                <tr key={app.NUM_EMPCTPTWORK_ID || idx}>
                  <td>{app.NUM_EMPCTPTWORK_ID}</td>
                  <td className="fw-semibold">
                    Ward {app.NUM_CTPTTYPE_WARDID}
                  </td>
                  <td>{app.VAR_CTPTTYPE_TOILETLOCATION}</td>
                  <td>{app.VAR_CTPTTYPE_USERNAME}</td>
                  {/* <td>{app.USERNAME}</td> */}
                  <td>{getBadge(app.VAR_EMPCTPTWORK_STATUS)}</td>
                  <td>{getSIBadge(app.VAR_EMPCTPTWORK_SIFLAG)}</td>
                  {/* <td style={{ maxWidth: "250px" }}>
                    <small>{app.VAR_EMPCTPTWORK_REMARK}</small>
                  </td> */}
                  <td>{formatDate(app.DAT_EMPCTPTWORK_DATE)}</td>
                  <td className="text-end">
                    <button
                      className={`btn btn-sm ${
                        app.VAR_EMPCTPTWORK_STATUS === "R" ||
                        app.VAR_EMPCTPTWORK_STATUS === "A"
                          ? "btn-outline-secondary"
                          : "btn-outline-primary"
                      }`}
                      onClick={() => handleReviewClick(app)}
                      disabled={
                        app.VAR_EMPCTPTWORK_STATUS === "R" ||
                        app.VAR_EMPCTPTWORK_STATUS === "A"
                      }
                      title={
                        app.VAR_EMPCTPTWORK_STATUS === "A"
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

      {/* Review Application Modal */}
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
                  Review Application #{selectedApplication.NUM_EMPCTPTWORK_ID}
                </h5>
                <button
                  type="button"
                  className="btn-close"
                  onClick={() => setShowModal(false)}
                ></button>
              </div>
              <div className="modal-body">
                <div className="row g-3">
                  {/* Left Column */}
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
                              Submission Date
                            </label>
                            <p className="h6 mb-0">
                              {formatDate(
                                selectedApplication.DAT_EMPCTPTWORK_DATE,
                              )}
                            </p>
                          </div>
                          <div className="col-md-12">
                            <label className="form-label fw-semibold text-muted">
                              Vendor Remark
                            </label>
                            <p className="h6 mb-0">
                              {selectedApplication.VAR_EMPCTPTWORK_REMARK}
                            </p>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Supervisor Action */}
                    <div className="card mb-3">
                      <div className="card-header">
                        <h6 className="mb-0">Supervisor Action</h6>
                      </div>
                      <div className="card-body">
                        <label className="form-label fw-semibold">Remark</label>
                        <small className="text-muted mt-2 d-block">
                          {selectedApplication.VAR_EMPCTPTWORK_SUPREMARK}
                        </small>
                      </div>
                    </div>

                    {getInspectionImages().length > 0 ? (
                      <div className="card mb-3">
                        <div className="card-header">
                          <h6 className="mb-0">Inspection Images</h6>
                        </div>
                        <div
                          className="card-body"
                          style={{ maxHeight: "300px", overflowY: "auto" }}
                        >
                          {getInspectionImages().map((stage, idx) => (
                            <div key={idx} className="mb-4">
                              <div className="mb-3">
                                <i className="bi bi-images me-2"></i>
                                <strong>{stage.stageName}</strong>
                              </div>
                              {renderImageGallery(stage.images)}
                            </div>
                          ))}
                        </div>
                      </div>
                    ) : (
                      ""
                    )}

                    {/* Sanitary Inspector Action */}
                    <div className="card">
                      <div className="card-header">
                        <h6 className="mb-0">Sanitary Inspector Action</h6>
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

                        {/* Image upload */}
                        <div className="mt-3">
                          <div className="d-flex justify-content-between align-items-center mb-2">
                            <label className="form-label fw-semibold mb-0 small">
                              <i className="bi bi-images me-1 text-primary"></i>{" "}
                              Upload Inspection Images
                            </label>
                            <span
                              className={`badge rounded-pill px-2 py-1 small ${
                                reviewImages.length >= 3
                                  ? "bg-danger"
                                  : "bg-secondary"
                              }`}
                            >
                              {reviewImages.length} / 3
                            </span>
                          </div>

                          <div
                            className="border rounded-3 p-2"
                            style={{
                              borderStyle: "dashed",
                              borderColor:
                                reviewImages.length >= 3
                                  ? "#dc3545"
                                  : "#ced4da",
                              backgroundColor: "#f8f9fa",
                            }}
                          >
                            <div className="d-flex align-items-center gap-2">
                              <i
                                className="bi bi-cloud-arrow-up flex-shrink-0"
                                style={{ fontSize: "1.8rem", color: "#0d6efd" }}
                              ></i>

                              <div className="flex-grow-1 min-w-0">
                                <p className="mb-0 fw-semibold small">
                                  {reviewImages.length >= 3
                                    ? "Maximum images reached"
                                    : "Drop images here or click to browse"}
                                </p>
                                <p
                                  className="text-muted mb-0"
                                  style={{ fontSize: "11px" }}
                                >
                                  JPG, PNG · max 3 images
                                </p>
                              </div>

                              <label
                                className={`btn btn-sm flex-shrink-0 ${
                                  reviewImages.length >= 3
                                    ? "btn-secondary"
                                    : "btn-outline-primary"
                                }`}
                                style={{
                                  cursor:
                                    reviewImages.length >= 3
                                      ? "not-allowed"
                                      : "pointer",
                                  fontSize: "12px",
                                }}
                              >
                                <i className="bi bi-folder2-open me-1"></i>{" "}
                                Browse
                                <input
                                  type="file"
                                  accept="image/*"
                                  multiple
                                  onChange={handleReviewImageChange}
                                  disabled={reviewImages.length >= 3}
                                  style={{ display: "none" }}
                                />
                              </label>
                            </div>

                            {reviewPreviewUrls.length > 0 ? (
                              <div className="d-flex flex-wrap gap-2 mt-2 pt-2 border-top">
                                {reviewPreviewUrls.map((url, idx) => (
                                  <div
                                    key={idx}
                                    className="position-relative flex-shrink-0"
                                    style={{ width: "60px", height: "60px" }}
                                  >
                                    <img
                                      src={url}
                                      alt={`review-${idx}`}
                                      className="w-100 h-100 rounded-2 border"
                                      style={{ objectFit: "cover" }}
                                    />
                                    <button
                                      type="button"
                                      className="btn-close position-absolute"
                                      onClick={() => removeReviewImage(idx)}
                                      aria-label="Remove image"
                                      style={{
                                        top: "-5px",
                                        right: "-5px",
                                        width: "16px",
                                        height: "16px",
                                        fontSize: "8px",
                                        backgroundColor: "white",
                                        borderRadius: "50%",
                                        padding: "3px",
                                        boxShadow: "0 1px 4px rgba(0,0,0,0.2)",
                                        border: "1px solid #dee2e6",
                                      }}
                                    />
                                  </div>
                                ))}
                              </div>
                            ) : (
                              <p
                                className="text-muted text-center mb-0 mt-1"
                                style={{ fontSize: "11px" }}
                              >
                                <i className="bi bi-info-circle me-1"></i> No
                                images selected yet
                              </p>
                            )}
                          </div>
                        </div>
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
                            src={`https://www.google.com/maps/embed/v1/place?key=AIzaSyAMu4Ig2LTmXqP2uIRuDWvj2eqaCpYXNao&q=${selectedApplication.VAR_EMPCTPTWORK_LATITUDE},${selectedApplication.VAR_EMPCTPTWORK_LONGITUDE}`}
                            title="Location Map"
                          ></iframe>
                        </div>
                        <div className="mt-2 small text-muted">
                          <p className="mb-1">
                            <strong>Latitude:</strong>{" "}
                            {selectedApplication.VAR_EMPCTPTWORK_LATITUDE}
                          </p>
                          <p className="mb-0">
                            <strong>Longitude:</strong>{" "}
                            {selectedApplication.VAR_EMPCTPTWORK_LONGITUDE}
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
                  disabled={selectedApplication.VAR_EMPCTPTWORK_SUPFLAG !== "A"}
                >
                  <i className="bi bi-x-circle me-1"></i> Reject
                </button>
                <button
                  type="button"
                  className="btn btn-success"
                  onClick={handleApprove}
                  disabled={selectedApplication.VAR_EMPCTPTWORK_SUPFLAG !== "A"}
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

export default ApplicationListSI;
