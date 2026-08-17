import React from "react";

const categories = [
  { rank: 1, category: "Toilet Not Clean", count: 78, pct: 41.94 },
  { rank: 2, category: "Water Issue", count: 41, pct: 22.04 },
  { rank: 3, category: "Light Issue", count: 26, pct: 13.98 },
  { rank: 4, category: "Damage Issue", count: 23, pct: 12.37 },
  { rank: 5, category: "Other Problems", count: 18, pct: 9.68 },
];

const total = categories.reduce((s, c) => s + c.count, 0);
const maxPct = Math.max(...categories.map((c) => c.pct));

const TopComplaint = ({filters}) => {
  return (
    <div className="tcc-card">
      <h6 className="tcc-title">Top Complaint Categories</h6>
      <table className="tcc-table">
        <thead>
          <tr>
            <th>#</th>
            <th className="text-left">Category</th>
            <th className="text-center">Total Complaints</th>
            <th className="text-center">Percentage</th>
          </tr>
        </thead>
        <tbody>
          {categories.map(({ rank, category, count, pct }) => (
            <tr key={rank}>
              <td className="tcc-rank">{rank}</td>
              <td className="tcc-category">{category}</td>
              <td className="tcc-count">{count}</td>
              <td className="tcc-pct-cell">
                <div className="tcc-bar-wrap">
                  <div
                    className="tcc-bar"
                    style={{ width: `${(pct / maxPct) * 100}%` }}
                  />
                </div>
                <span className="tcc-pct-label">{pct}%</span>
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
  );
};

export default TopComplaint;
