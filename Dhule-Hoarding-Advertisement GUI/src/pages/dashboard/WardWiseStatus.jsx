import React, { useState, useEffect, useRef } from "react";
import * as echarts from "echarts";
import apiClient from "../../services/apiClient";
import { useLoader } from "../../context/LoaderContext";
import { useAuth } from "../../context/AuthContext";

const WardWiseStatus = ({ filters }) => {
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
  const chartRef = useRef(null);
  const chartInstance = useRef(null);

  const [chartData, setChartData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedDate, setSelectedDate] = useState(getTodayDate());

  function getTodayDate() {
    const today = new Date();
    const year = today.getFullYear();
    const month = String(today.getMonth() + 1).padStart(2, "0");
    const day = String(today.getDate()).padStart(2, "0");
    return `${year}-${month}-${day}`;
  }

  const formatDateForApi = (dateStr) => {
    if (!dateStr) return "";
    const parts = dateStr.split("-");
    if (parts.length !== 3) return dateStr;
    return `${parts[2]}-${parts[1]}-${parts[0]}`;
  };

  const buildParams = () => {
    const params = new URLSearchParams();
    params.append("userId", userId);
    params.append("ulbId", ulbId);
    params.append("date", formatDateForApi(selectedDate) || "");
    if (filters.ward) params.append("ward", filters.ward);
    params.append("userType", userType);
    return params;
  };

  const fetchData = async () => {
    if (!userId) {
      setLoading(false);
      setLoader(false);
      return;
    }
    try {
      setLoader(true);
      setLoading(true);
      const params = buildParams();
      const response = await apiClient.get(
        `/dashboard/ward-wise-cleaning-status?${params.toString()}`,
      );
      if (response.success && Array.isArray(response.data?.data)) {
        setChartData(response.data.data);
      } else {
        setChartData([]);
      }
    } catch (err) {
      console.error("Error fetching ward wise status:", err);
      setChartData([]);
    } finally {
      setLoader(false);
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [userId, selectedDate, filters.ward]);

  // Cleanup on unmount only
  useEffect(() => {
    return () => {
      chartInstance.current?.__resizeObserver?.disconnect();
      chartInstance.current?.dispose();
      chartInstance.current = null;
    };
  }, []);

  // Update chart whenever chartData changes
  useEffect(() => {
    if (!chartRef.current) return;
    if (chartInstance.current) {
      chartInstance.current.__resizeObserver?.disconnect();
      chartInstance.current.dispose();
      chartInstance.current = null;
    }

    if (chartData.length === 0) return;

    chartInstance.current = echarts.init(chartRef.current);

    const ro = new ResizeObserver(() => {
      chartInstance.current?.resize();
    });
    ro.observe(chartRef.current);
    chartInstance.current.__resizeObserver = ro;

    const wards = chartData.map((item) => `Ward ${item.WARDS}`);
    const cleaned = chartData.map((item) => item.CLEANED || 0);
    const notCleaned = chartData.map((item) => item.NOT_CLEANED || 0);
    const pending = chartData.map((item) => item.PENDING || 0);
    const rejected = chartData.map((item) => item.REJECTED || 0);

    chartInstance.current.setOption({
      tooltip: { trigger: "axis", axisPointer: { type: "shadow" } },
      legend: {
        data: ["Cleaned", "Not Cleaned", "Pending", "Rejected"],
        top: 4,
        left: 0,
        itemWidth: 10,
        itemHeight: 10,
        textStyle: { fontSize: 11, color: "#6B7280" },
      },
      grid: { top: 36, left: 10, right: 10, bottom: 10, containLabel: true },
      xAxis: {
        type: "category",
        data: wards,
        axisLabel: { fontSize: 9, color: "#6B7280", interval: 0, rotate: 40 },
        axisLine: { lineStyle: { color: "#E5E7EB" } },
        axisTick: { show: false },
      },
      yAxis: {
        type: "value",
        axisLabel: { fontSize: 10, color: "#9CA3AF" },
        splitLine: { lineStyle: { color: "#F3F4F6" } },
      },
      series: [
        {
          name: "Cleaned",
          type: "bar",
          data: cleaned,
          itemStyle: { color: "#16A34A", borderRadius: [2, 2, 0, 0] },
          barMaxWidth: 10,
        },
        {
          name: "Not Cleaned",
          type: "bar",
          data: notCleaned,
          itemStyle: { color: "#DC2626", borderRadius: [2, 2, 0, 0] },
          barMaxWidth: 10,
        },
        {
          name: "Pending",
          type: "bar",
          data: pending,
          itemStyle: { color: "#F59E0B", borderRadius: [2, 2, 0, 0] },
          barMaxWidth: 10,
        },
        {
          name: "Rejected",
          type: "bar",
          data: rejected,
          itemStyle: { color: "#8B5CF6", borderRadius: [2, 2, 0, 0] },
          barMaxWidth: 10,
        },
      ],
    });

    chartInstance.current.resize();
  }, [chartData]);

  return (
    <div className="ward-card">
      <div className="d-flex justify-content-between align-items-center mb-2">
        <h6 className="ward-title mb-0">Ward Wise Cleaning Status</h6>
        <div
          className="filter-group"
          style={{ flexDirection: "row", gap: "8px", alignItems: "center" }}
        >
          <label
            htmlFor="statusDate"
            className="fw-semibold"
            style={{ fontSize: "13px" }}
          >
            Date
          </label>
          <input
            type="date"
            id="statusDate"
            className="filter-input"
            value={selectedDate}
            onChange={(e) => setSelectedDate(e.target.value)}
            style={{ width: "160px" }}
          />
        </div>
      </div>

      {loading && (
        <div className="d-flex justify-content-center py-4">
          <div
            className="spinner-border spinner-border-sm text-primary"
            role="status"
          >
            <span className="visually-hidden">Loading...</span>
          </div>
        </div>
      )}

      {/* Empty state */}
      {!loading && chartData.length === 0 && (
        <p className="text-muted text-center py-3">No data available</p>
      )}

      <div
        ref={chartRef}
        className="ward-chart"
        style={{
          display: loading || chartData.length === 0 ? "none" : "block",
        }}
      />
    </div>
  );
};

export default WardWiseStatus;
