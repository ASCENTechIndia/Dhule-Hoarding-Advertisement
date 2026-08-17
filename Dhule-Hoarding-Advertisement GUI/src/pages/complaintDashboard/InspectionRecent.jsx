import React, { useState, useEffect } from "react";
import apiClient from "../../services/apiClient";
import { useLoader } from "../../context/LoaderContext";
import { useAuth } from "../../context/AuthContext";
import { useNavigate } from "react-router-dom";

const InspectionRecent = ({ filters }) => {
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

  const [inspections, setInspections] = useState([]);
  const [loading, setLoading] = useState(true);
  const Navigate = useNavigate();

  // Format date from YYYY-MM-DD to DD-MM-YYYY for API
  const formatDateForApi = (dateStr) => {
    if (!dateStr) return "";
    const parts = dateStr.split("-");
    if (parts.length !== 3) return dateStr;
    return `${parts[2]}-${parts[1]}-${parts[0]}`;
  };

  // Format ISO date to "DD MMM YYYY" for display
  const formatDisplayDate = (isoDate) => {
    if (!isoDate) return "";
    const date = new Date(isoDate);
    const day = date.getDate();
    const months = [
      "Jan",
      "Feb",
      "Mar",
      "Apr",
      "May",
      "Jun",
      "Jul",
      "Aug",
      "Sep",
      "Oct",
      "Nov",
      "Dec",
    ];
    const month = months[date.getMonth()];
    const year = date.getFullYear();
    return `${day} ${month} ${year}`;
  };

  // Map status to badge class
  const getStatusBadge = (status) => {
    const map = {
      APPROVE: { label: "Approved", className: "badge-approved" },
      REJECT: { label: "Rejected", className: "badge-rejected" },
      PENDING: { label: "Pending", className: "badge-pending" },
    };
    const s = map[status] || {
      label: status || "Pending",
      className: "badge-pending",
    };
    return <span className={`status-badge ${s.className}`}>{s.label}</span>;
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
      params.append("userType", userType);
      params.append("fromDate", formatDateForApi(filters.fromDate) || "");
      params.append("toDate", formatDateForApi(filters.toDate) || "");
      if (filters.ward) params.append("ward", filters.ward);

      const response = await apiClient.get(
        `/dashboard/recent-complaint?${params.toString()}`,
      );

      if (response.success && Array.isArray(response.data?.data)) {
        const mapped = response.data.data.map((item) => ({
          date: formatDisplayDate(item.COMPLAINT_DATE),
          ward: `Ward ${item.WARDID}`,
          toiletId: item.TOILETID,
          toiletName: item.TOILETNAME,
          citizen: item.CITIZEN_NAME,
          superStatus: item.SUPERSTATUS,
          siStatus: item.SISTATUS,
          complaintId: item.COMPLAINT_ID,
        }));
        setInspections(mapped);
      } else {
        setInspections([]);
      }
    } catch (err) {
      console.error("Error fetching recent complaints:", err);
      setInspections([]);
    } finally {
      setLoader(false);
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [ulbId, userId, userType, filters.fromDate, filters.toDate, filters.ward]);

  if (loading) {
    return (
      <div className="inspections-card">
        <h6 className="inspections-title">Recent Complaints</h6>
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

  if (inspections.length === 0) {
    return (
      <div className="inspections-card">
        <h6 className="inspections-title">Recent Complaints</h6>
        <p className="text-muted text-center py-3">No complaints found</p>
      </div>
    );
  }

  return (
    <div className="inspections-card">
      <h6 className="inspections-title">Recent Complaints</h6>
      <div
        className="inspections-table-wrapper"
        style={{ height: "auto", maxHeight: "350px", overflowY: "auto" }}
      >
        <table className="inspections-table">
          <thead>
            <tr>
              <th>Date</th>
              <th>Ward</th>
              <th>Toilet</th>
              <th>Citizen</th>
              <th>Mukadam Status</th>
              <th>SI Status</th>
            </tr>
          </thead>
          <tbody>
            {inspections.map((row, i) => (
              <tr key={i}>
                <td className="nowrap">{row.date}</td>
                <td>{row.ward}</td>
                <td>
                  <div className="toilet-id">{row.toiletId}</div>
                  <div className="toilet-name">{row.toiletName}</div>
                </td>
                <td>{row.citizen}</td>
                <td>{getStatusBadge(row.superStatus)}</td>
                <td>{getStatusBadge(row.siStatus)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

       { userType !== "ADMIN" && (
<div className="inspections-footer">
        <button className="view-all-btn" onClick={()=>Navigate({
          pathname: userType == 'SI' ? "/resolved-complaint" : "/supervisor-complaint-list"
        })}>View All Inspections &raquo;</button>
      </div>
       )}
      
    </div>
  );
};

export default InspectionRecent;
