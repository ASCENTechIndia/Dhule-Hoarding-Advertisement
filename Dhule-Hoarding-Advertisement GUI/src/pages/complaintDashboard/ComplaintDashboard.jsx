import React, { useState } from "react";
import Layout from "../../components/Layout";
import InspectionRecent from "./InspectionRecent";
import CitizenComplaintSummary from "./CitizenComplaintSummary";
import { useAuth } from "../../context/AuthContext";
import Filters from "./Filters";
import TopComplaintCategories from "../dashboard/TopComplaintCategories";

const ComplaintDashboard = () => {
  const { user } = useAuth();
  const ulbId = user?.orgId;

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
        <Filters
          filters={filters}
          onFilterChange={handleFilterChange}
          onClearFilters={handleClearFilters}
        />

        <div className="row">
          <div className="col-12 mt-lg-0 mt-3">
            <CitizenComplaintSummary filters={filters} />
          </div>
        </div>

        <div className="row mt-3">
          <div className="col-lg-5 col-12">
            <TopComplaintCategories filters={filters} />
          </div>
          <div className="col-lg-7 col-12 mt-lg-0 mt-3">
            <InspectionRecent filters={filters} />
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default ComplaintDashboard;
