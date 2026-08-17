import React, { useState, useEffect } from "react";
import {
  Toilet,
  Users,
  ClipboardCheck,
  Hourglass,
  BadgeCheck,
  BadgeX,
  Gavel,
} from "lucide-react";
import apiClient from "../../services/apiClient";
import { useLoader } from "../../context/LoaderContext";
import { useAuth } from "../../context/AuthContext";

const SummaryCards = ({ filters }) => {
  const { user } = useAuth();
  const userId = user?.userId || "";
  const ulbId = user?.orgId || "";
  const userType = !user.designation
  ? "ADMIN"
  : user.designation === "Sanitary Inspector"
    ? "SI"
    : user.designation === "Vendor"
      ? "ADMIN"
      : "SUP";
  const { setLoader } = useLoader();

  const [cardValues, setCardValues] = useState({
    totalToilets: 0,
    totalVendors: 0,
    todaysInspection: 0,
    pendingVerification: 0,
    approvedBills: 0,
    rejectedBills: 0,
    totalFine: 0,
  });

  const summaryConfig = [
    {
      id: 1,
      label: "Total Toilets",
      key: "totalToilets",
      sub: "CT/PT Units",
      icon: Toilet,
      colorClass: "card-blue",
    },
    {
      id: 2,
      label: "Total Vendors",
      key: "totalVendors",
      sub: "Active Vendors",
      icon: Users,
      colorClass: "card-green",
    },
    {
      id: 3,
      label: "Today's Inspections",
      key: "todaysInspection",
      sub: "Inspections",
      icon: ClipboardCheck,
      colorClass: "card-purple",
    },
    {
      id: 4,
      label: "Pending Verification",
      key: "pendingVerification",
      sub: "Pending",
      icon: Hourglass,
      colorClass: "card-orange",
    },
    {
      id: 5,
      label: "Approved Bills",
      key: "approvedBills",
      sub: "Total Amount",
      icon: BadgeCheck,
      colorClass: "card-teal",
    },
    {
      id: 6,
      label: "Rejected Bills",
      key: "rejectedBills",
      sub: "Total Amount",
      icon: BadgeX,
      colorClass: "card-red",
    },
    {
      id: 7,
      label: "Total Fine",
      key: "totalFine",
      sub: "Total Amount",
      icon: Gavel,
      colorClass: "card-brown",
    },
  ];

  const formatValue = (key, value) => {
    if (
      key === "approvedBills" ||
      key === "rejectedBills" ||
      key === "totalFine"
    ) {
      return `₹${value.toLocaleString("en-IN")}`;
    }
    return value.toLocaleString("en-IN");
  };

  const formatDateForApi = (dateStr) => {
    if (!dateStr) return "";
    const parts = dateStr.split("-");
    if (parts.length !== 3) return dateStr;
    return `${parts[2]}-${parts[1]}-${parts[0]}`;
  };

  const fetchSummary = async () => {
    if (!ulbId || !userId) return;
    try {
      setLoader(true);
      const params = new URLSearchParams();
      params.append("ulbId", String(ulbId));
      params.append("userId", String(userId));
      params.append("fromDate", formatDateForApi(filters.fromDate) || "");
      params.append("toDate", formatDateForApi(filters.toDate) || "");
      if (filters.ward) params.append("ward", filters.ward || "");
      params.append("userType", userType);

      const response = await apiClient.get(
        `/dashboard/summary-cards?${params.toString()}`,
      );

      if (response.success && response.data?.data) {
        const data = response.data.data;
        setCardValues({
          totalToilets: data.totalToilets ?? 0,
          totalVendors: data.totalVendors ?? 0,
          todaysInspection: data.todaysInspection ?? 0,
          pendingVerification: data.pendingVerification ?? 0,
          approvedBills: data.approvedBills ?? 0,
          rejectedBills: data.rejectedBills ?? 0,
          totalFine: data.totalFine ?? 0,
        });
      } else {
        setCardValues({
          totalToilets: 0,
          totalVendors: 0,
          todaysInspection: 0,
          pendingVerification: 0,
          approvedBills: 0,
          rejectedBills: 0,
          totalFine: 0,
        });
      }
    } catch (err) {
      console.error("Error fetching summary cards:", err);
      setCardValues({
        totalToilets: 0,
        totalVendors: 0,
        todaysInspection: 0,
        pendingVerification: 0,
        approvedBills: 0,
        rejectedBills: 0,
        totalFine: 0,
      });
    } finally {
      setLoader(false);
    }
  };

  useEffect(() => {
    if (ulbId) {
      fetchSummary();
    }
  }, [filters, ulbId, userId]);

  return (
    <div className="row g-2">
      {summaryConfig.map(({ id, label, key, sub, icon: Icon, colorClass }) => (
        <div key={id} className="col">
          <div className={`summary-card ${colorClass}`}>
            <div className="summary-card-icon">
              <Icon size={18} strokeWidth={1.8} />
            </div>
            <div className="summary-card-body">
              <span className="summary-card-label">{label}</span>
              <span className="summary-card-value">
                {formatValue(key, cardValues[key])}
              </span>
              <span className="summary-card-sub">{sub}</span>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
};

export default SummaryCards;
