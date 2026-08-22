import Layout from "../../components/Layout";
import { useEffect, useState } from "react";
import apiClient from "../../services/apiClient";
import { useLoader } from "../../context/LoaderContext";
import ResponseModal from "../../components/ResponseModal";
import dhuleLogo from "../../../public/assets/images/dhule-logo.png";
import ExcelExportButton from "../../components/ExcelExportButton";
import { useAuth } from "../../context/AuthContext";

const getToday = () => {
  const d = new Date();
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
};

const NoticePaymentReport = () => {
  const { user } = useAuth();
  const { setLoader } = useLoader();

  const [participants, setParticipants] = useState([]);
  const [error, setError] = useState(null);

  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalRecords, setTotalRecords] = useState(0);
  const [pageSize, setPageSize] = useState(10);

  // Filters
  const [noticeNoInput, setNoticeNoInput] = useState("");
  const [filters, setFilters] = useState({
    fromDate: getToday(),
    toDate: getToday(),
    noticeNo: "",
    ward: "",
    paymentStatus: "",
  });

  // Image modal
  const [showImageModal, setShowImageModal] = useState(false);
  const [selectedImages, setSelectedImages] = useState([]);
  const [selectedImageIndex, setSelectedImageIndex] = useState(0);

  // Details modal
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [selectedParticipant, setSelectedParticipant] = useState(null);
  const [selectedPanchanamaDetails, setSelectedPanchanamaDetails] =
    useState(null);
  const [detailsLoading, setDetailsLoading] = useState(false);
  const [noticeHtml, setNoticeHtml] = useState("");
  const [activeModalTab, setActiveModalTab] = useState("notice");
  const [generatingNoticeId, setGeneratingNoticeId] = useState(null);

  // Response modal
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalType, setModalType] = useState("info");
  const [modalTitle, setModalTitle] = useState("");
  const [modalMessage, setModalMessage] = useState("");

  // Excel export
  const [excelData, setExcelData] = useState([]);
  const tableHeaders = [
    "अनुक्र.",
    "पंचनामा क्र.",
    "नाव",
    "पद",
    "पंचनामा दिनांक व वेळ",
    "जाहिरातीचा पत्ता",
    "प्रभाग",
  ];
  const keyMapping = {
    "अनुक्र.": "id",
    "पंचनामा क्र.": "panchanamaNo",
    नाव: "name",
    पद: "post",
    "पंचनामा दिनांक व वेळ": "captureDateTime",
    "जाहिरातीचा पत्ता": "address",
    प्रभाग: "ward",
  };

  const handleDateChangeFilter = (e) => {
    const { name, value } = e.target;
    setFilters((prev) => ({ ...prev, [name]: value }));
  };

  // Generic handler for dropdowns
  const handleFilterChange = (e) => {
    const { name, value } = e.target;
    setFilters((prev) => ({ ...prev, [name]: value }));
  };

  const handleClearFilters = () => {
    setNoticeNoInput("");
    setFilters({
      fromDate: "",
      toDate: "",
      noticeNo: "",
      ward: "",
      paymentStatus: "",
    });
  };

  const fetchReportData = async (dataPage = 1) => {
    try {
      setLoader(true);
      setError(null);

      let url = `/?page=${dataPage}&limit=${pageSize}&ulbId=${import.meta.env.VITE_ULBID}&userId=${user.userId}`;

      if (filters.fromDate) {
        url += `&fromDate=${encodeURIComponent(filters.fromDate)}`;
      }
      if (filters.toDate) {
        url += `&toDate=${encodeURIComponent(filters.toDate)}`;
      }
      if (filters.noticeNo) {
        url += `&select=${encodeURIComponent(filters.noticeNo)}`;
      }
      if (filters.ward) {
        url += `&ward=${encodeURIComponent(filters.ward)}`;
      }
      if (filters.paymentStatus) {
        url += `&paymentStatus=${encodeURIComponent(filters.paymentStatus)}`;
      }

      const response = await apiClient.get(url);

      if (response?.success && response?.data) {
        const participantData = response.data.data || [];
        const pagination = response.data.pagination || {};
        const excelData = participantData.map((item) => ({
          id: item.NUM_ILLEGALHOARD_ID,
          panchanamaNo: item.VAR_ILLEGALHOARD_PANCHANAMA_NO,
          name: item.VAR_USER1,
          post: item.VAR_USER1_POST,
          captureDateTime: formatDateTime(item.DAT_CAP_DT, item.VAR_CAP_TIME),
          address: item.VAR_ILLEGALHOARD_ADD,
          ward: item.VAR_ILLEGALHOARD_WARD,
        }));
        setExcelData(excelData);
        setParticipants(participantData);
        setCurrentPage(Number(pagination.page) || dataPage);
        setTotalPages(Number(pagination.totalPages) || 1);
        setTotalRecords(Number(pagination.total) || 0);
      } else {
        setExcelData([]);
        setParticipants([]);
        setCurrentPage(1);
        setTotalPages(1);
        setTotalRecords(0);
      }
    } catch (err) {
      console.error("Error fetching report data:", err);
      setExcelData([]);
      setParticipants([]);
      setCurrentPage(1);
      setTotalPages(1);
      setTotalRecords(0);
      setError(err?.message || "Failed to fetch report data");
    } finally {
      setLoader(false);
    }
  };

  //   debounc for only Notice number input box field
  useEffect(() => {
    const handler = setTimeout(() => {
      setFilters((prev) => ({ ...prev, noticeNo: noticeNoInput }));
    }, 500);

    return () => {
      clearTimeout(handler);
    };
  }, [noticeNoInput]);

  useEffect(() => {
    fetchReportData(1);
  }, [filters, pageSize]);

  const formatDateTime = (dateString, timeString) => {
    if (!dateString) return "-";
    const date = new Date(dateString);
    if (isNaN(date.getTime())) return "-";
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
      fetchReportData(page);
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
    if (!dateString) return "-";
    const date = new Date(dateString);
    if (isNaN(date.getTime())) return "-";
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
      if (!img) return;
      const binaryString = atob(img);
      const bytes = new Uint8Array(binaryString.length);
      for (let i = 0; i < binaryString.length; i++) {
        bytes[i] = binaryString.charCodeAt(i);
      }
      const blob = new Blob([bytes], { type: "image/png" });
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

  const nextImage = () => {
    if (selectedImageIndex < selectedImages.length - 1) {
      setSelectedImageIndex(selectedImageIndex + 1);
    }
  };

  const prevImage = () => {
    if (selectedImageIndex > 0) {
      setSelectedImageIndex(selectedImageIndex - 1);
    }
  };

  const formatDateOnly = (dateStr) => {
    if (!dateStr) return "-";
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return String(dateStr);
    return d.toLocaleDateString("en-IN", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
    });
  };

  const fetchNoticeHtml = async (masterData, demolitionDetails) => {
    try {
      const advertiserNames =
        demolitionDetails
          ?.map((item) => item?.VAR_DEMONSTARTED_NAME)
          .filter((name) => name && String(name).trim() !== "")
          .join(", ") || "जाहिरातदार";

      const noticePayload = {
        corporationId:
          masterData?.NUM_ILLEGALHOARD_ULBID ||
          masterData?.NUM_ULBID ||
          masterData?.ulbId ||
          4,
        corporationName:
          masterData?.VAR_CORPORATION_NAME || "धुळे महानगरपालिका",
        corporationLogo: dhuleLogo,
        REGIONAL_OFFICE_NO:
          masterData?.VAR_ILLEGALHOARD_WARD ||
          masterData?.NUM_REGIONAL_OFFICE_NO ||
          "-",
        ADVERTISER_NAME: advertiserNames,
        ADDRESS: masterData?.VAR_ILLEGALHOARD_ADD || "-",
        LATITUDE: masterData?.LATITUDE || masterData?.NUM_LAT || "-",
        LONGITUDE: masterData?.LONGITUDE || masterData?.NUM_LONG || "-",
        SIZE:
          masterData?.NUM_SIZE_LENGTH && masterData?.NUM_SIZE_WIDTH
            ? `${masterData.NUM_SIZE_LENGTH} x ${masterData.NUM_SIZE_WIDTH}`
            : masterData?.VAR_SIZE || masterData?.SIZE || "-",
        FROM_DATE: masterData?.DAT_FROM_DT
          ? formatDateOnly(masterData.DAT_FROM_DT)
          : masterData?.DAT_CAP_DT
            ? formatDateOnly(masterData.DAT_CAP_DT)
            : "-",
        TO_DATE: masterData?.DAT_TO_DT
          ? formatDateOnly(masterData.DAT_TO_DT)
          : masterData?.DAT_CAP_DT
            ? formatDateOnly(masterData.DAT_CAP_DT)
            : "-",
        AMOUNT:
          masterData?.NUM_HOARD_AMOUNT ||
          masterData?.NUM_AMOUNT ||
          masterData?.AMOUNT ||
          "0",
        OFFICER_NAME: masterData?.VAR_USER1 || "-",
        OFFICER_DESIGNATION: masterData?.VAR_USER1_POST || "-",
        REGIONAL_OFFICE: masterData?.VAR_ILLEGALHOARD_WARD || "-",
        ID: masterData.NUM_ILLEGALHOARD_ID,
      };

      const response = await apiClient.post("/notice/render", noticePayload);
      if (response?.success && response?.data?.html) {
        setNoticeHtml(response.data.html);
      } else {
        setNoticeHtml("");
      }
    } catch (err) {
      console.error("Error fetching notice HTML:", err);
      setNoticeHtml("");
    }
  };

  const handlePrintNotice = () => {
    if (!noticeHtml) return;
    const printWin = window.open("", "_blank");
    if (printWin) {
      printWin.document.write(noticeHtml);
      printWin.document.close();
      printWin.focus();
      setTimeout(() => {
        printWin.print();
      }, 500);
    }
  };

  const handleOpenNoticeNewTab = () => {
    if (!noticeHtml) return;
    const win = window.open("", "_blank");
    if (win) {
      win.document.write(noticeHtml);
      win.document.close();
    }
  };

  const handleGenerateNotice = async (panchanama) => {
    const id = panchanama?.NUM_ILLEGALHOARD_ID;
    if (!id) {
      setModalType("error");
      setModalTitle("Error");
      setModalMessage("Panchanama ID not found.");
      setIsModalOpen(true);
      return;
    }

    try {
      setGeneratingNoticeId(id);

      let masterData = panchanama;
      let demolitionDetails = panchanama;

      try {
        const responseDetails = await apiClient.get(
          `/advertisement/getPanchanamaDetails?id=${id}`,
        );
        if (responseDetails?.success && responseDetails?.data?.master) {
          masterData = responseDetails.data.master;
          demolitionDetails = responseDetails.data.demolitionDetails;
        }
      } catch (err) {
        console.error("Could not fetch extra panchanama details:", err);
      }

      const advertiserNames =
        demolitionDetails
          ?.map((item) => item?.VAR_DEMONSTARTED_NAME)
          .filter((name) => name && String(name).trim() !== "")
          .join(", ") || "जाहिरातदार";

      const storedUser = JSON.parse(localStorage.getItem("user") || "{}");
      const userId =
        storedUser?.userId ||
        storedUser?.USER_ID ||
        storedUser?.NUM_USER_ID ||
        storedUser?.id ||
        null;

      if (!userId) {
        throw new Error("Logged-in user ID not found. Please login again.");
      }

      const noticePayload = {
        id: masterData.NUM_ILLEGALHOARD_ID,
        userId: userId,
        corporationId:
          masterData?.NUM_ILLEGALHOARD_ULBID ||
          masterData?.NUM_ULBID ||
          masterData?.ulbId ||
          4,
        corporationName:
          masterData?.VAR_CORPORATION_NAME || "धुळे महानगरपालिका",
        corporationLogo: dhuleLogo,
        REGIONAL_OFFICE_NO:
          masterData.VAR_ILLEGALHOARD_WARD ||
          masterData.NUM_REGIONAL_OFFICE_NO ||
          "-",
        ADVERTISER_NAME: advertiserNames,
        ADDRESS: masterData.VAR_ILLEGALHOARD_ADD || "-",
        LATITUDE: masterData.LATITUDE || masterData.NUM_LAT || "-",
        LONGITUDE: masterData.LONGITUDE || masterData.NUM_LONG || "-",
        SIZE:
          masterData.NUM_SIZE_LENGTH && masterData.NUM_SIZE_WIDTH
            ? `${masterData.NUM_SIZE_LENGTH} x ${masterData.NUM_SIZE_WIDTH}`
            : masterData.VAR_SIZE || masterData.SIZE || "-",
        FROM_DATE: masterData.DAT_FROM_DT
          ? formatDateOnly(masterData.DAT_FROM_DT)
          : masterData.DAT_CAP_DT
            ? formatDateOnly(masterData.DAT_CAP_DT)
            : "-",
        TO_DATE: masterData.DAT_TO_DT
          ? formatDateOnly(masterData.DAT_TO_DT)
          : masterData.DAT_CAP_DT
            ? formatDateOnly(masterData.DAT_CAP_DT)
            : "-",
        AMOUNT:
          masterData.NUM_HOARD_AMOUNT ||
          masterData.NUM_AMOUNT ||
          masterData.AMOUNT ||
          "0",
        OFFICER_NAME: masterData.VAR_USER1 || "-",
        OFFICER_DESIGNATION: masterData.VAR_USER1_POST || "-",
        REGIONAL_OFFICE: masterData.VAR_ILLEGALHOARD_WARD || "-",
        PANCHANAMA_NO: masterData.VAR_ILLEGALHOARD_PANCHANAMA_NO || "-",
        ULB_ID: import.meta.env.VITE_ULBID,
      };

      const response = await apiClient.post("/notice/generate", noticePayload, {
        responseType: "blob",
        timeout: 300000,
      });

      if (!(response instanceof Blob)) {
        throw new Error("Invalid PDF response from server.");
      }

      const pdfBlob = new Blob([response], { type: "application/pdf" });

      const pdfUrl = window.URL.createObjectURL(pdfBlob);
      const pdfWindow = window.open(pdfUrl, "_blank");

      if (!pdfWindow) {
        const link = document.createElement("a");
        link.href = pdfUrl;
        link.download = `notice-${masterData.VAR_ILLEGALHOARD_PANCHANAMA_NO || id}.pdf`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
      }

      setModalType("success");
      setModalTitle("Notice Generated");
      setModalMessage("Notice generated and digitally signed successfully.");
      setIsModalOpen(true);

      setTimeout(() => {
        window.URL.revokeObjectURL(pdfUrl);
      }, 60000);
    } catch (err) {
      console.error("Error generating notice:", err);
      setModalType("error");
      setModalTitle("Error");
      setModalMessage(err?.message || "Failed to generate notice.");
      setIsModalOpen(true);
    } finally {
      setGeneratingNoticeId(null);
    }
  };

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
      setSelectedParticipant(panchanama);
      setSelectedPanchanamaDetails(null);
      setNoticeHtml("");
      setActiveModalTab("notice");
      setShowDetailsModal(true);

      const response = await apiClient.get(
        `/advertisement/getPanchanamaDetails?id=${id}`,
      );
      if (response?.success && response?.data) {
        setSelectedPanchanamaDetails(response.data);
        const masterData = response.data.master || panchanama;
        const demolitionDetails = response.data.demolitionDetails || panchanama;
        setSelectedParticipant(masterData);
        await fetchNoticeHtml(masterData, demolitionDetails);
      } else {
        setSelectedPanchanamaDetails(null);
        await fetchNoticeHtml(panchanama);
      }
    } catch (err) {
      console.error("Error fetching Panchanama details:", err);
      setSelectedPanchanamaDetails(null);
      await fetchNoticeHtml(panchanama);
    } finally {
      setDetailsLoading(false);
    }
  };

  const handleCloseDetailsModal = () => {
    setShowDetailsModal(false);
    setSelectedParticipant(null);
    setSelectedPanchanamaDetails(null);
    setNoticeHtml("");
    setDetailsLoading(false);
  };

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

  const renderDetailsModal = () => {
    if (!showDetailsModal) return null;

    if (detailsLoading) {
      return (
        <div
          className="modal show d-block"
          tabIndex="-1"
          role="dialog"
          style={{ backgroundColor: "rgba(0,0,0,0.6)", zIndex: 2100 }}
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

    const master = selectedPanchanamaDetails?.master || selectedParticipant;
    if (!master) return null;

    const photos = getPanchanamaPhotos(master);

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

    const formatDetailValue = (key, value) => {
      if (value === null || value === undefined || value === "") return "-";
      if (key.toUpperCase().startsWith("BLOB_")) return null;
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

    return (
      <div
        className="modal show d-block"
        tabIndex="-1"
        role="dialog"
        style={{ backgroundColor: "rgba(0,0,0,0.6)", zIndex: 2100 }}
      >
        <div
          className="modal-dialog modal-xl modal-dialog-centered modal-dialog-scrollable"
          role="document"
          style={{ maxWidth: "1000px" }}
        >
          <div className="modal-content">
            <div className="modal-header d-flex justify-content-between align-items-center">
              <div>
                <h5 className="modal-title mb-1">
                  <i className="bi bi-file-earmark-text me-2"></i>
                  Notice Preview / नोटीस
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

            <div className="modal-body">
              <div>
                <div className="d-flex justify-content-between align-items-center mb-3 bg-light p-2 rounded border">
                  <span className="fw-semibold text-dark">
                    <i className="bi bi-eye me-1 text-primary"></i> Notice
                    Preview (नोटीस)
                  </span>
                  <div className="d-flex gap-2">
                    <button
                      type="button"
                      className="btn btn-sm btn-outline-primary"
                      onClick={handlePrintNotice}
                      disabled={!noticeHtml}
                    >
                      <i className="bi bi-printer me-1"></i> Print Notice
                    </button>
                    <button
                      type="button"
                      className="btn btn-sm btn-outline-secondary"
                      onClick={handleOpenNoticeNewTab}
                      disabled={!noticeHtml}
                    >
                      <i className="bi bi-box-arrow-up-right me-1"></i> Open in
                      New Tab
                    </button>
                  </div>
                </div>

                {noticeHtml ? (
                  <div
                    className="border rounded bg-white p-2 shadow-sm"
                    style={{ minHeight: "650px" }}
                  >
                    <iframe
                      title="Notice Preview"
                      srcDoc={noticeHtml}
                      style={{
                        width: "100%",
                        height: "700px",
                        border: "none",
                        borderRadius: "4px",
                      }}
                    />
                  </div>
                ) : (
                  <div className="text-center py-5 text-muted">
                    <div
                      className="spinner-border text-primary mb-2"
                      role="status"
                    >
                      <span className="visually-hidden">Loading Notice...</span>
                    </div>
                    <div>Loading Notice Preview...</div>
                  </div>
                )}
              </div>
            </div>

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

  return (
    <Layout>
      <div className="panel">
        {/* HEADER */}
        <div className="panel-header d-flex justify-content-between align-items-center">
          <div>
            <h2 className="h5 mb-1 section-title">
              <i className="bi bi-people me-2" aria-hidden="true"></i>
              <span>सूचना देयकाचा अहवाल ({totalRecords})</span>
            </h2>
            <p className="text-muted mb-0">संपूर्ण यादी पहा</p>
          </div>

          <div>
            <div className="row g-2 align-items-end justify-content-end">
              {/* From Date */}
              <div className="col-auto">
                <label htmlFor="fromDate" className="form-label mb-0 small">
                  From Date
                </label>
                <input
                  type="date"
                  id="fromDate"
                  name="fromDate"
                  className="form-control form-control-sm"
                  style={{ width: "150px" }}
                  value={filters.fromDate}
                  onChange={handleDateChangeFilter}
                />
              </div>

              {/* To Date */}
              <div className="col-auto">
                <label htmlFor="toDate" className="form-label mb-0 small">
                  To Date
                </label>
                <input
                  type="date"
                  id="toDate"
                  name="toDate"
                  className="form-control form-control-sm"
                  style={{ width: "150px" }}
                  value={filters.toDate}
                  onChange={handleDateChangeFilter}
                />
              </div>

              {/* Ward */}
              <div className="col-auto">
                <label className="form-label mb-0 small">Select Ward</label>
                <select
                  name="ward"
                  className="form-select form-select-sm"
                  style={{ width: "130px" }}
                  value={filters.ward}
                  onChange={handleFilterChange}
                >
                  <option value="">Select Ward</option>
                  <option value="1">Ward 1</option>
                </select>
              </div>

              {/* Payment Status */}
              <div className="col-auto">
                <label className="form-label mb-0 small">Payment Mode</label>
                <select
                  name="paymentStatus"
                  className="form-select form-select-sm"
                  style={{ width: "140px" }}
                  value={filters.paymentStatus}
                  onChange={handleFilterChange}
                >
                  <option value="all">All</option>
                  <option value="cash">Cash</option>
                  <option value="cheque">Cheque</option>
                  <option value="Online">Online</option>
                  <option value="card">Card</option>
                  <option value="upi">UPI</option>
                </select>
              </div>

              {/* Notice No */}
              <div className="col-auto d-flex flex-column">
                <label className="form-label mb-0 small">Notice No</label>
                <input
                  type="text"
                  name="noticeNo"
                  value={noticeNoInput}
                  onChange={(e) => setNoticeNoInput(e.target.value)}
                  className="form-text-input"
                />
              </div>
              {/* Clear Button */}
              <div className="col-auto">
                <button
                  type="button"
                  className="btn btn-outline-secondary btn-sm"
                  onClick={handleClearFilters}
                >
                  <i className="bi bi-x-lg me-1"></i>
                  Clear
                </button>
              </div>

              {/* Excel Export */}
              <div className="col-auto">
                <ExcelExportButton
                  tableHeaders={tableHeaders}
                  data={excelData}
                  keyMapping={keyMapping}
                  fileName="NoticeNirmitiReport.xlsx"
                  buttonText="Excel"
                  className="btn btn-sm btn-success"
                />
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
                <th>अ क्र</th>
                <th>नोटीस क्र.</th>
                <th>नाव</th>
                <th>प्रभाग</th>
                <th>एकूण शुल्क</th>
                <th>पायमेंट स्तिथी</th>
                <th>पायमेंट दिनांक</th>
                <th>पायमेंट पद्धत</th>
                <th>Transaction ID</th>
                <th>क्रिया</th>
              </tr>
            </thead>
            <tbody>
              {participants.length > 0 ? (
                participants.map((panchanama, index) => (
                  <tr key={panchanama.NUM_ILLEGALHOARD_ID || index}>
                    <td></td>
                    <td></td>
                    <td></td>
                    <td></td>
                    <td></td>
                    <td></td>
                    <td></td>
                    <td></td>
                    <td></td>
                    <td>
                      <div className="d-flex gap-1 align-items-center">
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
                          className="btn btn-sm btn-success"
                          onClick={() => handleGenerateNotice(panchanama)}
                          disabled={
                            generatingNoticeId ===
                            panchanama.NUM_ILLEGALHOARD_ID
                          }
                        >
                          {generatingNoticeId ===
                          panchanama.NUM_ILLEGALHOARD_ID ? (
                            <>
                              <span
                                className="spinner-border spinner-border-sm me-1"
                                role="status"
                                aria-hidden="true"
                              ></span>
                              Generating...
                            </>
                          ) : (
                            <>
                              <i className="bi bi-file-earmark-pdf me-1"></i>
                              Generate
                            </>
                          )}
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
                      <div className="mt-2">
                        No notice nirmiti records found
                      </div>
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* PAGINATION */}
        <div className="d-flex align-items-center justify-content-between mt-4 px-3 pb-3">
          <div className="text-muted small">
            Showing{" "}
            <strong>
              {totalRecords === 0 ? 0 : (currentPage - 1) * pageSize + 1}
            </strong>{" "}
            to <strong>{Math.min(currentPage * pageSize, totalRecords)}</strong>{" "}
            of <strong>{totalRecords}</strong> participants
          </div>

          <div className="d-flex align-items-center gap-2">
            <span className="text-muted small">Show</span>
            <select
              className="form-select form-select-sm"
              style={{ width: "75px" }}
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
                className={`page-item ${currentPage === totalPages ? "disabled" : ""}`}
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
                className={`page-item ${currentPage === totalPages ? "disabled" : ""}`}
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

      {/* IMAGE MODAL */}
      {showImageModal && selectedImages.length > 0 && (
        <div
          className="modal show d-block"
          tabIndex="-1"
          role="dialog"
          style={{ backgroundColor: "rgba(0,0,0,0.8)", zIndex: 2200 }}
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
            <div className="modal-content bg-dark" style={{ border: "none" }}>
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
              <div
                className="modal-body p-0 d-flex align-items-center justify-content-center"
                style={{ minHeight: "60vh" }}
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

      {/* DETAILS MODAL */}
      {showDetailsModal && renderDetailsModal()}

      {/* RESPONSE MODAL */}
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

export default NoticePaymentReport;
