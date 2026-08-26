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

const NoticeNirmitiReport = () => {
  const { user } = useAuth();
  const { setLoader } = useLoader();

  const [participants, setParticipants] = useState([]);
  const [error, setError] = useState(null);

  // Ward dropdown (1–19)
  const wardDropdown = Array.from({ length: 19 }, (_, i) => ({
    label: `Ward ${i + 1}`,
    value: String(i + 1),
  }));

  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalRecords, setTotalRecords] = useState(0);
  const [pageSize, setPageSize] = useState(10);

  // Filters
  const [filters, setFilters] = useState({
    fromDate: '',
    toDate: '',
    regionalOffice: "",
    ward: "",
    paymentStatus: "",
  });

  // Excel export
  const [excelData, setExcelData] = useState([]);
  const tableHeaders = [
    "अनुक्रमांक",
    "नोटीस क्र.",
    "नोटीस दिनांक",
    "नाव",
    "प्रभाग",
    "शुल्क",
    "पेमेंट स्थिती",
    "पेमेंट दिनांक",
  ];
  const keyMapping = {
    अनुक्रमांक: "noticeId",
    "नोटीस क्र.": "noticeNumber",
    "नोटीस दिनांक": "noticeDate",
    नाव: "name",
    प्रभाग: "ward",
    शुल्क: "amount",
    "पेमेंट स्थिती": "paymentStatus",
    "पेमेंट दिनांक": "paymentDate",
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
    setFilters({
      fromDate: "",
      toDate: "",
      regionalOffice: "",
      ward: "",
      paymentStatus: "",
    });
  };

  const fetchReportData = async (dataPage = 1) => {
    try {
      setLoader(true);
      setError(null);

      let url = `/report/getNoticeNirmitiReport?page=${dataPage}&limit=${pageSize}&ulbId=${import.meta.env.VITE_ULBID}&userId=${user.userId}`;

      if (filters.fromDate) {
        url += `&fromDate=${encodeURIComponent(filters.fromDate)}`;
      }
      if (filters.toDate) {
        url += `&toDate=${encodeURIComponent(filters.toDate)}`;
      }
      if (filters.regionalOffice) {
        url += `&officerDivision=${encodeURIComponent(filters.regionalOffice)}`;
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
          noticeId: item.NUM_NOTGEN_ID,
          noticeNumber: item.VAR_NOTGEN_NO,
          noticeDate: formatDateIntoStr(item.DT_NOTGEN_DATE),
          name: item.VAR_NOTGEN_DETAIL,
          ward: item.NUM_NOTGEN_WARD,
          amount: item.NUM_NOTGEN_AMT,
          paymentStatus: item.VAR_NOTGEN_PAYMENTSTATUS,
          paymentDate: item.PAYMENT_DATE,
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

  const formatDateIntoStr = (dateStr) => {
    if (!dateStr) {
      return "";
    }
    const date = dateStr.split("T")[0].split("-").reverse().join("-");
    const time = dateStr.split("T")[1].split(".")[0];
    return `${date} ${time}`;
  };

  return (
    <Layout>
      <div className="panel">
        {/* HEADER */}
        <div className="panel-header d-flex justify-content-between align-items-center">
          <div>
            <h2 className="h5 mb-1 section-title">
              <i className="bi bi-people me-2" aria-hidden="true"></i>
              <span>नोटीस निर्मिती अहवाल ({totalRecords})</span>
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

              {/* Regional Office */}
              <div className="col-auto">
                <label className="form-label mb-0 small">Regiona Office</label>
                <select
                  name="regionalOffice"
                  className="form-select form-select-sm"
                  style={{ width: "100px" }}
                  value={filters.regionalOffice}
                  onChange={handleFilterChange}
                >
                  <option value="">Select</option>
                  <option value="1">1</option>
                  <option value="2">2</option>
                  <option value="3">3</option>
                  <option value="4">4</option>
                </select>
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
                    <option key={item.value} value={item.value}>
                      {item.label}
                    </option>
                  ))}
                </select>
              </div>

              {/* Payment Status */}
              <div className="col-auto">
                <label className="form-label mb-0 small">Payment Status</label>
                <select
                  name="paymentStatus"
                  className="form-select form-select-sm"
                  style={{ width: "140px" }}
                  value={filters.paymentStatus}
                  onChange={handleFilterChange}
                >
                  <option value="">Payment Status</option>
                  <option value="Paid">Paid</option>
                  <option value="UnPaid">UnPaid</option>
                </select>
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
                <th>अनुक्रमांक</th>
                <th>नोटीस क्र.</th>
                <th>नोटीस दिनांक</th>
                <th>नाव</th>
                <th>प्रभाग</th>
                <th>शुल्क</th>
                <th>पेमेंट स्थिती</th>
                <th>पेमेंट दिनांक</th>
              </tr>
            </thead>
            <tbody>
              {participants.length > 0 ? (
                participants.map((participants, index) => (
                  <tr key={participants.NUM_NOTGEN_ID || index}>
                    <td>{participants.NUM_NOTGEN_ID || "-"}</td>
                    <td>{participants.VAR_NOTGEN_NO || "-"}</td>
                    <td>
                      {formatDateIntoStr(participants.DT_NOTGEN_DATE) || ""}
                    </td>
                    <td>{participants.VAR_NOTGEN_DETAIL || ""}</td>
                    <td>{participants.NUM_NOTGEN_WARD || ""}</td>
                    <td>{participants.NUM_NOTGEN_AMT || ""}</td>
                    <td>{participants.VAR_NOTGEN_PAYMENTSTATUS || ""}</td>
                    <td>{formatDateIntoStr(participants.PAYMENT_DATE)}</td>
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
    </Layout>
  );
};

export default NoticeNirmitiReport;
