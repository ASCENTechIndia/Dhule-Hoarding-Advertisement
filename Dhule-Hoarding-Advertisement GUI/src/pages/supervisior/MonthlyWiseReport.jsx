import Layout from "../../components/Layout";
import { useEffect, useState } from "react";
import apiClient from "../../services/apiClient";
import { useLoader } from "../../context/LoaderContext";
import ExcelExportButton from "../../components/ExcelExportButton";
import { useAuth } from "../../context/AuthContext";

const getCurrentYearMonth = () => {
  const now = new Date();
  return {
    year: now.getFullYear(),
    month: now.getMonth() + 1,
  };
};

const MonthlyWiseReport = () => {
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
  const current = getCurrentYearMonth();
  const [filters, setFilters] = useState({
    year: current.year,
    month: current.month,
  });

  // Excel data
  const [excelData, setExcelData] = useState([]);
  const tableHeaders = [
    "महिना",
    "एकूण नोटीस",
    "पंचनामे",
    "शुल्क भरले",
    "शुल्क ना भरले",
    "एकूण शुल्क ₹",
    "वसूल रक्कम ₹",
    "थकबाकी ₹",
  ];
  const keyMapping = {
    महिना: "month",
    "एकूण नोटीस": "totalNotices",
    पंचनामे: "totalPanchanama",
    "शुल्क भरले": "paid",
    "शुल्क ना भरले": "notPaid",
    "एकूण शुल्क ₹": "totalAmount",
    "वसूल रक्कम ₹": "collectedAmount",
    "थकबाकी ₹": "remainingAmount",
  };

  const yearOptions = Array.from({ length: 11 }, (_, i) => 2016 + i);
  const monthOptions = [
    { label: "All", value: 0 },
    { label: "Jan", value: 1 },
    { label: "Feb", value: 2 },
    { label: "Mar", value: 3 },
    { label: "Apr", value: 4 },
    { label: "May", value: 5 },
    { label: "Jun", value: 6 },
    { label: "Jul", value: 7 },
    { label: "Aug", value: 8 },
    { label: "Sep", value: 9 },
    { label: "Oct", value: 10 },
    { label: "Nov", value: 11 },
    { label: "Dec", value: 12 },
  ];

  const fetchReportData = async (dataPage = 1) => {
    try {
      setLoader(true);
      setError(null);

      let url = `/report/getIllegalHoardMonthwiseReport?page=${dataPage}&limit=${pageSize}&ulbId=${import.meta.env.VITE_ULBID}&userId=${user.userId}`;

      url += `&year=${filters.year}`;
      url += `&monthNo=${filters.month}`;

      const response = await apiClient.get(url);

      if (response?.success && response?.data) {
        const participantData = response.data.data || [];
        const pagination = response.data.pagination || {};

        const excelData = participantData.map((item) => ({
          month: item.PANCHANAMA_MONTH,
          totalNotices: item.TOTAL_NOTICE,
          totalPanchanama: item.TOTAL_PANCHANAMA,
          paid: item.TOTAL_NO_PAY,
          notPaid: item.TOTAL_NO_NOTPAY,
          totalAmount: item.NOTICE_AMOUNT,
          collectedAmount: item.COLLECTED_AMOUNT,
          remainingAmount: item.REMAINING_AMOUNT,
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

  const handleFilterChange = (e) => {
    const { name, value } = e.target;
    setFilters((prev) => ({
      ...prev,
      [name]: name === "year" ? Number(value) : Number(value),
    }));
  };

  const handleClearFilters = () => {
    const now = new Date();
    setFilters({
      year: now.getFullYear(),
      month: now.getMonth() + 1,
    });
  };

  return (
    <Layout>
      <div className="panel">
        {/* HEADER */}
        <div className="panel-header d-flex justify-content-between align-items-center">
          <div>
            <h2 className="h5 mb-1 section-title">
              <i className="bi bi-calendar3 me-2" aria-hidden="true"></i>
              <span>महिनानिहाय अहवाल ({totalRecords})</span>
            </h2>
            <p className="text-muted mb-0">संपूर्ण यादी पहा</p>
          </div>

          {/* FILTERS */}
          <div>
            <div className="row g-2 align-items-end justify-content-end">
              {/* Year */}
              <div className="col-auto">
                <label className="form-label mb-0 small">Year</label>
                <select
                  name="year"
                  className="form-select form-select-sm"
                  style={{ width: "120px" }}
                  value={filters.year}
                  onChange={handleFilterChange}
                >
                  {yearOptions.map((year) => (
                    <option key={year} value={year}>
                      {year}
                    </option>
                  ))}
                </select>
              </div>

              {/* Month */}
              <div className="col-auto">
                <label className="form-label mb-0 small">Month</label>
                <select
                  name="month"
                  className="form-select form-select-sm"
                  style={{ width: "120px" }}
                  value={filters.month}
                  onChange={handleFilterChange}
                >
                  {monthOptions.map((m) => (
                    <option key={m.value} value={m.value}>
                      {m.label}
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
                  fileName="MonthlyWiseReport.xlsx"
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
                <th>महिना</th>
                <th>एकूण नोटीस</th>
                <th>पंचनामे</th>
                <th>शुल्क भरले</th>
                <th>शुल्क ना भरले</th>
                <th>एकूण शुल्क ₹</th>
                <th>वसूल रक्कम ₹</th>
                <th>थकबाकी ₹</th>
              </tr>
            </thead>
            <tbody>
              {participants.length > 0 ? (
                participants.map((record, index) => (
                  <tr key={index}>
                    <td>{record.PANCHANAMA_MONTH || ""}</td>
                    <td>{record.TOTAL_NOTICE || 0}</td>
                    <td>{record.TOTAL_PANCHANAMA || 0}</td>
                    <td>{record.TOTAL_NO_PAY || 0}</td>
                    <td>{record.TOTAL_NO_NOTPAY || 0}</td>
                    <td>{record.NOTICE_AMOUNT || 0}</td>
                    <td>{record.COLLECTED_AMOUNT || 0}</td>
                    <td>{record.REMAINING_AMOUNT || 0}</td>
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

export default MonthlyWiseReport;
