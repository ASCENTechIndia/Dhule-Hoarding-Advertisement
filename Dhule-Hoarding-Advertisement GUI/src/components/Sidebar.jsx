import { Link, useLocation } from "react-router-dom";
import { useSidebar } from "../context/SidebarContext";
import logo from "../../public/assets/images/dhule-logo.png";

export default function Sidebar() {
  const location = useLocation();
  const { isSidebarOpen, toggleSidebar } = useSidebar();

  const navLinks = [
    {
      path: "/advertisementPanchnama-form",
      icon: "bi-file-earmark-plus",
      label: "नवीन पंचनामा",
    },
    {
      path: "/panchanama-list",
      icon: "bi-file-earmark-text",
      label: "पंचनामा यादी",
    },
    {
      path: "/notice-list",
      icon: "bi-file-earmark-check",
      label: "नोटिस यादी",
    },
    {
      path: "/bill-list",
      icon: "bi-wallet",
      label: "शुल्क भरणा यादी",  
    },
    {
      path: "/notice-nirmiti-report",
      icon: "bi-file-earmark-bar-graph", 
      label: "नोटीस निर्मिती अहवाल",
    },
    {
      path: "/panchanama-nirmiti-report",
      icon: "bi-file-earmark-bar-graph",
      label: "पंचनामा निर्मिती अहवाल",
    },
    {
      path: "/notice-payment-report",
      icon: "bi-credit-card", 
      label: "नोटीस भरणा अहवाल",
    },
    // {
    //   path: "/ward-wise-report",
    //   icon: "bi-geo-alt", 
    //   label: "प्रभागनिहाय अहवाल",
    // },
    // {
    //   path: "/monthly-wise-report",
    //   icon: "bi-calendar3", 
    //   label: "महिनानिहाय अहवाल",
    // },
  ];

  return (
    <aside
      className="admin-sidebar"
      id="adminSidebar"
      aria-label="Main navigation"
      style={{
        transform: isSidebarOpen ? "translateX(0)" : "translateX(-100%)",
        transition: "transform 0.2s ease",
      }}
    >
      <div className="sidebar-header">
        <img
          src={logo}
          alt="Dhule Municipal Corporation Logo"
          className="m-auto d-lg-block d-none"
        />
      </div>

      <nav className="sidebar-nav mt-lg-0 mt-4">
        {navLinks.map((link) => {
          const isActive = location.pathname === link.path;

          return (
            <Link
              key={link.path}
              to={link.path}
              className={`nav-link ${isActive ? "active" : ""}`}
              aria-current={isActive ? "page" : undefined}
              onClick={() => {
                if (window.innerWidth < 992) {
                  toggleSidebar();
                }
              }}
            >
              <span className="nav-icon">
                <i className={`bi ${link.icon}`} aria-hidden="true"></i>
              </span>
              <span className="nav-text">{link.label}</span>
            </Link>
          );
        })}
      </nav>
    </aside>
  );
}
