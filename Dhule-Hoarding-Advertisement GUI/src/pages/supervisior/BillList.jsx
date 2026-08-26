import Layout from "../../components/Layout";
import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
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

const BillList = () => {
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
  const [filters, setFilters] = useState({
    fromDate: '',
    toDate: '',
  });

  // Image modal
  const [showImageModal, setShowImageModal] = useState(false);
  const [selectedImages, setSelectedImages] = useState([]);
  const [selectedImageIndex, setSelectedImageIndex] = useState(0);

  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [selectedParticipant, setSelectedParticipant] = useState(null);
  const [selectedPanchanamaDetails, setSelectedPanchanamaDetails] =
    useState(null);
  const [detailsLoading, setDetailsLoading] = useState(false);
  const [noticeHtml, setNoticeHtml] = useState("");
  const [activeModalTab, setActiveModalTab] = useState("notice");
  const [generatingNoticeId, setGeneratingNoticeId] = useState(null);

  // Payments Modal
  const [showPaymentModal, setShowPaymentModal] = useState(false);

  // Response modal
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalType, setModalType] = useState("info");
  const [modalTitle, setModalTitle] = useState("");
  const [modalMessage, setModalMessage] = useState("");

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

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    reset,
    formState: { errors },
  } = useForm({
    defaultValues: {
      noticeNumber: "",
      paymentType: "",
      amount: "",
      bankName: "",
      branch: "",
      chequeNumber: "",
      chequeDate: "",
      remarks: "",
      micrCode: "",
      chequeType: "",
      transactionId: "",
      mobileNumber: "",
      email: "",
      address: "",
      name: "",
      recoveryAmount: "",
    },
  });

  const paymentType = watch("paymentType");

  const handleDateChangeFilter = (e) => {
    const { name, value } = e.target;

    setFilters((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleClearFilters = () => {
    setFilters({
      fromDate: "",
      toDate: "",
    });
  };

  const fetchPanchanamalist = async (dataPage = 1) => {
    try {
      setLoader(true);
      setError(null);

      let url = `/payment/getIllegalHoardPaymentList?page=${dataPage}&limit=${pageSize}&ulbId=${import.meta.env.VITE_ULBID}&userId=${user.userId}`;

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
      console.error("Error fetching participants:", err);

      setExcelData([]);
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
          .filter(
            (name) =>
              name !== null && name !== undefined && String(name).trim() !== "",
          )
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

  const renderDetailsModal = () => {
    if (!showDetailsModal) {
      return null;
    }

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

    useEffect(() => {
      setValue("bankName", "");
      setValue("branch", "");
      setValue("chequeNumber", "");
      setValue("chequeDate", "");
      setValue("micrCode", "");
      setValue("chequeType", "");
      setValue("transactionId", "");
    }, [paymentType]);
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

            {/* ================================================= */}
            {/* BODY */}
            {/* ================================================= */}

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

  // PAYMENTS MODAL

  const renderPaymentModal = async (amount, noticeNo) => {
    setValue("amount", amount);
    setValue("noticeNumber", noticeNo);
    setShowPaymentModal(true);
  };

  const handlePaymentModalClose = () => {
    setShowPaymentModal(false);
  };

  const handlePayment = async (data) => {
    try {
      const obj = {
        bankName: "Bank Name",
        branch: "Branch",
        chequeNumber: "Cheque Number",
        chequeDate: "Cheque Date",
        transactionId: "Transaction ID",
      };
      if (
        paymentType === "Cheque" &&
        (data.bankName === "" ||
          data.branch === "" ||
          data.chequeNumber === "" ||
          data.chequeDate === "")
      ) {
        let fields = ["bankName", "branch", "chequeNumber", "chequeDate"];
        let errorMessage = fields
          .filter((field) => !data[field])
          .map((key) => obj[key])
          .join(", ");
        setModalType("Warning");
        setModalTitle("Warning");
        setModalMessage(`${errorMessage} is required`);
        setIsModalOpen(true);
        return;
      }

      if (
        paymentType === "Online" &&
        (data.transactionId === "" ||
          data.bankName === "" ||
          data.branch === "")
      ) {
        let fields = ["bankName", "branch", "transactionId"];
        let errorMessage = fields
          .filter((field) => !data[field])
          .map((key) => obj[key])
          .join(", ");
        setModalType("Warning");
        setModalTitle("Warning");
        setModalMessage(`${errorMessage} is required`);
        setIsModalOpen(true);
        return;
      }

      if (paymentType === "UPI" && data.transactionId === "") {
        let fields = ["transactionId"];
        let errorMessage = fields
          .filter((field) => !data[field])
          .map((key) => obj[key])
          .join(", ");
        setModalType("Warning");
        setModalTitle("Warning");
        setModalMessage(`${errorMessage} is required`);
        setIsModalOpen(true);
        return;
      }

      if (Number(data.amount) !== Number(data.recoveryAmount)) {
        setModalType("Warning");
        setModalTitle("Warning");
        setModalMessage("Amount should be equal to Recovery Amount");
        setIsModalOpen(true);
        return;
      }
      setLoader(true);

      const payload = {
        userId: user.userId || null,
        ulbId: Number(import.meta.env.VITE_ULBID) || null,
        noticeNo: data.noticeNumber || null,
        paymentMode: data.paymentType || null,
        bankName: data.bankName || null,
        bankBranch: data.branch || null,
        chequeNo: data.chequeNumber || null,
        chequeDate: data.chequeDate || null,
        remark: data.remarks || null,
        micrCode: data.micrCode || null,
        chequeType: data.chequeType || null,
        transactionId: data.transactionId || null,
        mobileNo: Number(data.mobileNumber) || null,
        email: data.email || null,
        address: data.address || null,
        name: data.name || null,
        collectionAmount: Number(data.recoveryAmount) || null,
      };
      const response = await apiClient.post("/payment/add-payment", payload);

      if (response.success && response.data.errorCode === 9999) {
        setModalType("success");
        setModalTitle("Success");
        setModalMessage(response.data.message);
        setIsModalOpen(true);
        reset();
        setShowPaymentModal(false);
        fetchPanchanamalist();
      } else {
        setModalType("error");
        setModalTitle("Error");
        setModalMessage("Something went wrong");
        setIsModalOpen(true);
      }
    } catch (error) {
      setModalType("error");
      setModalTitle("Error");
      setModalMessage(error.message || "Something went wrong");
      setIsModalOpen(true);
    } finally {
      setLoader(false);
    }
  };
  return (
    <Layout>
      <div className="panel">
        {/* HEADER */}

        <div className="panel-header d-flex justify-content-between align-items-center">
          <div>
            <h2 className="h5 mb-1 section-title">
              <i className="bi bi-people me-2" aria-hidden="true"></i>

              <span>शुल्क भरणा यादी ({totalRecords})</span>
            </h2>

            <p className="text-muted mb-0">संपूर्ण यादी पहा</p>
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

              <ExcelExportButton
                tableHeaders={tableHeaders}
                data={excelData}
                keyMapping={keyMapping}
                fileName="NoticeList.xlsx"
                buttonText="Excel"
                className="btn btn-sm btn-success"
              />
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
                <th>अनुक्रमांक</th>
                <th>नोटीस क्र.</th>
                <th>पंचनामा क्र.</th>
                {/* <th>नाव</th> */}
                {/* <th>पद</th> */}
                <th>पंचनामा दिनांक व वेळ</th>
                {/* <th>जाहिरातीचा पत्ता</th> */}
                <th>प्रभाग</th>
                <th>शुल्क रक्कम</th>
                <th>शुल्क स्थिती</th>
                <th>क्रिया</th>
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
                    <td>{panchanama.VAR_NOTGEN_NO || "-"}</td>

                    {/* PANCHANAMA NO */}
                    <td>{panchanama.VAR_ILLEGALHOARD_PANCHANAMA_NO || "-"}</td>

                    {/* USER NAME */}
                    {/* <td>
                      <div className="fw-semibold">
                        {panchanama.VAR_USER1 || "-"}
                      </div>
                    </td> */}

                    {/* USER POST */}
                    {/* <td>{panchanama.VAR_USER1_POST || "-"}</td> */}

                    {/* CAPTURE DATE + TIME */}
                    <td>
                      {formatDateTime(
                        panchanama.DAT_CAP_DT,
                        panchanama.VAR_CAP_TIME,
                      )}
                    </td>

                    {/* ADDRESS */}
                    {/* <td>{panchanama.VAR_ILLEGALHOARD_ADD || "-"}</td> */}

                    {/* WARD */}
                    <td>{panchanama.VAR_ILLEGALHOARD_WARD || "-"}</td>

                    {/* shulk rakkam */}
                    <td>{panchanama.NUM_NOTGEN_AMT || "-"}</td>
                    {/* shulk sthithi */}
                    <td>{panchanama.VAR_NOTGEN_PAYMENTSTATUS || "-"}</td>

                    {/* ACTION */}
                    <td>
                      <div className="d-flex gap-1 align-items-center">
                       <button
                        type="button"
                        className={
    panchanama.VAR_NOTGEN_PAYMENTSTATUS?.trim().toLowerCase() === "paid"
      ? "btn btn-sm btn-secondary"
      : "btn btn-sm btn-primary"
  }
                        disabled={panchanama.VAR_NOTGEN_PAYMENTSTATUS === "Paid"}
                        onClick={() => {
                          renderPaymentModal(
                            panchanama.NUM_NOTGEN_AMT,
                            panchanama.VAR_NOTGEN_NO
                          );
                        }}
                      >
                        Pay
                      </button>
                        {/* <button
                          type="button"
                          className="btn btn-sm btn-primary"
                          onClick={() => handleViewDetails(panchanama)}
                        >
                          <i className="bi bi-eye me-1"></i>
                          View
                        </button> */}
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

      {showDetailsModal && renderDetailsModal()}

      {showPaymentModal && (
        <div
          className="modal show d-flex"
          tabIndex="-1"
          role="dialog"
          style={{
            backgroundColor: "rgba(0,0,0,0.8)",
            zIndex: 2200,
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <div
            className="modal-dialog"
            style={{
              width: "70vw",
              maxWidth: "90vw",
              height: "90vh",
              margin: 0,
            }}
          >
            <div
              className="modal-content"
              style={{
                border: "none",
                height: "100%",
              }}
            >
              <div className="modal-header">
                <h5 className="modal-title">वसुली</h5>
                <button
                  type="button"
                  className="btn-close"
                  aria-label="Close"
                  onClick={handlePaymentModalClose}
                ></button>
              </div>

              <div
                className="modal-body"
                style={{
                  overflowY: "auto",
                }}
              >
                <form onSubmit={handleSubmit(handlePayment)}>
                  <div className="row g-3">
                    <div className="col-12 col-md-6">
                      <label className="form-label">नोटीस क्रमांक</label>
                      <div className="d-flex gap-2">
                        <input
                          type="text"
                          className="form-control"
                          {...register("noticeNumber")}
                        />
                        {/* <button
                          type="button"
                          className="btn btn-sm btn-primary"
                          onClick={() => {
                            // handleNoticeSearch();
                          }}
                        >
                          शोधा
                        </button> */}
                      </div>
                      {errors.noticeNumber && (
                        <div className="field-error">
                          {errors.noticeNumber.message}
                        </div>
                      )}
                    </div>
                    <div className="col-12 col-md-6">
                      <label className="form-label">देयक प्रकार</label>
                      <select
                        className="form-select"
                        {...register("paymentType")}
                      >
                        <option value="">--SELECT--</option>
                        <option value="Cash">Cash</option>
                        <option value="Cheque">Cheque</option>
                        <option value="Online">Online</option>
                        <option value="UPI">UPI</option>
                      </select>
                      {errors.paymentType && (
                        <div className="field-error">
                          {errors.paymentType.message}
                        </div>
                      )}
                    </div>
                    <div className="col-12 col-md-6">
                      <label className="form-label">
                        रक्कम
                        <span className="required">*</span>
                      </label>
                     <input
                        type="text"
                        className={`form-control ${errors.amount ? "is-invalid" : ""}`}
                        onInput={(e) => {
                          e.target.value = e.target.value
                            .replace(/[^0-9.]/g, "")       // Only numbers and decimal point
                            .replace(/(\..*)\./g, "$1")    // Only one decimal point
                            .replace(/^(\d+\.?\d{0,2}).*$/, "$1"); // Max 2 decimals
                        }}
                        {...register("amount", {
                          required: "Amount is required",
                        })}
                      />
                      {errors.amount && (
                        <div className="field-error">
                          {errors.amount.message}
                        </div>
                      )}
                    </div>
                    <div className="col-12 col-md-6">
                      <label className="form-label">
                        बँकेचे नाव
                        {/* <span className="required">*</span> */}
                      </label>
                      <input
                        type="text"
                        className="form-control"
                        {...register("bankName")}
                        disabled={
                          paymentType === "Cash" ||
                          paymentType === "UPI" ||
                          paymentType === ""
                        }
                      />
                    </div>
                    <div className="col-12 col-md-6">
                      <label className="form-label">शाखा</label>
                      <input
                        type="text"
                        className="form-control"
                        {...register("branch")}
                        disabled={
                          paymentType === "Cash" ||
                          paymentType === "UPI" ||
                          paymentType === ""
                        }
                      />
                    </div>
                    <div className="col-12 col-md-6">
                      <label className="form-label">धनादेश क्र.</label>
                      <div className="d-flex gap-2">
                        <input
                          type="text"
                          className="form-control"
                          {...register("chequeNumber")}
                          onInput={(e) => {
                            e.target.value = e.target.value.replace(/\D/g, "");
                          }}
                          disabled={
                            paymentType === "Cash" ||
                            paymentType === "Online" ||
                            paymentType === "UPI" ||
                            paymentType === ""
                          }
                        />
                      </div>
                    </div>
                    <div className="col-12 col-md-6">
                      <label className="form-label">धनादेश दिनांक</label>
                      <input
                        type="date"
                        className="form-control"
                        {...register("chequeDate")}
                        disabled={
                          paymentType === "Cash" ||
                          paymentType === "Online" ||
                          paymentType === "UPI" ||
                          paymentType === ""
                        }
                      />
                    </div>
                    <div className="col-12 col-md-6">
                      <label className="form-label">शेरा</label>
                      <input
                        type="text"
                        className="form-control"
                        {...register("remarks")}
                      />
                    </div>
                    <div className="col-12 col-md-6">
                      <label className="form-label">MICR Code</label>
                      <input
                        type="text"
                        className="form-control"
                        {...register("micrCode")}
                        onInput={(e) => {
                          e.target.value = e.target.value.replace(/\D/g, "");
                        }}
                        disabled={
                          paymentType === "Cash" ||
                          paymentType === "Online" ||
                          paymentType === "UPI" ||
                          paymentType === ""
                        }
                      />
                    </div>
                    <div className="col-12 col-md-6">
                      <label className="form-label">धनादेश प्रकार</label>
                      <input
                        type="text"
                        className="form-control"
                        {...register("chequeType")}
                        disabled={
                          paymentType === "Cash" ||
                          paymentType === "Online" ||
                          paymentType === "UPI" ||
                          paymentType === ""
                        }
                      />
                    </div>
                    <div className="col-12 col-md-6">
                      <label className="form-label">Transation ID</label>
                      <input
                        type="text"
                        className="form-control"
                        {...register("transactionId")}
                        disabled={
                          paymentType === "Cash" ||
                          paymentType === "Cheque" ||
                          paymentType === ""
                        }
                      />
                    </div>
                    <div className="col-12 col-md-6">
                      <label className="form-label">
                        मोबाईल क्र.<span className="required">*</span>
                      </label>
                      <input
                        type="text"
                        maxLength={10}
                        className={`form-control ${errors.mobileNumber ? "is-invalid" : ""}`}
                        onInput={(e) => {
                          e.target.value = e.target.value.replace(/\D/g, "");
                        }}
                        {...register("mobileNumber", {
                          required: "Mobile Number is required",
                        })}
                      />
                      {errors.mobileNumber && (
                        <div className="field-error">
                          {errors.mobileNumber.message}
                        </div>
                      )}
                    </div>
                    <div className="col-12 col-md-6">
                      <label className="form-label">
                        ईमेल<span className="required">*</span>
                      </label>
                      <input
                        type="email"
                        className={`form-control ${errors.email ? "is-invalid" : ""}`}
                        {...register("email", {
                          required: "Email is required",
                        })}
                      />
                      {errors.email && (
                        <div className="field-error">
                          {errors.email.message}
                        </div>
                      )}
                    </div>
                    <div className="col-12 col-md-6">
                      <label className="form-label">
                        पत्ता<span className="required">*</span>
                      </label>
                      <input
                        type="text"
                        className={`form-control ${errors.address ? "is-invalid" : ""}`}
                        {...register("address", {
                          required: "Address is required",
                        })}
                      />
                      {errors.address && (
                        <div className="field-error">
                          {errors.address.message}
                        </div>
                      )}
                    </div>
                    <div className="col-12 col-md-6">
                      <label className="form-label">
                        नाव<span className="required">*</span>
                      </label>
                      <input
                        type="text"
                        className={`form-control ${errors.name ? "is-invalid" : ""}`}
                        {...register("name", {
                          required: "Name is required",
                        })}
                      />
                      {errors.name && (
                        <div className="field-error">{errors.name.message}</div>
                      )}
                    </div>
                    <div className="col-12 col-md-6">
                      <label className="form-label">वसुली रक्कम</label>
                      <input
                        type="text"
                        className={`form-control ${errors.recoveryAmount ? "is-invalid" : ""}`}
                        {...register("recoveryAmount", {
                          required: "Recovery Amount is required",
                        })}
                        onInput={(e) => {
                          e.target.value = e.target.value
                            .replace(/[^0-9.]/g, "")       // Only numbers and decimal point
                            .replace(/(\..*)\./g, "$1")    // Only one decimal point
                            .replace(/^(\d+\.?\d{0,2}).*$/, "$1"); // Max 2 decimals
                        }}
                      />
                      {errors.recoveryAmount && (
                        <div className="field-error">
                          {errors.recoveryAmount.message}
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="my-4 justify-content-center d-flex gap-2">
                    <button type="submit" className="btn btn-primary">
                      Pay
                    </button>
                    <button
                      type="button"
                      className="btn btn-secondary"
                      onClick={() => {
                        handlePaymentModalClose();
                      }}
                    >
                      Close
                    </button>
                  </div>
                </form>
              </div>
            </div>
          </div>
        </div>
      )}

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

export default BillList;
