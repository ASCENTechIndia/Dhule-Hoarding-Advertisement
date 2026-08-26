import Layout from "../../components/Layout";
import { useEffect, useState } from "react";
import apiClient from "../../services/apiClient";
import { useLoader } from "../../context/LoaderContext";
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

  const [isFetching, setIsFetching] = useState(false);

  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalRecords, setTotalRecords] = useState(0);
  const [pageSize, setPageSize] = useState(10);

  const [wardDropdown, setWardDropdown] = useState(
    Array.from({ length: 19 }, (_, i) => ({
      label: `Ward ${i + 1}`,
      value: String(i + 1),
    })),
  );

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

  // Excel export
  const [excelData, setExcelData] = useState([]);
  const tableHeaders = [
    "अ क्र",
    "नोटीस क्र.",
    "नाव",
    "प्रभाग",
    "एकूण शुल्क",
    "पेमेंट स्तिथी",
    "पेमेंट दिनांक",
    "पेमेंट पद्धत",
    "Transaction ID",
  ];
  const keyMapping = {
    "अ क्र": "noticeId",
    "नोटीस क्र.": "noticeNumber",
    "नाव": "name",
    "प्रभाग": "ward",
    "एकूण शुल्क": "amount",
    "पेमेंट स्तिथी": "paymentStatus",
    "पेमेंट दिनांक": "paymentDate",
    "पेमेंट पद्धत": "paymentMethod",
    "Transaction ID": "transactionId",
  };

  const handleDateChangeFilter = (e) => {
    const { name, value } = e.target;
    setFilters((prev) => ({ ...prev, [name]: value }));
  };

  // Generic handler for dropdowns
 const handleFilterChange = (e) => {
  const { name, value } = e.target;

  // Clear old table data immediately
  setParticipants([]);
  setExcelData([]);

  // Reset pagination
  setCurrentPage(1);
  setTotalPages(1);
  setTotalRecords(0);

  // Clear previous error
  setError(null);

  // Update filter
  setFilters((prev) => ({
    ...prev,
    [name]: value,
  }));
};
 const handleClearFilters = () => {
  // Clear old data immediately
  setParticipants([]);
  setExcelData([]);

  // Reset pagination
  setCurrentPage(1);
  setTotalPages(1);
  setTotalRecords(0);

  // Clear notice input
  setNoticeNoInput("");

  // Clear filters
  setFilters({
    fromDate: "",
    toDate: "",
    noticeNo: "",
    ward: "",
    paymentStatus: "",
  });

  setError(null);
};

  const formatDateIntoStr = (dateStr) => {
    if (!dateStr) {
      return "";
    }
    const date = dateStr.split("-").reverse().join("-");
    return date;
  };

  const fetchReportData = async (dataPage = 1) => {
  try {
    setIsFetching(true);
    setLoader(true);
    setError(null);

    let url =
      `/report/getNoticePaymentReport` +
      `?page=${dataPage}` +
      `&limit=${pageSize}` +
      `&ulbId=${import.meta.env.VITE_ULBID}` +
      `&userId=${user.userId}`;

    if (filters.fromDate) {
      url += `&fromDate=${encodeURIComponent(filters.fromDate)}`;
    }

    if (filters.toDate) {
      url += `&toDate=${encodeURIComponent(filters.toDate)}`;
    }

    if (filters.noticeNo) {
      url += `&notgenNo=${encodeURIComponent(filters.noticeNo)}`;
    }

    if (filters.ward) {
      url += `&ward=${encodeURIComponent(filters.ward)}`;
    }

    if (filters.paymentStatus && filters.paymentStatus !== "all") {
      url += `&payMode=${encodeURIComponent(filters.paymentStatus)}`;
    }

    console.log("Notice Payment API URL:", url);

    const response = await apiClient.get(url);

    console.log("Notice Payment API Response:", response);

    if (response?.success) {
      const participantData = response?.data?.data || [];
      const pagination = response?.data?.pagination || {};

      // ============================================
      // API SUCCESS BUT NO DATA
      // ============================================

      if (participantData.length === 0) {
        setParticipants([]);
        setExcelData([]);

        setCurrentPage(1);
        setTotalPages(1);
        setTotalRecords(0);

        return;
      }

      // ============================================
      // API SUCCESS WITH DATA
      // ============================================

      const newExcelData = participantData.map((item) => ({
        noticeId: item.NUM_NOTGEN_ID,
        noticeNumber: item.VAR_NOTGEN_NO,
        name: item.VAR_NOTGEN_DETAIL,
        ward: item.NUM_NOTGEN_WARD,
        amount: item.NUM_ILLEGALHOARD_COLL_AMT,
        paymentStatus: item.VAR_NOTGEN_PAYMENTSTATUS,
        paymentDate: formatDateIntoStr(item.PAYMENT_DATE),
        paymentMethod: item.NUM_ILLEGALHOARD_PAYMODE,
        transactionId: item.VAR_ILLEGALHOARD_TRANID,
      }));

      // Replace old data with new data
      setParticipants(participantData);
      setExcelData(newExcelData);

      setCurrentPage(Number(pagination.page) || dataPage);
      setTotalPages(Number(pagination.totalPages) || 1);
      setTotalRecords(Number(pagination.total) || 0);
    } else {
      // API response unsuccessful
      setParticipants([]);
      setExcelData([]);

      setCurrentPage(1);
      setTotalPages(1);
      setTotalRecords(0);

      setError(
        response?.message || "Failed to fetch notice payment report"
      );
    }
  } catch (err) {
    console.error("Error fetching notice payment report:", err);

    setParticipants([]);
    setExcelData([]);

    setCurrentPage(1);
    setTotalPages(1);
    setTotalRecords(0);

    setError(
      err?.response?.data?.message ||
      err?.message ||
      "Failed to fetch notice payment report"
    );
  } finally {
    setIsFetching(false);
    setLoader(false);
  }
};

