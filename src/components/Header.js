import React, { useState, useRef, useEffect } from "react";
import { useAuth } from "../context/AuthContext";
import { useNavigate, useLocation, Link } from "react-router-dom";
import { PiUserCircleFill } from "react-icons/pi";
import { getApplicationConfigApi } from "../api";
import { IoMdArrowDropdown } from "react-icons/io";

const Header = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const dropdownRef = useRef(null);
  const [refundApprovalRequired, setRefundApprovalRequired] = useState(false);
  const [open, setOpen] = useState(false);

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  useEffect(() => {
    const fetchConfig = async () => {
      try {
        const centreId = 1;
        const configData = await getApplicationConfigApi(centreId);
        const refundConfig = configData.find(c => c.configKey === "REFUND_APPROVAL_REQUIRED");
        setRefundApprovalRequired(
          refundConfig ? String(refundConfig.configValue).toLowerCase() === "true" : false
        );
      } catch (err) {
        console.error(err);
      }
    };
    fetchConfig();
  }, []);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  if (location.pathname === "/login") return null;

  return (
    <>
      {user && (
        <div className="admin-top-header">
          <div className="admin-top-left">
            <h1 className="admin-project-title">Visitor Management System</h1>
          </div>
          <div className="admin-top-center">
            <span className="admin-welcome">Welcome {user.username}</span>
          </div>
          <div className="admin-top-right">
            <div className="user-dropdown" ref={dropdownRef}>
              <div className="user-dropdown-toggle" onClick={() => setOpen(!open)}>
                <PiUserCircleFill className="user-icon" />
                <IoMdArrowDropdown className="dropdown-arrow" />
              </div>
              {open && (
                <div className="user-dropdown-menu">
                  <button className="dropdown-logout-btn" onClick={handleLogout}>Logout</button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      <header className="main-header">
        <div className="header-content">
          <div className="header-middle">

            {/* ADMIN NAV */}
            {user && user.role === "ADMIN" && (
              <nav className="header-nav">
                <Link
                  to="/admin/dashboard"
                  className={location.pathname.includes("/admin/dashboard") ? "active" : ""}
                >
                  Dashboard
                </Link>
                <Link
                  to="/admin/users"
                  className={location.pathname.includes("/admin/users") ? "active" : ""}
                >
                  Users
                </Link>
                <Link
                  to="/admin/reports"
                  className={location.pathname.includes("/admin/reports") ? "active" : ""}
                >
                  Reports
                </Link>
                {refundApprovalRequired && (
                  <Link
                    to="/admin/refunds"
                    className={location.pathname.includes("/admin/refunds") ? "active" : ""}
                  >
                    Refund Requests
                  </Link>
                )}
              </nav>
            )}

            {/* ISSUER NAV — single "Tickets" link */}
            {user && user.role !== "ADMIN" && (
              <nav className="header-nav">
                <Link
                  to="/booking"
                  className={location.pathname.includes("/booking") ? "active" : ""}
                >
                  Tickets
                </Link>
              </nav>
            )}

          </div>
        </div>
      </header>
    </>
  );
};

export default Header;