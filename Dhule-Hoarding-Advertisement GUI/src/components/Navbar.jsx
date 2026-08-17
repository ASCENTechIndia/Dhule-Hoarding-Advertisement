import { Link, useNavigate } from "react-router-dom";
import { useState } from "react";
import { useTheme } from "../context/ThemeContext";
import { useSidebar } from "../context/SidebarContext";
import { useAuth } from "../context/AuthContext";
import logo from "../../public/assets/images/dhule-logo.png";
import profileImage from "../../public/assets/images/profile-img.jpg";

export default function Navbar() {
  const navigate = useNavigate();
  const { logout, user } = useAuth();
  const [showNotifications, setShowNotifications] = useState(false);
  const [showProfile, setShowProfile] = useState(false);
  const { isDarkMode, toggleTheme } = useTheme();
  const { toggleSidebar } = useSidebar();

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  return (
    <nav className="navbar admin-navbar navbar-expand bg-white">
      <div className="container-fluid px-3 px-lg-4">
        <img
          src={logo}
          alt="Dhule Municipal Corporation Logo"
          className="ms-0 me-3 d-lg-none d-block"
        />
        <button
          className="sidebar-toggle"
          type="button"
          onClick={toggleSidebar}
          aria-controls="adminSidebar"
          aria-expanded="true"
          aria-label="Toggle sidebar"
        >
          <span></span>
          <span></span>
          <span></span>
        </button>

        <div className="navbar-actions ms-auto">
          <div className="dropdown">
            <button
              className="profile-button dropdown-toggle"
              type="button"
              onClick={() => setShowProfile(!showProfile)}
              aria-expanded={showProfile}
            >
              <img
                className="avatar-img avatar-sm"
                src={profileImage}
                alt="User Profile Image"
              />
              <span
                className="profile-name d-none d-sm-inline"
                style={{ fontSize: "0.80rem" }}
              >
                {user?.userFullName}
              </span>
            </button>
            {showProfile && (
              <ul className="dropdown-menu dropdown-menu-end show">
                <li>
                  <button className="dropdown-item" onClick={handleLogout}>
                    Sign out
                  </button>
                </li>
              </ul>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
}
