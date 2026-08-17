import Layout from "../../components/Layout";
import { useEffect, useState } from "react";
import apiClient from "../../services/apiClient";
import { useLoader } from "../../context/LoaderContext";
import ResponseModal from "../../components/ResponseModal";
import { generatePDF } from "../../utils/pdfHelper.jsx";

const getToday = () => {
  const d = new Date();

  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");

  return `${year}-${month}-${day}`;
};

const PanchanamaList = () => {
  const { setLoader } = useLoader();

  // =========================================================
  // STATE
  // =========================================================

  const [participants, setParticipants] = useState([]);
  const [error, setError] = useState(null);

  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalRecords, setTotalRecords] = useState(0);
  const [pageSize, setPageSize] = useState(10);

  // Filters
  const [filters, setFilters] = useState({
    fromDate: getToday(),
    toDate: getToday(),
  });

  // Image modal
  const [showImageModal, setShowImageModal] = useState(false);
  const [selectedImages, setSelectedImages] = useState([]);
  const [selectedImageIndex, setSelectedImageIndex] = useState(0);

  // =========================================================
  // DETAILS MODAL
  // =========================================================

  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [selectedParticipant, setSelectedParticipant] = useState(null);
  const [selectedPanchanamaDetails, setSelectedPanchanamaDetails] =
    useState(null);
  const [detailsLoading, setDetailsLoading] = useState(false);
  // Response modal
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalType, setModalType] = useState("info");
  const [modalTitle, setModalTitle] = useState("");
  const [modalMessage, setModalMessage] = useState("");

  // =========================================================
  // DATE FILTER CHANGE
  // =========================================================

  const handleDateChangeFilter = (e) => {
    const { name, value } = e.target;

    setFilters((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  // =========================================================
  // CLEAR FILTERS
  // =========================================================

  const handleClearFilters = () => {
    setFilters({
      fromDate: "",
      toDate: "",
    });
  };

  // =========================================================
  // FETCH PARTICIPANTS
  // =========================================================

  const fetchPanchanamalist = async (dataPage = 1) => {
    try {
      setLoader(true);
      setError(null);

      let url = `/advertisement/getPanchanamalist?page=${dataPage}&limit=${pageSize}`;

      if (filters.fromDate) {
        url += `&fromDate=${encodeURIComponent(filters.fromDate)}`;
      }

      if (filters.toDate) {
        url += `&toDate=${encodeURIComponent(filters.toDate)}`;
      }

      const response = await apiClient.get(url);

      if (response?.success && response?.data) {
        const participantData = response.data.data || [];
        const pagination = response.data.pagination || {};

        setParticipants(participantData);

        setCurrentPage(Number(pagination.page) || dataPage);

        setTotalPages(Number(pagination.totalPages) || 1);

        setTotalRecords(Number(pagination.total) || 0);
      } else {
        setParticipants([]);
        setCurrentPage(1);
        setTotalPages(1);
        setTotalRecords(0);
      }
    } catch (err) {
      console.error("Error fetching participants:", err);

      setParticipants([]);
      setCurrentPage(1);
      setTotalPages(1);
      setTotalRecords(0);

      setError(err?.message || "Failed to fetch participant list");
    } finally {
      setLoader(false);
    }
  };

  useEffect(() => {
    fetchPanchanamalist(1);
  }, [filters, pageSize]);

  const formatDateTime = (dateString, timeString) => {
    if (!dateString) {
      return "-";
    }

    const date = new Date(dateString);

    if (isNaN(date.getTime())) {
      return "-";
    }

    const formattedDate = date.toLocaleDateString("en-IN", {
      timeZone: "Asia/Kolkata",
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
    });

    let formattedTime = "";

    if (timeString) {
      const [hours, minutes, seconds] = timeString.split(":").map(Number);

      const timeDate = new Date();
      timeDate.setHours(hours, minutes, seconds || 0);

      formattedTime = timeDate.toLocaleTimeString("en-IN", {
        hour: "2-digit",
        minute: "2-digit",
        second: "2-digit",
        hour12: true,
      });
    }

    return formattedTime
      ? `${formattedDate} - ${formattedTime}`
      : formattedDate;
  };
  const handlePageChange = (page) => {
    if (page >= 1 && page <= totalPages && page !== currentPage) {
      fetchPanchanamalist(page);
    }
  };

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

  const formatDate = (dateString) => {
    if (!dateString) {
      return "-";
    }

    const date = new Date(dateString);

    if (isNaN(date.getTime())) {
      return "-";
    }

    return date
      .toLocaleString("en-IN", {
        timeZone: "Asia/Kolkata",
        day: "2-digit",
        month: "2-digit",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
        hour12: true,
      })
      .replace(",", " - ");
  };

  const getPanchanamaPhotos = (panchanama) => {
    return [
      panchanama?.BLOB_NEAR_PHOTO,
      panchanama?.BLOB_FAR_PHOTO,
      panchanama?.BLOB_USER_PHOTO,
    ].filter((img) => img && typeof img === "string" && img.trim() !== "");
  };

  const openImageInNewTab = (img) => {
    try {
      if (!img) {
        return;
      }

      const binaryString = atob(img);

      const bytes = new Uint8Array(binaryString.length);

      for (let i = 0; i < binaryString.length; i++) {
        bytes[i] = binaryString.charCodeAt(i);
      }

      const blob = new Blob([bytes], {
        type: "image/png",
      });

      const blobUrl = URL.createObjectURL(blob);

      window.open(blobUrl, "_blank");
    } catch (err) {
      console.error("Error opening image:", err);

      setModalType("error");
      setModalTitle("Error");
      setModalMessage("Unable to open image. Please try again.");
      setIsModalOpen(true);
    }
  };

  const handleImageClick = (panchanama, index) => {
    const images = getPanchanamaPhotos(panchanama);

    setSelectedImages(images);
    setSelectedImageIndex(index);
    setShowImageModal(true);
  };

  // =========================================================
  // NEXT IMAGE
  // =========================================================

  const nextImage = () => {
    if (selectedImageIndex < selectedImages.length - 1) {
      setSelectedImageIndex(selectedImageIndex + 1);
    }
  };

  // =========================================================
  // PREVIOUS IMAGE
  // =========================================================

  const prevImage = () => {
    if (selectedImageIndex > 0) {
      setSelectedImageIndex(selectedImageIndex - 1);
    }
  };

  // =========================================================
  // VIEW PARTICIPANT DETAILS
  // =========================================================

  const handleViewDetails = async (panchanama) => {
    const id = panchanama?.NUM_ILLEGALHOARD_ID;

    if (!id) {
      setModalType("error");
      setModalTitle("Error");
      setModalMessage("Panchanama ID not found.");
      setIsModalOpen(true);
      return;
    }

    try {
      setDetailsLoading(true);

      // Open modal immediately with loading state
      setSelectedParticipant(panchanama);
      setSelectedPanchanamaDetails(null);
      setShowDetailsModal(true);

      const response = await apiClient.get(
        `/advertisement/getPanchanamaDetails?id=${id}`,
      );

      console.log("Panchanama Details Response:", response);

      if (response?.success && response?.data) {
        setSelectedPanchanamaDetails(response.data);

        // Master contains latest complete information + BLOBs
        setSelectedParticipant(response.data.master);
      } else {
        setSelectedPanchanamaDetails(null);

        setModalType("error");
        setModalTitle("Error");
        setModalMessage(
          response?.message || "Unable to fetch Panchanama details.",
        );
        setIsModalOpen(true);
      }
    } catch (err) {
      console.error("Error fetching Panchanama details:", err);

      setSelectedPanchanamaDetails(null);

      setModalType("error");
      setModalTitle("Error");
      setModalMessage(err?.message || "Failed to fetch Panchanama details.");

      setIsModalOpen(true);
    } finally {
      setDetailsLoading(false);
    }
  };

  const handlePrintFromRow = async (id) => {
    try {
      setLoader(true);
      const response = await apiClient.get(
        `/advertisement/getPanchanamaDetails?id=${id}`,
      );
      if (response?.success && response?.data) {
        const master = response.data.master;
        const details = response.data.details || [];
        const demolitionDetails = response.data.demolitionDetails || [];
        const photos = [
          master?.BLOB_NEAR_PHOTO,
          master?.BLOB_FAR_PHOTO,
          master?.BLOB_USER_PHOTO,
        ].filter((img) => img && typeof img === "string" && img.trim() !== "");

        const data = { master, details, demolitionDetails, photos };
        await generatePDF(data);
      } else {
        showError("Unable to fetch details for PDF.");
      }
    } catch (err) {
      console.error(err);
      showError("Failed to generate PDF.");
    } finally {
      setLoader(false);
    }
  };

  // =========================================================
  // CLOSE DETAILS MODAL
  // =========================================================

  const handleCloseDetailsModal = () => {
    setShowDetailsModal(false);
    setSelectedParticipant(null);
    setSelectedPanchanamaDetails(null);
    setDetailsLoading(false);
  };

  // =========================================================
  // RENDER PARTICIPANT PHOTOS
  // =========================================================

  const renderPanchanamaPhotos = (panchanama) => {
    const images = getPanchanamaPhotos(panchanama);

    if (images.length === 0) {
      return <span className="text-muted small">No photos</span>;
    }

    return (
      <div className="d-flex gap-2 flex-wrap">
        {images.map((img, idx) => (
          <img
            key={idx}
            src={`data:image/jpeg;base64,${img}`}
            alt={`Panchanama ${idx + 1}`}
            style={{
              width: "65px",
              height: "65px",
              objectFit: "cover",
              borderRadius: "8px",
              border: "2px solid #dee2e6",
              cursor: "pointer",
            }}
            onClick={() => handleImageClick(panchanama, idx)}
          />
        ))}
      </div>
    );
  };

  // =========================================================
  // DETAILS MODAL VALUE FORMATTER
  // =========================================================

  const formatDetailValue = (key, value) => {
    if (value === null || value === undefined || value === "") {
      return "-";
    }

    // Date fields
    if (key === "APPLICATION_DATE" || key.toLowerCase().includes("date")) {
      return formatDate(value);
    }

    // Don't display huge Base64 strings as text
    if (key.toUpperCase().startsWith("PHOTO_")) {
      return null;
    }

    // Objects / Arrays
    if (typeof value === "object") {
      try {
        return JSON.stringify(value, null, 2);
      } catch {
        return String(value);
      }
    }

    return String(value);
  };

  // =========================================================
  // DETAILS MODAL
  // =========================================================

  const renderDetailsModal = () => {
    if (!showDetailsModal) {
      return null;
    }

    // =========================================================
    // LOADING
    // =========================================================

    if (detailsLoading) {
      return (
        <div
          className="modal show d-block"
          tabIndex="-1"
          role="dialog"
          style={{
            backgroundColor: "rgba(0,0,0,0.6)",
            zIndex: 2100,
          }}
        >
          <div className="modal-dialog modal-dialog-centered" role="document">
            <div className="modal-content">
              <div className="modal-header">
                <h5 className="modal-title">
                  <i className="bi bi-file-earmark-text me-2"></i>
                  Panchanama Details
                </h5>

                <button
                  type="button"
                  className="btn-close"
                  onClick={handleCloseDetailsModal}
                ></button>
              </div>

              <div className="modal-body text-center py-5">
                <div className="spinner-border text-primary mb-3" role="status">
                  <span className="visually-hidden">Loading...</span>
                </div>

                <div className="text-muted">Loading Panchanama details...</div>
              </div>
            </div>
          </div>
        </div>
      );
    }

    // =========================================================
    // DATA
    // =========================================================

    const master = selectedPanchanamaDetails?.master || selectedParticipant;

    const details = selectedPanchanamaDetails?.details || [];

    const demolitionDetails =
      selectedPanchanamaDetails?.demolitionDetails || [];

    if (!master) {
      return null;
    }

    const photos = getPanchanamaPhotos(master);

    // =========================================================
    // FORMAT LABEL
    // =========================================================
    const fieldLabels = {
      NUM_ILLEGALHOARD_ID: "Panchanama ID",
      NUM_ILLEGALHOARD_ULBID: "ULB ID",
      DAT_CAP_DT: "Capture Date",
      VAR_CAP_TIME: "Capture Time",
      VAR_USER1: "User Name",
      VAR_USER1_POST: "User Post",
      VAR_ILLEGALHOARD_ADD: "Address",
      DAT_FROM_DT: "From Date",
      NUM_SIZE_LENGTH: "Length",
      NUM_SIZE_WIDTH: "Width",
      LATITUDE: "Latitude",
      LONGITUDE: "Longitude",
      VAR_ILLEGALHOARD_WARD: "Ward",
      BLOB_NEAR_PHOTO: "Near Photo",
      BLOB_FAR_PHOTO: "Far Photo",
      BLOB_USER_PHOTO: "User Photo",
      VAR_ILLEGALHOARD_PANCHANAMA_NO: "Panchanama No.",
    };

    const formatLabel = (key) => {
      return (
        fieldLabels[key] ||
        key
          .replace(/_/g, " ")
          .toLowerCase()
          .replace(/\b\w/g, (char) => char.toUpperCase())
      );
    };

    // =========================================================
    // FORMAT VALUE
    // =========================================================

    const formatDetailValue = (key, value) => {
      if (value === null || value === undefined || value === "") {
        return "-";
      }

      // Don't display BLOB as text
      if (key.toUpperCase().startsWith("BLOB_")) {
        return null;
      }

      // Date fields
      if (
        key.toUpperCase().includes("DAT_") ||
        key.toUpperCase().includes("DATE")
      ) {
        return formatDate(value);
      }

      if (typeof value === "object") {
        try {
          return JSON.stringify(value);
        } catch {
          return String(value);
        }
      }

      return String(value);
    };

    // =========================================================
    // MASTER FIELDS
    // =========================================================

    const masterEntries = Object.entries(master);

    return (
      <div
        className="modal show d-block"
        tabIndex="-1"
        role="dialog"
        style={{
          backgroundColor: "rgba(0,0,0,0.6)",
          zIndex: 2100,
        }}
      >
        <div
          className="modal-dialog modal-xl modal-dialog-centered modal-dialog-scrollable"
          role="document"
          style={{
            maxWidth: "1000px",
          }}
        >
          <div className="modal-content">
            {/* ================================================= */}
            {/* HEADER */}
            {/* ================================================= */}

            <div className="modal-header">
              <div>
                <h5 className="modal-title mb-1">
                  <i className="bi bi-file-earmark-text me-2"></i>
                  Panchanama Details
                </h5>

                <small className="text-muted">
                  Panchanama ID:{" "}
                  <strong>{master.NUM_ILLEGALHOARD_ID || "-"}</strong>
                </small>
              </div>

              <button
                type="button"
                className="btn-close"
                onClick={handleCloseDetailsModal}
              ></button>
            </div>

            {/* ================================================= */}
            {/* BODY */}
            {/* ================================================= */}

            <div className="modal-body">
              {/* ================================================= */}
              {/* MASTER INFORMATION */}
              {/* ================================================= */}

              <div
                className="border rounded mb-4"
                style={{
                  overflow: "hidden",
                }}
              >
                <div
                  className="px-3 py-2 border-bottom"
                  style={{
                    backgroundColor: "#f8f8f8",
                    fontSize: "16px",
                    fontWeight: 600,
                    color: "#333",
                  }}
                >
                  <i className="bi bi-info-circle me-2"></i>
                  Panchanama Information
                </div>

                <div
                  style={{
                    padding: "20px 16px",
                    display: "grid",
                    gridTemplateColumns: "repeat(2, minmax(0, 1fr))",
                    columnGap: "50px",
                    rowGap: "24px",
                  }}
                >
                  {masterEntries.map(([key, value]) => {
                    if (key.toUpperCase().startsWith("BLOB_")) {
                      return null;
                    }

                    const formattedValue = formatDetailValue(key, value);

                    if (formattedValue === null) {
                      return null;
                    }

                    return (
                      <div
                        key={key}
                        style={{
                          minWidth: 0,
                        }}
                      >
                        <div
                          style={{
                            fontSize: "13px",
                            fontWeight: 600,
                            color: "#737887",
                            marginBottom: "5px",
                          }}
                        >
                          {formatLabel(key)}
                        </div>

                        <div
                          style={{
                            fontSize: "15px",
                            color: "#252525",
                            lineHeight: "1.5",
                            whiteSpace: "pre-wrap",
                            wordBreak: "break-word",
                          }}
                        >
                          {formattedValue}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* ================================================= */}
              {/* DETAILS ARRAY */}
              {/* ================================================= */}

              <div
                className="border rounded mb-4"
                style={{
                  overflow: "hidden",
                }}
              >
                <div
                  className="px-3 py-2 border-bottom"
                  style={{
                    backgroundColor: "#f8f8f8",
                    fontSize: "16px",
                    fontWeight: 600,
                    color: "#333",
                  }}
                >
                  <i className="bi bi-list-ul me-2"></i>
                  Panchanama Details
                  <span className="badge bg-primary ms-2">
                    {details.length}
                  </span>
                </div>

                <div className="p-3">
                  {details.length > 0 ? (
                    <div className="table-responsive">
                      <table className="table table-bordered table-sm align-middle mb-0">
                        <thead className="table-light">
                          <tr>
                            <th>Sr. No.</th>
                            <th>Detail ID</th>
                            <th>User</th>
                            <th>User Post</th>
                          </tr>
                        </thead>

                        <tbody>
                          {details.map((item, index) => (
                            <tr key={item.NUM_ILLEGALHOARDDET_ID || index}>
                              <td>{index + 1}</td>

                              <td>{item.NUM_ILLEGALHOARDDET_ID || "-"}</td>

                              <td>{item.VAR_USER || "-"}</td>

                              <td>{item.VAR_USER_POST || "-"}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  ) : (
                    <div className="text-center text-muted py-3">
                      <i className="bi bi-inbox me-2"></i>
                      No Panchanama details available.
                    </div>
                  )}
                </div>
              </div>

              {/* ================================================= */}
              {/* DEMOLITION DETAILS */}
              {/* ================================================= */}

              <div
                className="border rounded mb-4"
                style={{
                  overflow: "hidden",
                }}
              >
                <div
                  className="px-3 py-2 border-bottom"
                  style={{
                    backgroundColor: "#f8f8f8",
                    fontSize: "16px",
                    fontWeight: 600,
                    color: "#333",
                  }}
                >
                  <i className="bi bi-tools me-2"></i>
                  Demolition Details
                  <span className="badge bg-danger ms-2">
                    {demolitionDetails.length}
                  </span>
                </div>

                <div className="p-3">
                  {demolitionDetails.length > 0 ? (
                    <div className="table-responsive">
                      <table className="table table-bordered table-sm align-middle mb-0">
                        <thead className="table-light">
                          <tr>
                            <th>Sr. No.</th>
                            <th>Demolition ID</th>
                            <th>Started By</th>
                          </tr>
                        </thead>

                        <tbody>
                          {demolitionDetails.map((item, index) => (
                            <tr key={item.NUM_ILLHOARD_DEMON_ID || index}>
                              <td>{index + 1}</td>

                              <td>{item.NUM_ILLHOARD_DEMON_ID || "-"}</td>

                              <td>{item.VAR_DEMONSTARTED_NAME || "-"}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  ) : (
                    <div className="text-center text-muted py-3">
                      <i className="bi bi-inbox me-2"></i>
                      No demolition details available.
                    </div>
                  )}
                </div>
              </div>

              {/* ================================================= */}
              {/* PHOTOS */}
              {/* ================================================= */}

              <div
                className="border rounded"
                style={{
                  overflow: "hidden",
                }}
              >
                <div
                  className="px-3 py-2 border-bottom"
                  style={{
                    backgroundColor: "#f8f8f8",
                    fontSize: "16px",
                    fontWeight: 600,
                    color: "#333",
                  }}
                >
                  <i className="bi bi-images me-2"></i>
                  Panchanama Photos
                  <span className="badge bg-secondary ms-2">
                    {photos.length}
                  </span>
                </div>

                <div className="p-3">
                  {photos.length > 0 ? (
                    <div className="row g-3">
                      {photos.map((img, index) => (
                        <div className="col-6 col-md-4" key={index}>
                          <div className="card h-100 shadow-sm">
                            <img
                              src={`data:image/jpeg;base64,${img}`}
                              alt={`Panchanama Photo ${index + 1}`}
                              className="card-img-top"
                              style={{
                                height: "200px",
                                objectFit: "cover",
                                cursor: "pointer",
                              }}
                              onClick={() => handleImageClick(master, index)}
                            />

                            <div className="card-body p-2 text-center">
                              <small className="text-muted">
                                {index === 0
                                  ? "Near Photo"
                                  : index === 1
                                    ? "Far Photo"
                                    : "User Photo"}
                              </small>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center text-muted py-4">
                      <i
                        className="bi bi-image"
                        style={{
                          fontSize: "2rem",
                        }}
                      ></i>

                      <div className="mt-2">No photos available</div>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* ================================================= */}
            {/* FOOTER */}
            {/* ================================================= */}

            <div className="modal-footer">
              <button
                type="button"
                className="btn btn-secondary"
                onClick={handleCloseDetailsModal}
              >
                <i className="bi bi-x-lg me-1"></i>
                Close
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  };

  // =========================================================
  // RENDER
  // =========================================================

  return (
    <Layout>
      <div className="panel">
        {/* HEADER */}

        <div className="panel-header d-flex justify-content-between align-items-center">
          <div>
            <h2 className="h5 mb-1 section-title">
              <i className="bi bi-people me-2" aria-hidden="true"></i>

              <span>All Panchanama ({totalRecords})</span>
            </h2>

            <p className="text-muted mb-0">View all Panchanama records.</p>
          </div>

          {/* FILTERS */}

          <div>
            <div className="filter-bar">
              {/* FROM DATE */}

              <div className="filter-group">
                <label htmlFor="fromDate">From Date</label>

                <input
                  type="date"
                  id="fromDate"
                  name="fromDate"
                  className="filter-input"
                  style={{
                    width: "150px",
                  }}
                  value={filters.fromDate}
                  onChange={handleDateChangeFilter}
                />
              </div>

              {/* TO DATE */}

              <div className="filter-group">
                <label htmlFor="toDate">To Date</label>

                <input
                  type="date"
                  id="toDate"
                  name="toDate"
                  className="filter-input"
                  style={{
                    width: "150px",
                  }}
                  value={filters.toDate}
                  onChange={handleDateChangeFilter}
                />
              </div>

              {/* CLEAR */}

              <div
                className="filter-group"
                style={{
                  justifyContent: "flex-end",
                }}
              >
                <button
                  type="button"
                  className="btn-clear-filters"
                  onClick={handleClearFilters}
                >
                  <i className="bi bi-x-lg me-1"></i>
                  Clear
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* ERROR */}

        {error && (
          <div className="alert alert-danger m-3">
            <i className="bi bi-exclamation-triangle me-2"></i>
            {error}
          </div>
        )}

        {/* TABLE */}

        <div className="table-responsive">
          <table className="table align-middle mb-0">
            <thead>
              <tr>
                <th>ID</th>
                <th>Panchanama No.</th>
                <th>User Name</th>
                <th>User Post</th>
                <th>Capture Date & Time</th>
                <th>Address</th>
                <th>Ward</th>
                <th>Action</th>
              </tr>
            </thead>

            <tbody>
              {participants.length > 0 ? (
                participants.map((panchanama, index) => (
                  <tr key={panchanama.NUM_ILLEGALHOARD_ID || index}>
                    {/* ID */}
                    <td>
                      <strong>{panchanama.NUM_ILLEGALHOARD_ID || "-"}</strong>
                    </td>

                    {/* PANCHANAMA NO */}
                    <td>{panchanama.VAR_ILLEGALHOARD_PANCHANAMA_NO || "-"}</td>

                    {/* USER NAME */}
                    <td>
                      <div className="fw-semibold">
                        {panchanama.VAR_USER1 || "-"}
                      </div>
                    </td>

                    {/* USER POST */}
                    <td>{panchanama.VAR_USER1_POST || "-"}</td>

                    {/* CAPTURE DATE + TIME */}
                    <td>
                      {formatDateTime(
                        panchanama.DAT_CAP_DT,
                        panchanama.VAR_CAP_TIME,
                      )}
                    </td>

                    {/* ADDRESS */}
                    <td>{panchanama.VAR_ILLEGALHOARD_ADD || "-"}</td>

                    {/* WARD */}
                    <td>{panchanama.VAR_ILLEGALHOARD_WARD || "-"}</td>

                    {/* ACTION */}
                    <td>
                      <div className="d-flex" style={{ gap: "5px" }}>
                        <button
                          type="button"
                          className="btn btn-sm btn-primary"
                          onClick={() => handleViewDetails(panchanama)}
                        >
                          <i className="bi bi-eye me-1"></i>
                          View
                        </button>
                        <button
                          type="button"
                          className="btn btn-sm btn-primary"
                          onClick={() =>
                            handlePrintFromRow(panchanama?.NUM_ILLEGALHOARD_ID)
                          }
                        >
                          <i className="bi bi-printer me-1"></i>
                          Print
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="8" className="text-center text-muted py-5">
                    <div>
                      <i
                        className="bi bi-inbox"
                        style={{ fontSize: "2rem" }}
                      ></i>

                      <div className="mt-2">No Panchanama records found</div>
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* PAGINATION */}

        <div className="d-flex align-items-center justify-content-between mt-4 px-3 pb-3">
          {/* RECORD COUNT */}

          <div className="text-muted small">
            Showing{" "}
            <strong>
              {totalRecords === 0 ? 0 : (currentPage - 1) * pageSize + 1}
            </strong>{" "}
            to <strong>{Math.min(currentPage * pageSize, totalRecords)}</strong>{" "}
            of <strong>{totalRecords}</strong> participants
          </div>

          {/* PAGE SIZE */}

          <div className="d-flex align-items-center gap-2">
            <span className="text-muted small">Show</span>

            <select
              className="form-select form-select-sm"
              style={{
                width: "75px",
              }}
              value={pageSize}
              onChange={(e) => {
                setPageSize(Number(e.target.value));
                setCurrentPage(1);
              }}
            >
              <option value={5}>5</option>

              <option value={10}>10</option>

              <option value={20}>20</option>

              <option value={50}>50</option>
            </select>
          </div>

          {/* PAGINATION */}

          <nav aria-label="Page navigation">
            <ul className="pagination mb-0">
              {/* FIRST */}

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

              {/* PREVIOUS */}

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

              {/* PAGE NUMBERS */}

              {getPaginationPages().map((page) => (
                <li
                  key={page}
                  className={`page-item ${
                    currentPage === page ? "active" : ""
                  }`}
                >
                  <button
                    className="page-link"
                    onClick={() => handlePageChange(page)}
                  >
                    {page}
                  </button>
                </li>
              ))}

              {/* NEXT */}

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

              {/* LAST */}

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

      {/* ================================================= */}
      {/* FULL IMAGE MODAL */}
      {/* ================================================= */}

      {showImageModal && selectedImages.length > 0 && (
        <div
          className="modal show d-block"
          tabIndex="-1"
          role="dialog"
          style={{
            backgroundColor: "rgba(0,0,0,0.8)",
            zIndex: 2200,
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
              style={{
                border: "none",
              }}
            >
              {/* HEADER */}

              <div className="modal-header bg-dark border-secondary">
                <h5 className="modal-title text-white">
                  Photo {selectedImageIndex + 1} of {selectedImages.length}
                </h5>

                <button
                  type="button"
                  className="btn-close btn-close-white"
                  onClick={() => setShowImageModal(false)}
                ></button>
              </div>

              {/* IMAGE */}

              <div
                className="modal-body p-0 d-flex align-items-center justify-content-center"
                style={{
                  minHeight: "60vh",
                }}
              >
                <img
                  src={`data:image/jpeg;base64,${selectedImages[selectedImageIndex]}`}
                  alt={`panchanama-full-${selectedImageIndex}`}
                  style={{
                    maxWidth: "85vw",
                    maxHeight: "70vh",
                    objectFit: "contain",
                  }}
                />
              </div>

              {/* FOOTER */}

              <div className="modal-footer bg-dark border-secondary justify-content-between">
                <button
                  type="button"
                  className="btn btn-outline-light"
                  onClick={prevImage}
                  disabled={selectedImageIndex === 0}
                >
                  <i className="bi bi-chevron-left me-1"></i>
                  Previous
                </button>

                <button
                  type="button"
                  className="btn btn-outline-light"
                  onClick={nextImage}
                  disabled={selectedImageIndex === selectedImages.length - 1}
                >
                  Next
                  <i className="bi bi-chevron-right ms-1"></i>
                </button>
                
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ================================================= */}
      {/* PARTICIPANT DETAILS MODAL */}
      {/* ================================================= */}

      {showDetailsModal && renderDetailsModal()}

      {/* ================================================= */}
      {/* RESPONSE MODAL */}
      {/* ================================================= */}

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

export default PanchanamaList;
