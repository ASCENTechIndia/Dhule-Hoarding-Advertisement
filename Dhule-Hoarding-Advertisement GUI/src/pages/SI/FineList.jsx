import Layout from "../../components/Layout";
import { useState, useEffect } from "react";
import apiClient from "../../services/apiClient";
import ResponseModal from "../../components/ResponseModal";
import { useAuth } from "../../context/AuthContext";
import { useLoader } from "../../context/LoaderContext";

const FineList = () => {
  const { user } = useAuth();
  const ulbId = user?.orgId;

  const [applications, setApplications] = useState([]);
  const { setLoader } = useLoader();

  // Modal states
  const [showModal, setShowModal] = useState(false);
  const [selectedApplication, setSelectedApplication] = useState(null);
  const [breakdownData, setBreakdownData] = useState([]);
  const [breakdownLoading, setBreakdownLoading] = useState(false);

  // Response Modal
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalType, setModalType] = useState("info");
  const [modalTitle, setModalTitle] = useState("");
  const [modalMessage, setModalMessage] = useState("");

  // Pagination states
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalRecords, setTotalRecords] = useState(0);
  const pageSize = 10;

  // Filters (only date)
  const [dateFilter, setDateFilter] = useState({
    from: getTodayDate(),
    to: getTodayDate(),
  });

  function getTodayDate() {
    const today = new Date();
    const year = today.getFullYear();
    const month = String(today.getMonth() + 1).padStart(2, "0");
    const day = String(today.getDate()).padStart(2, "0");
    return `${year}-${month}-${day}`;
  }

  const fetchApplications = async (page = 1) => {
    if (!ulbId) {
      setModalMessage("UlbId is not set");
      return;
    }
    try {
      setLoader(true);
      const apiPage = page - 1;
      const params = new URLSearchParams();
      params.append("ulbid", ulbId);
      params.append("page", apiPage);
      params.append("limit", pageSize);
      if (dateFilter.from) params.append("fromDate", dateFilter.from);
      if (dateFilter.to) params.append("toDate", dateFilter.to);
      params.append("designation", user?.designation);
      params.append("userId", user?.userId);

      const response = await apiClient.get(
        `/report/get-fine-application-list?${params.toString()}`,
      );

      if (response.success && response.data) {
        setApplications(response.data.data);
        const returnedPage = response.data.pagination.page;
        setCurrentPage(returnedPage + 1);
        setTotalPages(response.data.pagination.totalPages);
        setTotalRecords(response.data.pagination.total);
      } else {
        setApplications([]);
        setTotalRecords(0);
        setTotalPages(1);
        setCurrentPage(1);
      }
    } catch (err) {
      console.error("Error fetching fine list:", err);
      setModalType("error");
      setModalTitle("Error");
      setModalMessage(
        "Failed to load fine applications. Please try again later.",
      );
      setIsModalOpen(true);
    } finally {
      setLoader(false);
    }
  };

  const fetchBreakdown = async (workId) => {
    if (!ulbId) return;
    try {
      setBreakdownLoading(true);
      setLoader(true);
      const response = await apiClient.get(
        `/report/get-fine-breakdown?ulbid=${ulbId}&workId=${workId}`,
      );
      if (response.success && response.data?.data?.data) {
        setBreakdownData(response.data.data.data);
      } else {
        setBreakdownData([]);
      }
    } catch (err) {
      console.error("Error fetching breakdown:", err);
      setBreakdownData([]);
    } finally {
      setBreakdownLoading(false);
      setLoader(false);
    }
  };

  useEffect(() => {
    if (ulbId) {
      fetchApplications(1);
    }
  }, [ulbId]);

  useEffect(() => {
    if (ulbId) {
      fetchApplications(1);
    }
  }, [dateFilter]);

  const handleDateChangeFilter = (e) => {
    const { name, value } = e.target;
    setDateFilter((prev) => ({ ...prev, [name]: value }));
  };

  const handleClearFilters = () => {
    setDateFilter({ from: "", to: "" });
  };

  const handlePageChange = (newPage) => {
    if (newPage >= 1 && newPage <= totalPages) {
      setCurrentPage(newPage);
      fetchApplications(newPage);
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

  const handleReviewClick = async (application) => {
    setSelectedApplication(application);
    setBreakdownData([]);
    setShowModal(true);
    await fetchBreakdown(application.WORK_ID);
  };

    const formatDate = (dateString) => {
  if (!dateString) return "";

  const [year, month, day] = dateString.split("T")[0].split("-");
  return `${day}/${month}/${year}`;
};

  const totalBreakdownFine = breakdownData.reduce(
    (sum, item) => sum + (item.FINE_AMT || 0),
    0,
  );

  return (
    <Layout>
      <div className="panel">
        <div className="panel-header d-flex justify-content-between flex-wrap gap-3">
          <div>
            <h2 className="h5 mb-1 section-title">
              <i className="bi bi-file-earmark-text" aria-hidden="true"></i>
              <span>Fine Applications ({applications.length})</span>
            </h2>
            <p className="text-muted mb-0">
              View and manage fines related to work orders.
            </p>
          </div>
          <div>
            <div className="filter-bar">
              <div className="filter-group">
                <label>From</label>
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
                <label>To</label>
                <input
                  type="date"
                  name="to"
                  className="filter-input"
                  style={{ width: "150px" }}
                  value={dateFilter.to}
                  onChange={handleDateChangeFilter}
                />
              </div>
              <div className="filter-group" style={{ justifyContent: "flex-end" }}>
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

        {/* Main table */}
        <div
          className="table-responsive"
          style={{ maxHeight: "500px", overflowY: "auto" }}
        >
          <table className="table align-middle mb-0">
            <thead
              style={{ position: "sticky", top: 0, zIndex: 1, background: "#fff" }}
            >
              <tr>
                <th scope="col" className="text-center" style={{ minWidth: "90px" }}>
                  Work ID
                </th>
                <th scope="col" className="text-center" style={{ minWidth: "90px" }}>
                  Ward ID
                </th>
                <th scope="col" className="text-center" style={{ minWidth: "160px" }}>
                  Toilet Location
                </th>
                <th scope="col" className="text-center" style={{ minWidth: "120px" }}>
                  Supervisor ID
                </th>
                <th scope="col" className="text-center" style={{ minWidth: "90px" }}>
                  SI ID
                </th>
                <th scope="col" className="text-center" style={{ minWidth: "150px" }}>
                  Work Date
                </th>
                <th scope="col" className="text-center" style={{ minWidth: "130px" }}>
                  Total Fine (₹)
                </th>
                <th scope="col" className="text-center" style={{ minWidth: "130px" }}>
                  Action
                </th>
              </tr>
            </thead>
            <tbody>
              {applications.length === 0 ? (
                <tr>
                  <td colSpan="8" className="text-center text-muted py-4">
                    No records found.
                  </td>
                </tr>
              ) : (
                applications.map((app) => (
                  <tr key={app.WORK_ID}>
                    <td className="fw-semibold text-center">{app.WORK_ID}</td>
                    <td className="text-center">{app.WARD_ID}</td>
                    <td className="text-center">{app.TOILET_LOCATION}</td>
                    <td className="text-center">{app.SUPERID || "—"}</td>
                    <td className="text-center">{app.SIID || "—"}</td>
                    <td className="text-center">{formatDate(app.WORK_DATE)}</td>
                    <td className="text-center fw-semibold text-danger">
                      ₹{app.TOTAL_FINE?.toLocaleString() || 0}
                    </td>
                    <td className="text-center">
                      <button
                        className="btn btn-sm btn-outline-primary"
                        onClick={() => handleReviewClick(app)}
                        style={{ whiteSpace: "nowrap" }}
                      >
                        <i className="bi bi-eye me-1"></i> View Details
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {totalRecords > 0 && (
          <div className="d-flex align-items-center justify-content-between mt-4 flex-wrap gap-2">
            <div className="text-muted small">
              Showing{" "}
              <strong>{(currentPage - 1) * pageSize + 1}</strong> to{" "}
              <strong>{Math.min(currentPage * pageSize, totalRecords)}</strong>{" "}
              of <strong>{totalRecords}</strong> applications
            </div>
            <nav aria-label="Page navigation">
              <ul className="pagination mb-0">
                <li className={`page-item ${currentPage === 1 ? "disabled" : ""}`}>
                  <button
                    className="page-link"
                    onClick={() => handlePageChange(1)}
                    disabled={currentPage === 1}
                  >
                    <i className="bi bi-chevron-double-left"></i>
                  </button>
                </li>
                <li className={`page-item ${currentPage === 1 ? "disabled" : ""}`}>
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
        )}
      </div>

      {/* Review Modal with Breakdown Table */}
      {showModal && selectedApplication && (
        <div
          className="modal show d-block"
          tabIndex="-1"
          role="dialog"
          style={{ backgroundColor: "rgba(0,0,0,0.5)" }}
        >
          <div className="modal-dialog modal-xl modal-dialog-centered">
            <div className="modal-content">
              <div className="modal-header">
                <h5 className="modal-title mb-0">
                  <i className="bi bi-file-earmark-check me-2"></i>
                  Work Details #{selectedApplication.WORK_ID}
                </h5>
                <button
                  type="button"
                  className="btn-close"
                  onClick={() => setShowModal(false)}
                ></button>
              </div>
              <div className="modal-body">
                <h6 className="mb-3">
                  <i className="bi bi-list-ul me-2"></i>Fine Breakdown
                </h6>

                {breakdownLoading ? (
                  <div className="text-center py-4">
                    <div
                      className="spinner-border spinner-border-sm text-primary"
                      role="status"
                    >
                      <span className="visually-hidden">Loading...</span>
                    </div>
                    <p className="text-muted mt-2">Loading breakdown...</p>
                  </div>
                ) : breakdownData.length === 0 ? (
                  <p className="text-muted">No breakdown records found.</p>
                ) : (
                  <div
                    className="table-responsive"
                    style={{ maxHeight: "350px", overflowY: "auto" }}
                  >
                    <table className="table table-bordered table-striped table-hover align-middle mb-0">
                      <thead
                        style={{
                          position: "sticky",
                          top: 0,
                          zIndex: 1,
                          background: "#f8f9fa",
                        }}
                      >
                        <tr>
                          <th className="text-center" style={{ minWidth: "150px" }}>
                            Date
                          </th>
                          <th className="text-center" style={{ minWidth: "90px" }}>
                            Work ID
                          </th>
                          <th className="text-center" style={{ minWidth: "90px" }}>
                            Ward ID
                          </th>
                          <th className="text-center" style={{ minWidth: "160px" }}>
                            Toilet Location
                          </th>
                          <th className="text-center" style={{ minWidth: "120px" }}>
                            Supervisor ID
                          </th>
                          <th className="text-center" style={{ minWidth: "80px" }}>
                            SI ID
                          </th>
                          <th className="text-center" style={{ minWidth: "110px" }}>
                            Fine (₹)
                          </th>
                        </tr>
                      </thead>
                      <tbody>
                        {breakdownData.map((item, index) => (
                          <tr key={index}>
                            <td className="text-center">
                              {formatDate(item.DAT_CTPTWORKLOG_DATE)}
                            </td>
                            <td className="text-center">
                              {item.NUM_EMPCTPTWORK_ID}
                            </td>
                            <td className="text-center">
                              {item.NUM_CTPTTYPE_WARDID}
                            </td>
                            <td className="text-center">
                              {item.TOILET_LOCATION}
                            </td>
                            <td className="text-center">
                              {item.SUPERID || "—"}
                            </td>
                            <td className="text-center">
                              {item.SIID || "—"}
                            </td>
                            <td className="text-center fw-semibold text-danger">
                              ₹{item.FINE_AMT?.toLocaleString() || 0}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                      <tfoot className="table-active fw-bold">
                        <tr>
                          <td colSpan="6" className="text-end">
                            <i className="bi bi-calculator me-2"></i>Total Fine
                          </td>
                          <td className="text-center text-danger">
                            ₹{totalBreakdownFine.toLocaleString()}
                          </td>
                        </tr>
                      </tfoot>
                    </table>
                  </div>
                )}
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

export default FineList;