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

const PanchanamaNirmitiReport = () => {
  const { user } = useAuth();
  const { setLoader } = useLoader();

  const [participants, setParticipants] = useState([]);
  const [error, setError] = useState(null);

  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalRecords, setTotalRecords] = useState(0);
  const [pageSize, setPageSize] = useState(10);

  // Ward dropdown (1–19)
  const wardDropdown = Array.from({ length: 19 }, (_, i) => ({
    label: `Ward ${i + 1}`,
    value: String(i + 1),
  }));

  // Officer Division dropdown
  const divisionDropdown = Array.from({ length: 5 }, (_, i) => ({
    label: `Division ${i + 1}`,
    value: String(i + 1),
  }));

  // Filters
  const [filters, setFilters] = useState({
    fromDate: getToday(),
    toDate: getToday(),
    officerDivision: "",
    ward: "",
  });

  // Excel data
  const [excelData, setExcelData] = useState([]);
  const tableHeaders = [
    "अ क्र",
    "पंचानाम क्र.",
    "पंचानाम दिनांक",
    "वेळ",
    "नोटीस क्र.",
    "नाव",
    "ठिकाण",
    "प्रभाग",
  ];
  const keyMapping = {
    "अ क्र": "id",
    "पंचानाम क्र.": "panchanamaNo",
    "पंचानाम दिनांक": "panchanamaDate",
    वेळ: "panchanamaTime",
    "नोटीस क्र.": "noticeNo",
    नाव: "name",
    ठिकाण: "address",
    प्रभाग: "ward",
  };

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

  const fetchReportData = async (dataPage = 1) => {
    try {
      setLoader(true);
      setError(null);

      let url = `/report/getPanchanamaNirmitiReport?page=${dataPage}&limit=${pageSize}&ulbId=${import.meta.env.VITE_ULBID}&userId=${user.userId}`;

      if (filters.fromDate)
        url += `&fromDate=${encodeURIComponent(filters.fromDate)}`;
      if (filters.toDate)
        url += `&toDate=${encodeURIComponent(filters.toDate)}`;
      if (filters.officerDivision)
        url += `&officerDivision=${encodeURIComponent(filters.officerDivision)}`;
      if (filters.ward) url += `&ward=${encodeURIComponent(filters.ward)}`;

      const response = await apiClient.get(url);

      if (response?.success && response?.data) {
        const participantData = response.data.data || [];
        const pagination = response.data.pagination || {};

        const excelData = participantData.map((item) => ({
          id: item.NUM_ILLEGALHOARD_ID,
          panchanamaNo: item.VAR_ILLEGALHOARD_PANCHANAMA_NO,
          panchanamaDate:
            formatDateTime(item.DAT_CAP_DT, "").split(" - ")[0] || "",
          panchanamaTime:
            formatDateTime(item.DAT_CAP_DT, item.VAR_CAP_TIME).split(
              " - ",
            )[1] || "",
          noticeNo: item.VAR_NOTGEN_NO,
          name: item.VAR_USER1,
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

  const handleDateChangeFilter = (e) => {
    const { name, value } = e.target;
    setFilters((prev) => ({ ...prev, [name]: value }));
  };

  const handleFilterChange = (e) => {
    const { name, value } = e.target;
    setFilters((prev) => ({ ...prev, [name]: value }));
  };

  const handleClearFilters = () => {
    setFilters({
      fromDate: "",
      toDate: "",
      officerDivision: "",
      ward: "",
    });
  };

  return (
    <Layout>
      <div className="panel">
        {/* HEADER */}
        <div className="panel-header d-flex justify-content-between align-items-center">
          <div>
            <h2 className="h5 mb-1 section-title">
              <i
                className="bi bi-file-earmark-text me-2"
                aria-hidden="true"
              ></i>
              <span>पंचानाम निर्मिती अहवाल ({totalRecords})</span>
            </h2>
            <p className="text-muted mb-0">संपूर्ण यादी पहा</p>
          </div>

          {/* FILTERS */}
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

              {/* Officer Division */}
              <div className="col-auto">
                <label className="form-label mb-0 small">
                  Officer Division
                </label>
                <select
                  name="officerDivision"
                  className="form-select form-select-sm"
                  style={{ width: "130px" }}
                  value={filters.officerDivision}
                  onChange={handleFilterChange}
                >
                  <option value="">Select Division</option>
                  {divisionDropdown.map((item) => (
                    <option key={item.value} value={item.value}>
                      {item.label}
                    </option>
                  ))}
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
                  fileName="PanchanamaNirmitiReport.xlsx"
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
                <th>पंचानाम क्र.</th>
                <th>पंचानाम दिनांक</th>
                <th>वेळ</th>
                <th>नोटीस क्र.</th>
                <th>नाव</th>
                <th>ठिकाण</th>
                <th>प्रभाग</th>
              </tr>
            </thead>
            <tbody>
              {participants.length > 0 ? (
                participants.map((record, index) => (
                  <tr key={record.NUM_ILLEGALHOARD_ID || index}>
                    <td>{record.NUM_ILLEGALHOARD_ID || ""}</td>
                    <td>{record.VAR_ILLEGALHOARD_PANCHANAMA_NO || ""}</td>
                    <td>
                      {formatDateTime(record.DAT_CAP_DT, "").split(" - ")[0] ||
                        "-"}
                    </td>
                    <td>
                      {formatDateTime(
                        record.DAT_CAP_DT,
                        record.VAR_CAP_TIME,
                      ).split(" - ")[1] || "-"}
                    </td>
                    <td>{record.VAR_NOTGEN_NO || ""}</td>
                    <td>{record.VAR_USER1 || ""}</td>
                    <td>{record.VAR_ILLEGALHOARD_ADD || ""}</td>
                    <td>{record.VAR_ILLEGALHOARD_WARD || ""}</td>
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
                      <div className="mt-2">No records found</div>
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
            of <strong>{totalRecords}</strong> records
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

export default PanchanamaNirmitiReport;
