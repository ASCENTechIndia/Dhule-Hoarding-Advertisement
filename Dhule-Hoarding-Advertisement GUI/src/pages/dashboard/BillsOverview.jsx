import React, { useEffect, useRef } from "react";
import * as echarts from "echarts";

const billsData = {
  total: 0,
  approved: { count: 0, pct: 0 },
  rejected: { count: 0, pct: 0 },
};

const BillsOverview = ({ filters }) => {
  const chartRef = useRef(null);

  useEffect(() => {
    const chart = echarts.init(chartRef.current);

    chart.setOption({
      tooltip: { trigger: "item", formatter: "{b}: {c} ({d}%)" },
      legend: { show: false },
      series: [
        {
          type: "pie",
          radius: ["52%", "78%"],
          center: ["50%", "50%"],
          label: {
            show: true,
            position: "center",
            formatter: () => `{total|Total Bills}\n{val|${billsData.total}}`,
            rich: {
              total: { fontSize: 11, color: "#6B7280", lineHeight: 18 },
              val: {
                fontSize: 22,
                fontWeight: 700,
                color: "#111827",
                lineHeight: 28,
              },
            },
          },
          labelLine: { show: false },
          data: [
            {
              value: billsData.approved.count,
              name: "Approved Bills",
              itemStyle: { color: "#16A34A" },
            },
            {
              value: billsData.rejected.count,
              name: "Rejected Bills",
              itemStyle: { color: "#DC2626" },
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
  }, []);

  return (
    <div className="bills-card">
      <h6 className="bills-title">Bills Overview</h6>
      <div className="d-flex">
        <div style={{ width: "50%" }}>
          <div ref={chartRef} className="bills-chart" />
        </div>
        <div className="bills-legend">
          <div className="bills-legend-item bills-legend-approved">
            <span className="dot dot-green" />
            <div>
              <div className="bills-legend-label">Approved Bills</div>
              <div className="bills-legend-value">
                {billsData.approved.count} ({billsData.approved.pct}%)
              </div>
            </div>
          </div>
          <div className="bills-legend-item bills-legend-rejected">
            <span className="dot dot-red" />
            <div>
              <div className="bills-legend-label">Rejected Bills</div>
              <div className="bills-legend-value">
                {billsData.rejected.count} ({billsData.rejected.pct}%)
              </div>
            </div>
          </div>
        </div>
      </div>
      <div className="bills-pct-row">
        <div className="pct-box pct-green">
          <div className="pct-label">Approval %</div>
          <div className="pct-value">{billsData.approved.pct}%</div>
        </div>
        <div className="pct-box pct-red">
          <div className="pct-label">Rejection %</div>
          <div className="pct-value">{billsData.rejected.pct}%</div>
        </div>
      </div>
    </div>
  );
};

export default BillsOverview;
