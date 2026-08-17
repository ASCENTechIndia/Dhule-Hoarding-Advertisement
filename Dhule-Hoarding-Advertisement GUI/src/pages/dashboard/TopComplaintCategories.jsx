import React, { useState, useEffect } from "react";
import apiClient from "../../services/apiClient";
import { useLoader } from "../../context/LoaderContext";
import { useAuth } from "../../context/AuthContext";

const TopComplaintCategories = ({ filters }) => {
  const { user } = useAuth();
  const ulbId = user?.orgId || "";
  const userId = user?.userId || "";
  const userType = !user.designation
  ? "ADMIN"
  : user.designation === "Sanitary Inspector"
    ? "SI"
    : user.designation === "Vendor"
      ? "ADMIN"
      : "SUP";
  const { setLoader } = useLoader();

  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [total, setTotal] = useState(0);
  const [maxPct, setMaxPct] = useState(0);

  const formatDateForApi = (dateStr) => {
    if (!dateStr) return "";
    const parts = dateStr.split("-");
    if (parts.length !== 3) return dateStr;
    return `${parts[2]}-${parts[1]}-${parts[0]}`;
  };

  const fetchData = async () => {
    if (!ulbId || !userId) {
      setLoading(false);
      setLoader(false);
      return;
    }
    try {
      setLoader(true);
      setLoading(true);

      const params = new URLSearchParams();
      params.append("ulbId", ulbId);
      params.append("userId", userId);
      params.append("fromDate", formatDateForApi(filters.fromDate));
      params.append("toDate", formatDateForApi(filters.toDate));
      if (filters.ward) params.append("ward", filters.ward);
      params.append("userType", userType);
      const response = await apiClient.get(
        `/dashboard/top-complaint-category?${params.toString()}`,
      );

      if (response.success && Array.isArray(response.data?.data)) {
        const items = response.data.data;
        // Calculate total
        const totalCount = items.reduce(
          (sum, item) => sum + (item.COMPLAINT_COUNT || 0),
          0,
        );
        setTotal(totalCount);

        // Map data with percentages
        const mapped = items.map((item) => ({
          id: item.COMPLAINTTYPE_ID,
          category: item.COMPAINTTYPE,
          count: item.COMPLAINT_COUNT || 0,
          pct: totalCount > 0 ? (item.COMPLAINT_COUNT / totalCount) * 100 : 0,
        }));

        setData(mapped);
        const maxPctValue =
          mapped.length > 0 ? Math.max(...mapped.map((d) => d.pct)) : 0;
        setMaxPct(maxPctValue);
      } else {
        setData([]);
        setTotal(0);
        setMaxPct(0);
      }
    } catch (err) {
      console.error("Error fetching top complaint categories:", err);
      setData([]);
      setTotal(0);
      setMaxPct(0);
    } finally {
      setLoader(false);
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [ulbId, userId, filters.fromDate, filters.toDate, filters.ward]);

  if (loading) {
    return (
      <div className="tcc-card">
        <h6 className="tcc-title">Top Complaint Categories</h6>
        <div className="d-flex justify-content-center py-4">
          <div
            className="spinner-border spinner-border-sm text-primary"
            role="status"
          >
            <span className="visually-hidden">Loading...</span>
          </div>
        </div>
      </div>
    );
  }

  if (data.length === 0) {
    return (
      <div className="tcc-card">
        <h6 className="tcc-title">Top Complaint Categories</h6>
        <p className="text-muted text-center py-3 m-0">No data available</p>
      </div>
    );
  }

  return (
    <div className="tcc-card">
      <h6 className="tcc-title">Top Complaint Categories</h6>
      <div style={{ height: "auto", maxHeight: "350px", overflowY: "auto" }}>
        <table className="tcc-table">
          <thead>
            <tr>
              <th>Complaint ID</th>
              <th className="text-left">Category</th>
              <th className="text-center">Total Complaints</th>
              <th className="text-center">Percentage</th>
            </tr>
          </thead>
          <tbody>
            {data.map(({ id, category, count, pct }) => (
              <tr key={id}>
                <td className="tcc-rank">{id}</td>
                <td className="tcc-category">{category}</td>
                <td className="tcc-count">{count}</td>
                <td className="tcc-pct-cell">
                  <div className="tcc-bar-wrap">
                    <div
                      className="tcc-bar"
                      style={{ width: `${(pct / maxPct) * 100}%` }}
                    />
                  </div>
                  <span className="tcc-pct-label">{pct.toFixed(1)}%</span>
                </td>
              </tr>
            ))}
          </tbody>
          <tfoot>
            <tr className="tcc-total-row">
              <td colSpan={2}>Total</td>
              <td>{total}</td>
              <td>100%</td>
            </tr>
          </tfoot>
        </table>
      </div>
    </div>
  );
};

export default TopComplaintCategories;
