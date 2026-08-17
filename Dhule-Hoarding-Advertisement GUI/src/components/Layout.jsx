import { useEffect } from "react";
import Sidebar from "./Sidebar";
import Navbar from "./Navbar";
import Footer from "./Footer";
import { useSidebar } from "../context/SidebarContext";

export default function Layout({ children }) {
  const { isSidebarOpen, toggleSidebar } = useSidebar();
  useEffect(() => {
    const isMobile = window.innerWidth < 992;
    if (isSidebarOpen && isMobile) {
      document.body.classList.add("sidebar-open");
    } else {
      document.body.classList.remove("sidebar-open");
    }

    return () => {
      document.body.classList.remove("sidebar-open");
    };
  }, [isSidebarOpen]);

  return (
    <div className="admin-shell">
      <div
        className="sidebar-backdrop"
        onClick={toggleSidebar}
        aria-hidden="true"
      />

      <Sidebar />

      <div
        className={`admin-main ${isSidebarOpen ? "admin-main--shifted" : ""}`}
      >
        <Navbar />
        <main className="dashboard-content">
          <div className="container-fluid px-3 px-lg-4 py-4">{children}</div>
        </main>
        <Footer />
      </div>
    </div>
  );
}
