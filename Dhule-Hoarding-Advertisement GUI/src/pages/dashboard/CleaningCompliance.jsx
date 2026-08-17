import React, { useState, useEffect, useRef } from "react";
import * as echarts from "echarts";
import apiClient from "../../services/apiClient";
import { useLoader } from "../../context/LoaderContext";
import { useAuth } from "../../context/AuthContext";

const CleaningCompliance = ({ filters }) => {
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
  const [data, setData] = useState({
    totalUnits: 0,
    cleaned: { count: 0, pct: 0 },
    notCleaned: { count: 0, pct: 0 },
    pending: { count: 0, pct: 0 },
    rejected: { count: 0, pct: 0 },
  });
  const [loading, setLoading] = useState(true);

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
      if (filters.ward) params.append("ward", filters.ward);

      const response = await apiClient.get(
        `/dashboard/cleaning-complience?${params.toString()}`,
      );

      if (response.success && response.data?.data) {
        const d = response.data.data;
        const total = d.TOTAL_TOILETS || 0;
        const cleaned = d.CLEANED || 0;
        const notCleaned = d.NOT_CLEANED || 0;
        const pending = d.PENDING || 0;
        const rejected = d.REJECTED || 0;

        setData({
          totalUnits: total,
          cleaned: {
            count: cleaned,
            pct: total > 0 ? (cleaned / total) * 100 : 0,
          },
          notCleaned: {
            count: notCleaned,
            pct: total > 0 ? (notCleaned / total) * 100 : 0,
          },
          pending: {
            count: pending,
            pct: total > 0 ? (pending / total) * 100 : 0,
          },
          rejected: {
            count: rejected,
            pct: total > 0 ? (rejected / total) * 100 : 0,
          },
        });
      } else {
        setData({
          totalUnits: 0,
          cleaned: { count: 0, pct: 0 },
          notCleaned: { count: 0, pct: 0 },
          pending: { count: 0, pct: 0 },
          rejected: { count: 0, pct: 0 },
        });
      }
    } catch (err) {
      console.error("Error fetching cleaning compliance:", err);
      setData({
        totalUnits: 0,
        cleaned: { count: 0, pct: 0 },
        notCleaned: { count: 0, pct: 0 },
        pending: { count: 0, pct: 0 },
        rejected: { count: 0, pct: 0 },
      });
    } finally {
      setLoader(false);
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [ulbId, userId, userType, filters.ward]);

  // Chart initialization
  useEffect(() => {
    if (!chartRef.current || data.totalUnits === 0) return;

    const chart = echarts.init(chartRef.current);

    chart.setOption({
      tooltip: { trigger: "item", formatter: "{b}: {c} ({d}%)" },
      legend: { show: false },
      series: [
        {
          type: "pie",
          radius: ["55%", "80%"],
          center: ["40%", "50%"],
          avoidLabelOverlap: false,
          label: {
            show: true,
            position: "center",
            formatter: () =>
              `{pct|${data.cleaned.pct.toFixed(1)}%}\n{label|Cleaning %}`,
            rich: {
              pct: {
                fontSize: 17,
                fontWeight: 600,
                color: "#111827",
                lineHeight: 28,
              },
              label: { fontSize: 11, color: "#6B7280", lineHeight: 18 },
            },
          },
          emphasis: { label: { show: true } },
          labelLine: { show: false },
          data: [
            {
              value: data.cleaned.count,
              name: "Cleaned Units",
              itemStyle: { color: "#16A34A" },
            },
            {
              value: data.notCleaned.count,
              name: "Not Cleaned Units",
              itemStyle: { color: "#DC2626" },
            },
            {
              value: data.pending.count,
              name: "Pending Units",
              itemStyle: { color: "#F59E0B" },
            },
            {
              value: data.rejected.count,
              name: "Rejected Units",
              itemStyle: { color: "#8B5CF6" },
            },
          ],
        },
      ],
    });

    const ro = new ResizeObserver(() => chart.resize());
    ro.observe(chartRef.current);
    return () => {
      ro.disconnect();
      chart.dispose();
    };
  }, [data]);

  if (loading) {
    return (
      <div className="compliance-card">
        <h6 className="compliance-title">Cleaning Compliance (Today)</h6>
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

  if (data.totalUnits === 0) {
    return (
      <div className="compliance-card">
        <h6 className="compliance-title">Cleaning Compliance (Today)</h6>
        <p className="text-muted text-center py-3">No data available</p>
      </div>
    );
  }

  return (
    <div className="compliance-card">
      <h6 className="compliance-title">Cleaning Compliance (Today)</h6>
      <div className="compliance-body d-flex align-items-start gap-3">
        <div ref={chartRef} className="compliance-chart" />
        <div className="compliance-legend flex-grow-1 ms-3">
          <div className="legend-item">
            <span className="dot dot-green" />
            <div>
              <div className="legend-label">Cleaned Units</div>
              <div className="legend-value">
                {data.cleaned.count.toLocaleString()} (
                {data.cleaned.pct.toFixed(1)}%)
              </div>
            </div>
          </div>
          <div className="legend-item">
            <span className="dot dot-red" />
            <div>
              <div className="legend-label">Not Cleaned Units</div>
              <div className="legend-value">
                {data.notCleaned.count.toLocaleString()} (
                {data.notCleaned.pct.toFixed(1)}%)
              </div>
            </div>
          </div>
          <div className="legend-item">
            <span className="dot dot-yellow" />
            <div>
              <div className="legend-label">Pending Units</div>
              <div className="legend-value">
                {data.pending.count.toLocaleString()} (
                {data.pending.pct.toFixed(1)}%)
              </div>
            </div>
          </div>
          <div className="legend-item">
            <span className="dot" style={{ background: "#8B5CF6" }} />
            <div>
              <div className="legend-label">Rejected Units</div>
              <div className="legend-value">
                {data.rejected.count.toLocaleString()} (
                {data.rejected.pct.toFixed(1)}%)
              </div>
            </div>
          </div>
        </div>
      </div>
      <div className="compliance-total">
        <span className="total-label">Total Units</span>
        <span className="total-value">{data.totalUnits.toLocaleString()}</span>
      </div>
    </div>
  );
};

export default CleaningCompliance;
