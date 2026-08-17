import React, { useState, useEffect } from "react";
import apiClient from "../../services/apiClient";
import { useAuth } from "../../context/AuthContext";
import { useLoader } from "../../context/LoaderContext";

const DashboardFilter = ({ filters, onFilterChange, onClearFilters }) => {
  const { user } = useAuth();
  const { setLoader } = useLoader();
  const ulbId = user?.orgId;

  const [wardOptions, setWardOptions] = useState([]);
  const [vendorOptions, setVendorOptions] = useState([]);
  const [loading, setLoading] = useState(true);

  // const statusOptions = [
  //   { label: "All", value: "" },
  //   { label: "Pending", value: "P" },
  //   { label: "Assign", value: "ASSIGN" },
  //   { label: "Completed", value: "COMPLETED" },
  //   { label: "Approved", value: "APPROVED" },
  //   { label: "Rejected", value: "REJECTED" },
  // ];

  useEffect(() => {
    if (!ulbId) {
      return;
    }

    const fetchOptions = async () => {
      try {
        setLoader(true);
        const [wardRes, vendorRes] = await Promise.allSettled([
          apiClient.get(`/dashboard/wardList?ulbid=${ulbId}&userId=${user.userId}${user.designation ? `&userType=${user.designation}` : ""}`),
          apiClient.get(`/registerComplaint/vendorList?ulbid=${ulbId}`),
        ]);

        // Ward options
        if (wardRes.status === "fulfilled" && wardRes.value?.success) {
          const wards = wardRes.value.data.map((item) => ({
            label: `Ward ${item.NUM_CTPTTYPE_WARDID}`,
            value: String(item.NUM_CTPTTYPE_WARDID),
          }));
          setWardOptions(wards);
        } else {
          setWardOptions([]);
        }

        // Vendor options
        if (vendorRes.status === "fulfilled" && vendorRes.value?.success) {
          const vendors = vendorRes.value.data.map((item) => ({
            label: item.VAR_VENDOR_FORMNM,
            value: item.NUM_VENDOR_ID,
          }));
          setVendorOptions(vendors);
        } else {
          setVendorOptions([]);
        }
      } catch (err) {
        console.error("Error fetching filter options:", err);
        setWardOptions([]);
        setVendorOptions([]);
      } finally {
        setLoader(false);
      }
    };

    fetchOptions();
  }, [ulbId]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    onFilterChange(name, value);
  };

  return (
    <div className="dashboard-filter-bar">
      <div className="filter-group">
        <label htmlFor="fromDate">From</label>
        <input
          type="date"
          id="fromDate"
          name="fromDate"
          className="filter-input"
          value={filters.fromDate}
          onChange={handleChange}
        />
      </div>

      <div className="filter-group">
        <label htmlFor="toDate">To</label>
        <input
          type="date"
          id="toDate"
          name="toDate"
          className="filter-input"
          value={filters.toDate}
          onChange={handleChange}
        />
      </div>

      <div className="filter-group">
        <label htmlFor="ward">Ward</label>
        <select
          id="ward"
          name="ward"
          className="filter-select"
          value={filters.ward}
          onChange={handleChange}
        >
          <option value="">All</option>
          {wardOptions.map((opt) => (
            <option key={opt.value} value={opt.value}>
              {opt.label}
            </option>
          ))}
        </select>
      </div>

      <div className="filter-group">
        <label htmlFor="vendor">Vendor</label>
        <select
          id="vendor"
          name="vendor"
          className="filter-select"
          value={filters.vendor}
          onChange={handleChange}
        >
          <option value="">All</option>
          {vendorOptions.map((opt) => (
            <option key={opt.value} value={opt.value}>
              {opt.label}
            </option>
          ))}
        </select>
      </div>

      {/* <div className="filter-group">
        <label htmlFor="complaintStatus">Complaint Status</label>
        <select
          id="complaintStatus"
          name="complaintStatus"
          className="filter-select"
          value={filters.complaintStatus}
          onChange={handleChange}
        >
          {statusOptions.map((opt) => (
            <option key={opt.value} value={opt.value}>
              {opt.label}
            </option>
          ))}
        </select>
      </div> */}

      <div className="filter-group filter-actions">
        <button className="btn-clear-filters" onClick={onClearFilters}>
          <i className="bi bi-x-lg me-1"></i> Clear
        </button>
      </div>
    </div>
  );
};

export default DashboardFilter;
