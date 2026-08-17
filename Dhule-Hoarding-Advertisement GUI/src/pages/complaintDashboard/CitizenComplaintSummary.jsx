import React, { useState, useEffect } from "react";
import { Users, AlertCircle, Loader, CheckCircle2 } from "lucide-react";
import apiClient from "../../services/apiClient";
import { useLoader } from "../../context/LoaderContext";
import { useAuth } from "../../context/AuthContext";

const CitizenComplaintSummary = ({ filters }) => {
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

  const [data, setData] = useState({
    total: 0,
    open: 0,
    inProgress: 0,
    resolved: 0,
  });
  const [loading, setLoading] = useState(true);

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
      setLoader(false);
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
      console.error("Error fetching complaint summary:", err);
      setData({ total: 0, open: 0, inProgress: 0, resolved: 0 });
    } finally {
      setLoader(false);
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [ulbId, filters.fromDate, filters.toDate, filters.ward]);

  const total = data.total || 0;
  const cards = [
    {
      id: 0,
      label: "Total Complaints",
      value: total,
      sub: "All Complaints",
      icon: Users,
      colorClass: "card-blue",
    },
    {
      id: 1,
      label: "Open Complaints",
      value: data.open,
      sub: total > 0 ? `${((data.open / total) * 100).toFixed(1)}%` : "0%",
      icon: AlertCircle,
      colorClass: "card-red",
    },
    {
      id: 2,
      label: "In Progress Complaints",
      value: data.inProgress,
      sub:
        total > 0 ? `${((data.inProgress / total) * 100).toFixed(1)}%` : "0%",
      icon: Loader,
      colorClass: "card-orange",
    },
    {
      id: 3,
      label: "Resolved Complaints",
      value: data.resolved,
      sub: total > 0 ? `${((data.resolved / total) * 100).toFixed(1)}%` : "0%",
      icon: CheckCircle2,
      colorClass: "card-green",
    },
  ];

  // Format numbers with Indian locale
  const formatValue = (value) => value.toLocaleString("en-IN");

  if (loading) {
    return (
      <div className="row g-2">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="col-6 col-sm-4 col-md-3">
            <div className="summary-card" style={{ minHeight: "80px" }}>
              <div className="d-flex justify-content-center align-items-center h-100">
                <div
                  className="spinner-border spinner-border-sm text-secondary"
                  role="status"
                >
                  <span className="visually-hidden">Loading...</span>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className="row g-2">
      {cards.map(({ id, label, value, sub, icon: Icon, colorClass }) => (
        <div key={id} className="col-6 col-sm-4 col-md-3">
          <div className={`summary-card ${colorClass}`}>
            <div className="summary-card-icon">
              <Icon size={24} strokeWidth={1.8} />
            </div>
            <div className="summary-card-body">
              <span className="summary-card-label" style={{ fontSize: "13px" }}>
                {label}
              </span>
              <span className="summary-card-value" style={{ fontSize: "16px" }}>
                {formatValue(value)}
              </span>
              <span className="summary-card-sub" style={{ fontSize: "11px" }}>
                {sub}
              </span>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
};

export default CitizenComplaintSummary;
