import { Link, useLocation } from "react-router-dom";
import { useSidebar } from "../context/SidebarContext";
import logo from "../../public/assets/images/dhule-logo.png";

export default function Sidebar() {
  const location = useLocation();
  const { isSidebarOpen, toggleSidebar } = useSidebar();

  const navLinks = [
    {
      path: "/panchanama-list",
      icon: "bi-people",
      label: "Panchanama List",
    },
    {
      path: "/notice-list",
      icon: "bi-people",
      label: "Notice List",
    },
  ];

  return (
    <aside
      className="admin-sidebar"
      id="adminSidebar"
      aria-label="Main navigation"
      style={{
        transform: isSidebarOpen
          ? "translateX(0)"
          : "translateX(-100%)",
        transition: "transform 0.2s ease",
      }}
    >
      {/* SIDEBAR HEADER */}

      <div className="sidebar-header">
        <img
          src={logo}
          alt="Dhule Municipal Corporation Logo"
          className="m-auto d-lg-block d-none"
        />
      </div>

      {/* SIDEBAR NAVIGATION */}

      <nav className="sidebar-nav mt-lg-0 mt-4">
        {navLinks.map((link) => {
          const isActive =
            location.pathname === link.path;

          return (
            <Link
              key={link.path}
              to={link.path}
              className={`nav-link ${
                isActive ? "active" : ""
              }`}
              aria-current={
                isActive ? "page" : undefined
              }
              onClick={() => {
                if (window.innerWidth < 992) {
                  toggleSidebar();
                }
              }}
            >
              <span className="nav-icon">
                <i
                  className={`bi ${link.icon}`}
                  aria-hidden="true"
                ></i>
              </span>

              <span className="nav-text">
                {link.label}
              </span>
            </Link>
          );
        })}
      </nav>
    </aside>
  );
}