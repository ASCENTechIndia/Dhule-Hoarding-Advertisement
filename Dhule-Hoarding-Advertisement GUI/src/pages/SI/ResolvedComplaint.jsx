import Layout from "../../components/Layout";
import { useState, useEffect, useCallback } from "react";
import apiClient from "../../services/apiClient";
import ResponseModal from "../../components/ResponseModal";
import { useAuth } from "../../context/AuthContext";
import { useLoader } from "../../context/LoaderContext";

const getToday = () => {
  const d = new Date();
  return d.toISOString().split("T")[0];
};

const ResolvedComplaint = () => {
  const { user } = useAuth();
  const ulbid = user?.orgId;
  const [complaints, setComplaints] = useState([]);
  const [loading, setLoading] = useState(true);
  const { setLoader } = useLoader();

  const [showModal, setShowModal] = useState(false);
  const [selectedComplaint, setSelectedComplaint] = useState(null);
  const [showImageModal, setShowImageModal] = useState(false);
  const [selectedImageIndex, setSelectedImageIndex] = useState(0);
  const [siRemark, setSiRemark] = useState("");
  const [sanitaryinspectorstatus, setSanitaryinspectorstatus] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Response Modal states
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalType, setModalType] = useState("info");
  const [modalTitle, setModalTitle] = useState("");
  const [modalMessage, setModalMessage] = useState("");
  const [reworkImages, setReworkImages] = useState([]);
  const [inspectionImages, setInspectionImages] = useState([]);

  // ----- NEW: Image upload states for review -----
  const [reviewImages, setReviewImages] = useState([]);
  const [reviewPreviewUrls, setReviewPreviewUrls] = useState([]);

  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalRecords, setTotalRecords] = useState(0);
  const pageSize = 5;

  const [filters, setFilters] = useState({
    fromDate: getToday(),
    toDate: getToday(),
    status: "",
  });

  const handleDateChangeFilter = (e) => {
    const { name, value } = e.target;
    setFilters((prev) => ({ ...prev, [name]: value }));
  };

  // Fetch complaints on filter change
  const fetchComplaints = useCallback(
    async (dataPage = 1) => {
      if (!ulbid) {
        return;
      }
      try {
        setLoader(true);
        const response = await apiClient.get(
          `/authComplaint/rslvdListApprovedbySup?ulbid=${ulbid}&page=${dataPage}&limit=${pageSize}&fromDate=${filters.fromDate}&toDate=${filters.toDate}&status=${filters.status}`,
        );
        if (response.success && response.data.data) {
          setComplaints(response.data.data);
          setCurrentPage(response?.data?.pagination?.page || dataPage);
          setTotalPages(response?.data?.pagination?.totalPages || 1);
          setTotalRecords(response?.data?.pagination?.total || 0);
        }
      } catch (err) {
        console.error(err);
      } finally {
        setLoader(false);
      }
    },
    [ulbid, pageSize, filters],
  );

  useEffect(() => {
    fetchComplaints(1);
  }, [fetchComplaints]);

  const handleStatusChange = (e) => {
    setFilters((prev) => ({ ...prev, status: e.target.value }));
  };

  const handleClearFilters = () => {
    const clearedFilters = {
      fromDate: "",
      toDate: "",
      status: "",
    };
    setFilters(clearedFilters);
  };

