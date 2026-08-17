import React, { useState, useEffect } from "react";
import apiClient from "../../services/apiClient";
import { useLoader } from "../../context/LoaderContext";
import { useAuth } from "../../context/AuthContext";
import { useNavigate } from "react-router-dom";

const RecentInspections = ({ filters }) => {
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
  const Navigate = useNavigate();

  const [inspections, setInspections] = useState([]);
  const [loading, setLoading] = useState(true);

  // Format date from ISO to DD MMM YYYY (e.g. "26 Jun 2026")
  const formatDate = (dateString) => {
    if (!dateString) return "";
    const date = new Date(dateString);
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

  const formatDateForApi = (dateStr) => {
    if (!dateStr) return "";
    const parts = dateStr.split("-");
    if (parts.length !== 3) return dateStr;
    return `${parts[2]}-${parts[1]}-${parts[0]}`;
  };

  const getStatusBadge = (status) => {
    const statusMap = {
      A: { label: "Approved", className: "badge-approved" },
      R: { label: "Rejected", className: "badge-rejected" },
      P: { label: "Pending", className: "badge-pending" },
    };
    const s = statusMap[status] || {
      label: status || "Pending",
      className: "badge-pending",
    };
    return <span className={`status-badge ${s.className}`}>{s.label}</span>;
  };

  const fetchInspections = async () => {
    if (!ulbId || !userId) {
      setLoading(false);
      setLoader(false);
      return;
    }
    try {
      setLoader(true);
      setLoading(true);
      const params = new URLSearchParams();
      params.append("userId", userId);
      params.append("fromDate", formatDateForApi(filters.fromDate) || "");
      params.append("toDate", formatDateForApi(filters.toDate) || "");
      if (filters.ward) params.append("ward", filters.ward);
      if (filters.vendor) params.append("vendor", filters.vendor);
      params.append("userType", userType);
      params.append("ulbId", ulbId);
      

      const response = await apiClient.get(
        `/dashboard/recent-inspection?${params.toString()}`,
      );

      if (response.success && Array.isArray(response.data?.data)) {
        const mapped = response.data.data.map((item) => ({
          date: formatDate(item.WORKDATE),
          ward: `Ward ${item.WARDID}`,
          toiletId: item.TOILETID,
          toiletName: item.TOILETNAME,
          vendor: item.VENDORID,
          mukadamStatus: item.SUPERSTATUS,
          siStatus: item.SISTATUS,
          remarks: "",
        }));
        setInspections(mapped);
      } else {
        setInspections([]);
      }
    } catch (err) {
      console.error("Error fetching inspections:", err);
      setInspections([]);
    } finally {
      setLoader(false);
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchInspections();
  }, [
    ulbId,
    userId,
    filters.fromDate,
    filters.toDate,
    filters.ward,
    filters.vendor,
  ]);

  if (loading) {
    return (
      <div className="inspections-card">
        <h6 className="inspections-title">Recent Inspections</h6>
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
        <h6 className="inspections-title">Recent Inspections</h6>
        <p className="text-muted text-center py-3">No inspections found</p>
      </div>
    );
  }

  return (
    <div className="inspections-card">
      <h6 className="inspections-title">Recent Inspections</h6>
      <div
        className="inspections-table-wrapper"
        style={{ height: "auto", maxHeight: "350px", overflowY: "auto" }}
      >
        <table className="inspections-table">
          <thead>
            <tr>
              <th>Date</th>
              <th>Ward / Prabhag </th>
              <th>Toilet ID / Name</th>
              <th>Vendor Name</th>
              <th>Mukadam Status</th>
              <th>SI Status</th>
              {/* <th>Details</th> */}
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
                <td>{row.vendor}</td>
                <td>{getStatusBadge(row.mukadamStatus)}</td>
                <td>{getStatusBadge(row.siStatus)}</td>
                {/* <td>
                  <button className="view-btn">View &raquo;</button>
                </td> */}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      { userType !== "ADMIN" && (
 <div className="inspections-footer">
        <button onClick={()=> Navigate({
          pathname: userType == 'SI' ?  "/application-list-sanitary" : "/application-list"
        })} className="view-all-btn">View All Inspections &raquo;</button>
      </div>
      )}
     
    </div>
  );
};

export default RecentInspections;
