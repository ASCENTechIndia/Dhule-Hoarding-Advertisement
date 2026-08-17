import React, { useState } from "react";
import Layout from "../../components/Layout";
import DashboardFilter from "./DashboardFilter";
import SummaryCards from "./SummaryCard";
import CleaningCompliance from "./CleaningCompliance";
import WardWiseStatus from "./WardWiseStatus";
import RecentInspections from "./RecentInspections";
import BillsOverview from "./BillsOverview";
import CitizenComplaintStatus from "./CitizenComplaintStatus";
import TopComplaintCategories from "./TopComplaintCategories";
import { useAuth } from "../../context/AuthContext";

const Dashboard = () => {
  const [filters, setFilters] = useState({
    fromDate: getCurrentMonthFirstDate(),
    toDate: getTodayDate(),
    ward: "",
    vendor: "",
    complaintStatus: "",
  });

  function getTodayDate() {
    const today = new Date();
    const year = today.getFullYear();
    const month = String(today.getMonth() + 1).padStart(2, "0");
    const day = String(today.getDate()).padStart(2, "0");
    return `${year}-${month}-${day}`;
  }

  function getCurrentMonthFirstDate() {
  const today = new Date();
  const year = today.getFullYear();
  const month = String(today.getMonth() + 1).padStart(2, "0");

  return `${year}-${month}-01`;
}

  const handleFilterChange = (name, value) => {
    setFilters((prev) => ({ ...prev, [name]: value }));
  };

  const handleClearFilters = () => {
    setFilters({
      fromDate: "",
      toDate: "",
      ward: "",
      vendor: "",
      complaintStatus: "",
    });
  };

  return (
    <Layout>
      <div className="dashboard-wrapper">
        <DashboardFilter
          filters={filters}
          onFilterChange={handleFilterChange}
          onClearFilters={handleClearFilters}
        />

        <div className="row">
          <div className="col-12">
            <SummaryCards filters={filters} />
          </div>
        </div>

        <div className="row mt-3">
          <div className="col-12">
            <WardWiseStatus filters={filters} />
          </div>
        </div>

        <div className="row mt-3">
          {/* <div className="col-lg-5 col-12">
            <TopComplaintCategories filters={filters} />
          </div> */}
          <div className="col-12 mt-3">
            <RecentInspections filters={filters} />
          </div>
        </div>

        <div className="row mt-3">
          <div className="col-lg-6 col-12">
            <CleaningCompliance filters={filters} />
          </div>
          {/* <div className="col-lg-4 col-12 mt-lg-0 mt-3">
            <CitizenComplaintStatus filters={filters} />
          </div> */}
          <div className="col-lg-6 col-12 mt-lg-0 mt-3">
            <BillsOverview filters={filters} />
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default Dashboard;