const sortAndFormatByDate = (arr) => {
  const validItems = arr.filter(
    (item) =>
      item && typeof item.date === "string" && item.date.trim() !== ""
  );

  const sorted = [...validItems].sort((a, b) => b.date.localeCompare(a.date));

  return sorted.map((item) => {
    const dateObj = new Date(item.date);

   const formatted = dateObj
  .toLocaleString("en-GB", {
    timeZone: "Asia/Kolkata",
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hour12: true,
  })
  .replace(/\//g, "-")
  .replace(",", "")
  .replace(" ", " - ")
  .toUpperCase();

    return {
      ...item,
      date: formatted,
    };
  });
};

  const getReworkImages = async (complaintId) => {
    try {
      setLoader(true);
      const result = await Promise.allSettled([
        apiClient.get(
          `/authComplaint/getReworkImages?complaintid=${complaintId}`,
        ),
        apiClient.get(
          `/authComplaint/getComplaintInspectionImages?ulbid=${ulbid}&applid=${complaintId}`,
        ),
      ]);

      // Rework Images
      if (result[0].status === "fulfilled") {
        const res = result[0].value;
        if (res?.success && res?.data?.length > 0) {
          const data = res.data.map((item) => ({
            date: item.IMAGE_DATE,
            imgArr: [item.IMAGE1, item.IMAGE2, item.IMAGE3],
          }));
          const formatedData = sortAndFormatByDate(data);
          setReworkImages(formatedData);
        } else {
          setReworkImages([]);
        }
      }

      // Inspection Images
      if (result[1].status === "fulfilled") {
        const res = result[1].value;
        if (res?.success && res?.data?.length > 0) {
          setInspectionImages(res?.data);
        } else {
          setInspectionImages([]);
        }
      }
    } catch (error) {
      console.error(error);
      setInspectionImages([]);
      setReworkImages([]);
    } finally {
      setLoader(false);
    }
  };

  const handleReviewClick = async (complaint) => {
    // fetching rework images
    await getReworkImages(complaint.COMPLAINTID);

    setSelectedComplaint(complaint);
    setSelectedImageIndex(0);
    setSiRemark("");
    setSanitaryinspectorstatus("");
    setShowModal(true);
  };

  // Open image in full view
  const handleImageClick = (index) => {
    setSelectedImageIndex(index);
    setShowImageModal(true);
  };

  // Handle page change
  const handlePageChange = (page) => {
    if (page >= 1 && page <= totalPages) {
      fetchComplaints(page);
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

  // Helper function to extract images from complaint
  const getComplaintImages = (complaint) => {
    return [
      complaint?.BLOB_COMPLAINT_UNITIMG1,
      complaint?.BLOB_COMPLAINT_UNITIMG2,
      complaint?.BLOB_COMPLAINT_UNITIMG3,
      complaint?.BLOB_COMPLAINT_UNITIMG4,
      complaint?.BLOB_COMPLAINT_UNITIMG5,
    ].filter((img) => img && img.trim() !== "");
  };

  // Navigate to next image
  const nextImage = () => {
    if (selectedComplaint) {
      const images = getComplaintImages(selectedComplaint);
      if (selectedImageIndex < images.length - 1) {
        setSelectedImageIndex(selectedImageIndex + 1);
      }
    }
  };

  // Navigate to previous image
  const prevImage = () => {
    if (selectedImageIndex > 0) {
      setSelectedImageIndex(selectedImageIndex - 1);
    }
  };

   const fileToBase64 = (file) => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = () => {
        const result = reader.result.split(",")[1]; // Extract base64 part
        resolve(result);
      };
      reader.onerror = (error) => reject(error);
    });
  };

  // Handle SI remark and status submission
  const handleSubmitSIRemark = async () => {
    if (!siRemark.trim() || !sanitaryinspectorstatus) {
      setModalType("warning");
      setModalTitle("Validation Error");
      setModalMessage(
        "Please fill in both Sanitary Inspector Remark and Status",
      );
      setIsModalOpen(true);
      return;
    }

    if (reviewImages?.length <= 0 && sanitaryinspectorstatus === "REJECT") {
      setModalType("Warning");
      setModalTitle("Warning");
      setModalMessage("Please select atleast one inspection image");
      setIsModalOpen(true);
      return;
    }

    try {
      setIsSubmitting(true);
      // Convert review images to Base64
      const reviewBase64Images = await Promise.all(
        reviewImages.map((file) => fileToBase64(file)),
      );
      const inspectionimg1 = reviewBase64Images[0] || null;
      const inspectionimg2 = reviewBase64Images[1] || null;
      const inspectionimg3 = reviewBase64Images[2] || null;

      const response = await apiClient.post(
        "/authComplaint/complaintStatusUpdate",
        {
          userId: user?.userId,
          mode: 2,
          complaintId: selectedComplaint?.COMPLAINTID,
          SIID: user?.userId,
          si_status: sanitaryinspectorstatus,
          si_remrk: siRemark,
          wardno: selectedComplaint?.PRBHAGID,
          superwiserId: selectedComplaint?.SUPERWISER_ID,
          superstatus: selectedComplaint?.SUPERSTATUS,
          superremark: selectedComplaint?.VAR_COMPAINT_SUPERREMARK,
          ulbId: ulbid,
          inspectionimg1,
          inspectionimg2,
          inspectionimg3,
          usertype: "SI",
        },
      );

      if (response.success) {
        setModalType("success");
        setModalTitle("Success");
        setModalMessage(response.data.message);
        setIsModalOpen(true);

        // Close modal and reset form after a delay
        setTimeout(() => {
          setShowModal(false);
          setSiRemark("");
          setSanitaryinspectorstatus("");
          fetchComplaints(currentPage);
        }, 1500);
      } else {
        setModalType("error");
        setModalTitle("Error");
        setModalMessage(
          response.message || "Failed to update complaint status",
        );
        setIsModalOpen(true);
      }
    } catch (err) {
      console.error("Error updating complaint status:", err);
      setModalType("error");
      setModalTitle("Error");
      setModalMessage(
        err.message || "Failed to update complaint status. Please try again.",
      );
      setIsModalOpen(true);
    } finally {
      setIsSubmitting(false);
    }
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

  const renderThumbnails = (complaint) => {
    const images = [
      complaint?.SOLVCOMPIMG1 || "",
      complaint?.SOLVCOMPIMG2 || "",
      complaint?.SOLVCOMPIMG3 || "",
    ];

    return (
      <div className="d-flex gap-2 flex-wrap mt-2">
        {images.length > 0 ? (
          images.map((img, idx) => (
            <>
              {img && (
                <img
                  key={idx}
                  src={`data:image/png;base64,${img}`}
                  style={{
                    width: "80px",
                    height: "80px",
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
              )}
            </>
          ))
        ) : (
          <p className="text-muted mb-0">No images available</p>
        )}
      </div>
    );
  };

  const getInspectionImages = () => {
  const stagesMap = new Map();

  if (inspectionImages && inspectionImages.length > 0) {
    inspectionImages.forEach((entry) => {
      const dateObj = new Date(entry.DAT_CTPTCMPLTINSPECTN_INSDATE);

      const formatted = dateObj
        .toLocaleString("en-GB", {
          timeZone: "Asia/Kolkata",
          day: "2-digit",
          month: "2-digit",
          year: "numeric",
          hour: "2-digit",
          minute: "2-digit",
          second: "2-digit",
          hour12: true,
        })
        .replace(/\//g, "-")
        .replace(",", " - ")
        .toUpperCase();

      const stageName = `${entry.VAR_CTPTCMPLTINSPECTN_USERTYPE} (${formatted})`;

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

  const getBadge = (flag) => {
    switch (flag) {
      case "P":
        return (
          <span className="badge bg-warning rounded-pill px-3 py-2 text-dark">
            <i className="bi bi-clock-history me-1"></i> PENDING
          </span>
        );
      case "ASSIGN":
        return (
          <span className="badge bg-primary rounded-pill px-3 py-2">
            <i className="bi bi-person-check me-1"></i> ASSIGN
          </span>
        );
      case "COMPLETED":
        return (
          <span className="badge bg-success rounded-pill px-3 py-2">
            <i className="bi bi-check-circle me-1"></i> COMPLETED
          </span>
        );
      case "REJECTED":
        return (
          <span className="badge bg-danger rounded-pill px-3 py-2">
            <i className="bi bi-x-circle me-1"></i> REJECTED
          </span>
        );
      case "CLOSED":
        return (
          <span className="badge bg-secondary rounded-pill px-3 py-2">
            <i className="bi bi-archive me-1"></i> CLOSED
          </span>
        );
      default:
        return (
          <span className="badge bg-light text-dark rounded-pill px-3 py-2">
            <i className="bi bi-question-circle me-1"></i> {flag || "UNKNOWN"}
          </span>
        );
    }
  };

  const renderImageGallery = (images) => {
    return (
      <div className="d-flex gap-2 flex-wrap">
        {images.length > 0 ? (
          images.map((img, idx) => (
            <div key={idx} style={{ position: "relative" }}>
              {img && (
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
              )}
            </div>
          ))
        ) : (
          <p className="text-muted mb-0">No images available</p>
        )}
      </div>
    );
  };

  const getAppRej = (flag) => {
    switch (flag) {
      case "APPROVE":
        return (
          <span className="badge rounded-pill px-3 py-2 bg-success-subtle text-success">
            <i className="bi bi-check-circle me-1"></i> APPROVE
          </span>
        );
      case "REJECT":
        return (
          <span className="badge rounded-pill px-3 py-2 bg-danger-subtle text-danger">
            <i className="bi bi-x-circle me-1"></i> REJECT
          </span>
        );
      default:
        return (
          <span
            className="badge rounded-pill px-3 py-2"
            style={{ background: "#fee3b1", color: "#ff930f" }}
          >
            <i className="bi bi-clock-history me-1"></i> PENDING
          </span>
        );
    }
  };

  const handleReviewImageChange = (e) => {
    const files = Array.from(e.target.files);
    if (files.length + reviewImages.length > 3) {
      setModalType("warning");
      setModalTitle("Warning");
      setModalMessage("You can upload maximum of 3 images.");
      setIsModalOpen(true);
      e.target.value = ""; // reset input
      return;
    }

    setReviewImages((prev) => [...prev, ...files]);
    const newPreviews = files.map((file) => URL.createObjectURL(file));
    setReviewPreviewUrls((prev) => [...prev, ...newPreviews]);
    e.target.value = "";
  };

  const removeReviewImage = (index) => {
    setReviewImages((prev) => prev.filter((_, i) => i !== index));
    URL.revokeObjectURL(reviewPreviewUrls[index]);
    setReviewPreviewUrls((prev) => prev.filter((_, i) => i !== index));
  };

  return (
    <Layout>
      <div className="panel">
        <div className="panel-header d-flex justify-content-between">
          <div>
            <h2 className="h5 mb-1 section-title">
              <i className="bi bi-table" aria-hidden="true"></i>
              <span>Resolved Complaint ({complaints?.length})</span>
            </h2>
            <p className="text-muted mb-0">
              View and manage complaints submitted by citizens.
            </p>
          </div>
          <div>
            <div className="filter-bar">
              <div className="filter-group">
                <label htmlFor="fromDate">From Date</label>
                <input
                  type="date"
                  id="fromDate"
                  name="fromDate"
                  className="filter-input"
                  style={{ width: "150px" }}
                  value={filters.fromDate}
                  onChange={handleDateChangeFilter}
                />
              </div>

              <div className="filter-group">
                <label htmlFor="toDate">To Date</label>
                <input
                  type="date"
                  id="toDate"
                  name="toDate"
                  className="filter-input"
                  style={{ width: "150px" }}
                  value={filters.toDate}
                  onChange={handleDateChangeFilter}
                />
              </div>

              <div className="filter-group">
                <label htmlFor="status">Status</label>
                <select
                  id="status"
                  className="filter-select"
                  style={{ width: "120px" }}
                  value={filters.status}
                  onChange={handleStatusChange}
                >
                  <option value="">All</option>
                  <option value="COMPLETED">Pending</option>
                  <option value="CLOSED">Closed</option>
                  <option value="REJECTED">Rejected</option>
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
                <th scope="col">Name</th>
                <th scope="col">Ward</th>
                <th scope="col">INCHARGE NAME</th>
                <th scope="col">Phone</th>
                <th scope="col">Status</th>
                <th scope="col">SI Status</th>
                <th scope="col">Date</th>
                <th scope="col" className="text-end">
                  Action
                </th>
              </tr>
            </thead>
            <tbody>
              {complaints.map((complaint) => (
                <tr key={complaint.COMPLAINTID}>
                  <td>{complaint.COMPLAINTID}</td>
                  <td>{complaint.VAR_COMPLAINT_CITIZNAME}</td>
                  <td>{complaint.PRBHAG}</td>
                  <td>{complaint.SUPERWISER}</td>
                  <td>{complaint.MOBILENO}</td>
                  <td>{getBadge(complaint.VAR_COMPLAINT_STATUS)}</td>
                  <td>{getAppRej(complaint.SISTATUS)}</td>
                  <td>{formatDate(complaint.COMPLAINT_DATE)}</td>
                  <td className="text-end">
                    <button
                      onClick={() => handleReviewClick(complaint)}
                      className={`btn btn-sm ${
                        complaint.SUPERSTATUS === "REJECT" ||
                        complaint.SISTATUS === "APPROVE" ||
                        complaint.SISTATUS === "REJECT"
                          ? "btn-outline-secondary"
                          : "btn-outline-primary"
                      }`}
                      disabled={
                        complaint.SUPERSTATUS === "REJECT" ||
                        complaint.SISTATUS === "APPROVE" ||
                        complaint.SISTATUS === "REJECT"
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

      {/* Review Complaint Modal */}
      {showModal && selectedComplaint && (
        <div
          className="modal show d-block"
          tabIndex="-1"
          role="dialog"
          style={{ backgroundColor: "rgba(0,0,0,0.5)" }}
        >
          <div className="modal-dialog modal-lg modal-dialog-centered">
            <div className="modal-content">
              <div className="modal-header">
                <h5 className="modal-title">Review Complaint</h5>
                <button
                  type="button"
                  className="btn-close"
                  onClick={() => setShowModal(false)}
                ></button>
              </div>
              <div className="modal-body">
                {/* Read-only Details Section */}
                <div className="row g-3 mb-4">
                  <div className="col-md-6">
                    <label className="form-label fw-semibold text-muted">
                      Name
                    </label>
                    <p className="h6 mb-0">
                      {selectedComplaint.VAR_COMPLAINT_CITIZNAME}
                    </p>
                  </div>
                  <div className="col-md-6">
                    <label className="form-label fw-semibold text-muted">
                      Ward
                    </label>
                    <p className="h6 mb-0">{selectedComplaint.PRBHAG}</p>
                  </div>
                  <div className="col-md-6">
                    <label className="form-label fw-semibold text-muted">
                      Toilet Name
                    </label>
                    <p className="h6 mb-0">
                      {selectedComplaint.LOCATION}
                    </p>
                  </div>
                  <div className="col-md-6">
                    <label className="form-label fw-semibold text-muted">
                      Complaint Type
                    </label>
                    <p className="h6 mb-0">{selectedComplaint.COMPLTYPE_NAME}</p>
                  </div>
                  <div className="col-md-6">
                    <label className="form-label fw-semibold text-muted">
                      Phone
                    </label>
                    <p className="h6 mb-0">{selectedComplaint.MOBILENO}</p>
                  </div>
                  <div className="col-md-12">
                    <label className="form-label fw-semibold text-muted">
                      Citizen's Remark
                    </label>
                    <p className="h6 mb-0">
                      {selectedComplaint.VAR_COMPLAINT_REMARK}
                    </p>
                  </div>

                  <div className="col-md-12">
                    <label className="form-label fw-semibold text-muted">
                      Supervisor's Remark
                    </label>
                    <p className="h6 mb-0">
                      {selectedComplaint.VAR_COMPAINT_SUPERREMARK}
                    </p>
                  </div>
                </div>

                {/* Complaint Images Section */}
                <div className="mt-4 pt-3 border-top">
                  <label className="form-label fw-semibold">
                    <i className="bi bi-images me-2"></i>Resolved Complaint
                    Images
                  </label>
                  <div className="card">
                    <div
                      className="card-body"
                      style={{ maxHeight: "300px", overflowY: "auto" }}
                    >
                      {reworkImages.length > 0 ? (
                        reworkImages.map((item, i) => (
                          <div key={i} className="mb-2">
                            <div className="">
                              <strong className="mb-1">{item.date}</strong>
                            </div>
                            {renderImageGallery(item.imgArr)}
                          </div>
                        ))
                      ) : (
                        <p className="text-muted">No images available</p>
                      )}
                    </div>
                  </div>
                </div>

                {getInspectionImages().length > 0 ? (
                  <div className="card my-3 border border-0">
                    <div className="d-flex ">
                      <i className="bi bi-images me-2"></i>
                      <h6 className="mb-0">Inspection Images</h6>
                    </div>
                    <div
                      className="card-body p-0 mt-2"
                      style={{ maxHeight: "300px", overflowY: "auto" }}
                    >
                      {getInspectionImages().map((stage, idx) => (
                        <div
                          key={idx}
                          className="mb-4 border border-2 p-3"
                          style={{ borderRadius: "5px" }}
                        >
                          <div className="mb-3">
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

                <div className="mt-4 pt-3 border-top">
                  <label className="form-label fw-semibold">
                    Sanitary Inspector Remark{" "}
                    <span className="text-danger">*</span>
                  </label>
                  <textarea
                    className="form-control"
                    rows="3"
                    placeholder="Add your remarks about this complaint..."
                    value={siRemark}
                    onChange={(e) => setSiRemark(e.target.value)}
                  ></textarea>
                  <small className="text-muted mt-2 d-block">
                    Remark is required to submit this complaint.
                  </small>
                </div>

                {/* Image upload */}
                <div className="mt-3">
                  <div className="d-flex justify-content-between align-items-center mb-2">
                    <label className="form-label fw-semibold mb-0 small">
                      <i className="bi bi-images me-1 text-primary"></i> Upload
                      Inspection Images
                    </label>
                    <span
                      className={`badge rounded-pill px-2 py-1 small ${
                        reviewImages.length >= 3 ? "bg-danger" : "bg-secondary"
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
                        reviewImages.length >= 3 ? "#dc3545" : "#ced4da",
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
                        <i className="bi bi-folder2-open me-1"></i> Browse
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
                        <i className="bi bi-info-circle me-1"></i> No images
                        selected yet
                      </p>
                    )}
                  </div>
                </div>

                <div className="mt-4 pt-3 border-top">
                  <label className="form-label fw-semibold">
                    Status <span className="text-danger">*</span>
                  </label>
                  <select
                    className="form-select"
                    value={sanitaryinspectorstatus}
                    onChange={(e) => {
                      setSanitaryinspectorstatus(e.target.value);
                    }}
                  >
                    <option value="">--Select Status--</option>
                    <option value="APPROVE">Approve</option>
                    <option value="REJECT">Reject</option>
                  </select>
                  <small className="text-muted mt-2 d-block">
                    Status is required to submit this complaint.
                  </small>
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
                  className="btn btn-primary"
                  onClick={handleSubmitSIRemark}
                  disabled={
                  isSubmitting || selectedComplaint.SUPERSTATUS ===  null
                  }
                >
                  {isSubmitting ? (
                    <>
                      <span
                        className="spinner-border spinner-border-sm me-2"
                        role="status"
                        aria-hidden="true"
                      ></span>
                      Submitting...
                    </>
                  ) : (
                    <>
                      <i className="bi bi-check-circle me-1"></i> Submit
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Full-View Image Modal */}
      {showImageModal &&
        selectedComplaint &&
        (() => {
          const images = getComplaintImages(selectedComplaint);
          return images.length > 0 ? (
            <div
              className="modal show d-block"
              tabIndex="-1"
              role="dialog"
              style={{
                backgroundColor: "rgba(0,0,0,0.8)",
                zIndex: 2000,
              }}
            >
              <div
                className="modal-dialog"
                style={{
                  maxWidth: "90vw",
                  height: "90vh",
                  display: "flex",
                  alignItems: "center",
                }}
              >
                <div
                  className="modal-content bg-dark"
                  style={{ border: "none" }}
                >
                  <div className="modal-header bg-dark border-secondary">
                    <h5 className="modal-title text-white">
                      Image {selectedImageIndex + 1} of {images.length}
                    </h5>
                    <button
                      type="button"
                      className="btn-close btn-close-white"
                      onClick={() => setShowImageModal(false)}
                    ></button>
                  </div>
                  <div className="modal-body p-0 d-flex align-items-center justify-content-center">
                    <div
                      style={{
                        position: "relative",
                        maxWidth: "100%",
                        maxHeight: "70vh",
                      }}
                    >
                      <img
                        src={`data:image/png;base64,${images[selectedImageIndex]}`}
                        alt={`complaint-full-${selectedImageIndex}`}
                        style={{
                          maxWidth: "100%",
                          maxHeight: "70vh",
                          objectFit: "contain",
                        }}
                      />
                    </div>
                  </div>
                  <div className="modal-footer bg-dark border-secondary justify-content-between">
                    <button
                      type="button"
                      className="btn btn-outline-light"
                      onClick={prevImage}
                      disabled={selectedImageIndex === 0}
                    >
                      <i className="bi bi-chevron-left me-1"></i> Previous
                    </button>
                    <button
                      type="button"
                      className="btn btn-outline-light"
                      onClick={nextImage}
                      disabled={selectedImageIndex === images.length - 1}
                    >
                      Next <i className="bi bi-chevron-right ms-1"></i>
                    </button>
                  </div>
                </div>
              </div>
            </div>
          ) : null;
        })()}

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

export default ResolvedComplaint;
