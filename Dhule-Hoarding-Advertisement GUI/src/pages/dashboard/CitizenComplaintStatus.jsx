import React, { useState, useEffect } from "react";
import { AlertCircle, Loader, CheckCircle2, Users } from "lucide-react";
import apiClient from "../../services/apiClient";
import { useLoader } from "../../context/LoaderContext";
import { useAuth } from "../../context/AuthContext";

const CitizenComplaintStatus = ({ filters }) => {
  const { user } = useAuth();
  const ulbId = user?.orgId || "";
  const userId = user?.userId || "";
  const userType = !user.designation
    ? "ADMIN"
    : user.designation === "Sanitary Inspector"
      ? "SI"
      : "SUP";
  const { setLoader } = useLoader();

  const [data, setData] = useState({
    total: 0,
    open: 0,
    inProgress: 0,
    resolved: 0,
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Format date from YYYY-MM-DD to DD-MM-YYYY
  const formatDateForApi = (dateStr) => {
    if (!dateStr) return "";
    const parts = dateStr.split("-");
    if (parts.length !== 3) return dateStr;
    return `${parts[2]}-${parts[1]}-${parts[0]}`;
  };

  const fetchData = async () => {
    if (!ulbId) {
      setLoading(false);
      return;
    }
    try {
      setLoader(true);
      setLoading(true);
      const params = new URLSearchParams();
      params.append("ulbId", ulbId);
      params.append("userId", userId);
      params.append("fromDate", formatDateForApi(filters.fromDate) || "");
      params.append("toDate", formatDateForApi(filters.toDate) || "");
      params.append("userType", userType);
      if (filters.ward) params.append("ward", filters.ward);

      const response = await apiClient.get(
        `/dashboard/citizen-complaint-status?${params.toString()}`,
      );

      if (response.success && response.data?.data) {
        const d = response.data.data;
        setData({
          total: d.TOTAL_COMPLAINTS || 0,
          open: d.OPEN_COMPLAINTS || 0,
          inProgress: d.IN_PROGRESS_COMPLAINTS || 0,
          resolved: d.RESOLVED_COMPLAINTS || 0,
        });
      } else {
        setData({ total: 0, open: 0, inProgress: 0, resolved: 0 });
      }
    } catch (err) {
      console.error("Error fetching complaint status:", err);
      setData({ total: 0, open: 0, inProgress: 0, resolved: 0 });
    } finally {
      setLoader(false);
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [ulbId, filters.fromDate, filters.toDate, filters.ward]);

  // Build items array with percentages
  const total = data.total || 0;
  const items = [
    {
      label: "Open Complaints",
      count: data.open,
      pct: total > 0 ? (data.open / total) * 100 : 0,
      icon: AlertCircle,
      colorClass: "complaint-red",
    },
    {
      label: "In Progress Complaints",
      count: data.inProgress,
      pct: total > 0 ? (data.inProgress / total) * 100 : 0,
      icon: Loader,
      colorClass: "complaint-yellow",
    },
    {
      label: "Resolved Complaints",
      count: data.resolved,
      pct: total > 0 ? (data.resolved / total) * 100 : 0,
      icon: CheckCircle2,
      colorClass: "complaint-green",
    },
  ];

  const now = new Date();
  const lastUpdated = now.toLocaleString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    hour12: true,
  });

  if (loading) {
    return (
      <div className="complaint-card">
        <h6 className="complaint-title">Citizen Complaint Status</h6>
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

  return (
    <div className="complaint-card">
      <h6 className="complaint-title">Citizen Complaint Status</h6>

      <div className="d-flex">
        <div className="complaint-hero">
          <div className="complaint-icon-wrap">
            <Users size={36} strokeWidth={1.5} color="#7C3AED" />
          </div>
          <div className="complaint-total-label text-center">
            Total Complaints
          </div>
          <div className="complaint-total-value">{total}</div>
        </div>
        <div className="complaint-items">
          {items.map(({ label, count, pct, icon: Icon, colorClass }) => (
            <div key={label} className={`complaint-item ${colorClass}`}>
              <div className="complaint-item-icon">
                <Icon size={18} strokeWidth={2} />
              </div>
              <div className="complaint-item-label">{label}</div>
              <div className="complaint-item-count">
                {count} ({pct.toFixed(1)}%)
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="complaint-updated">Last Updated: {lastUpdated}</div>
    </div>
  );
};

export default CitizenComplaintStatus;