useEffect(() => {
  const handler = setTimeout(() => {
    setFilters((prev) => ({
      ...prev,
      noticeNo: noticeNoInput,
    }));
  }, 500);

  return () => {
    clearTimeout(handler);
  };
}, [noticeNoInput]);

  useEffect(() => {
    fetchReportData(1);
  }, [filters, pageSize]);

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
                  onChange={handleFilterChange}
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
                  onChange={handleFilterChange}
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
                  {wardDropdown.map((item) => (
                    <option value={item.value} key={item.value}>
                      {item.label}
                    </option>
                  ))}
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
                  <option value="">All</option>
                  <option value="Cash">Cash</option>
                  <option value="Cheque">Cheque</option>
                  <option value="Online">Online</option>
                  <option value="Card">Card</option>
                  <option value="Upi">UPI</option>
                </select>
              </div>

              {/* Notice No */}
              <div className="col-auto d-flex flex-column">
                <label className="form-label mb-0 small">Notice No</label>
                <input
  type="text"
  name="noticeNo"
  value={noticeNoInput}
  onChange={(e) => {
    const value = e.target.value;

    setNoticeNoInput(value);

    // Immediately clear old data
    setParticipants([]);
    setExcelData([]);

    setCurrentPage(1);
    setTotalPages(1);
    setTotalRecords(0);
    setError(null);
  }}
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
                  fileName="NoticePaymentReport.xlsx"
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
                <th>पेमेंट स्तिथी</th>
                <th>पेमेंट दिनांक</th>
                <th>पेमेंट पद्धत</th>
                <th>Transaction ID</th>
              </tr>
            </thead>
            <tbody>
              {participants.length > 0 ? (
                participants.map((record, index) => (
                  <tr key={record.NUM_NOTGEN_ID || index}>
                    <td>{record.NUM_NOTGEN_ID || ""}</td>
                    <td>{record.VAR_NOTGEN_NO || ""}</td>
                    <td>{record.VAR_NOTGEN_DETAIL || ""}</td>
                    <td>{record.NUM_NOTGEN_WARD || ""}</td>
                    <td>{record.NUM_ILLEGALHOARD_COLL_AMT || ""}</td>
                    <td>{record.VAR_NOTGEN_PAYMENTSTATUS || ""}</td>
                    <td>{formatDateIntoStr(record.PAYMENT_DATE)}</td>
                    <td>{record.NUM_ILLEGALHOARD_PAYMODE || ""}</td>
                    <td>{record.VAR_ILLEGALHOARD_TRANID || ""}</td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="9" className="text-center text-muted py-5">
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
  // Clear old data
  setParticipants([]);
  setExcelData([]);

  // Reset pagination
  setCurrentPage(1);
  setTotalPages(1);
  setTotalRecords(0);

  // New page size
  setPageSize(Number(e.target.value));
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
    </Layout>
  );
};

export default NoticePaymentReport;
