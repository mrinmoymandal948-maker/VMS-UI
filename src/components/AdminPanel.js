import React, { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { Card, Row, Col, Modal, Button, Form } from "react-bootstrap";
import { IoMdArrowDropdown } from "react-icons/io";
import Dashboard from "./admin/Dashboard";
import Users from "./admin/Users";
import Reports from "./admin/Reports";
import Refund from "./admin/Refund";

import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend
} from "recharts";

import api, {
  createUserApi,
  deleteUserApi,
  getPendingRefundsApi,
  getApplicationConfigApi,
  updateRefundDecisionApi,
  getAdminDashboardApi,
  getDailyReportApi,
  getMonthlyReportApi,
  getYearlyReportApi,
  getCustomReportApi
} from "../api";

const AdminPanel = () => {
  const { user } = useAuth();
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [reportType, setReportType] = useState("daily");
  const isAdminLoggedIn = user?.role === "ADMIN";
  const [refundApprovalRequired, setRefundApprovalRequired] = useState(false);
  const [newUser, setNewUser] = useState({ username: "", password: "" });
  const [userList, setUserList] = useState([]);
  const [pendingRefunds, setPendingRefunds] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [reportData, setReportData] = useState(null);
  const [dailyDate, setDailyDate] = useState("");
  const [month, setMonth] = useState("");
  const [year, setYear] = useState("");
  const [customStart, setCustomStart] = useState("");
  const [customEnd, setCustomEnd] = useState("");
  const [message, setMessage] = useState("");
  const [dashboardSummary, setDashboardSummary] = useState(null);
  const location = useLocation();
  const isDashboard = location.pathname.includes("/admin/dashboard");
  const isUsers = location.pathname.includes("/admin/users");
  const isReports = location.pathname.includes("/admin/reports");
  const isRefunds = location.pathname.includes("/admin/refunds");
  const navigate = useNavigate();

  useEffect(() => {
    if (!isAdminLoggedIn) return;

    fetchUsers();
    fetchDashboard();

    if (refundApprovalRequired) {
      fetchRefunds();
    }

    const intervalId = setInterval(() => {
      fetchDashboard();
      if (refundApprovalRequired) {
        fetchRefunds();
      }
    }, 3000);

    return () => clearInterval(intervalId);
  }, [isAdminLoggedIn, refundApprovalRequired]);

  useEffect(() => {
    const fetchConfig = async () => {
      try {
        const centreId = 1;
        const configData = await getApplicationConfigApi(centreId);
        const refundConfig = configData.find(c => c.configKey === "REFUND_APPROVAL_REQUIRED");
        setRefundApprovalRequired(
          refundConfig
            ? String(refundConfig.configValue).toLowerCase() === "true"
            : false
        );
      } catch (err) {
        console.error(err);
      }
    };
    fetchConfig();
  }, []);

  useEffect(() => {
    if (isRefunds && refundApprovalRequired === false) {
      navigate("/admin/dashboard");
    }
  }, [isRefunds, refundApprovalRequired, navigate]);

  useEffect(() => {
    if (!isAdminLoggedIn) {
      navigate("/");
    }
  }, [isAdminLoggedIn, navigate]);

  const fetchDashboard = async () => {
    try {
      const data = await getAdminDashboardApi();
      setDashboardSummary(data);
    } catch (err) {
      console.error("Failed to load dashboard summary", err);
    }
  };

  const fetchDailyReport = async () => {
    if (!dailyDate) return alert("Select date");
    const data = await getDailyReportApi(dailyDate);
    setReportData(data);
  };

  const fetchMonthlyReport = async () => {
    if (!month || !year) return alert("Enter month and year");
    const data = await getMonthlyReportApi(month, year);
    setReportData(data);
  };

  const fetchYearlyReport = async () => {
    if (!year) return alert("Enter year");
    const data = await getYearlyReportApi(year);
    setReportData(data);
  };

  const fetchCustomReport = async () => {
    if (!customStart || !customEnd) return alert("Select both dates");
    const data = await getCustomReportApi(customStart, customEnd);
    setReportData(data);
  };

  const fetchUsers = async () => {
    try {
      const response = await api.get("/auth/all");
      setUserList(response.data);
    } catch (err) {
      console.error("Could not fetch users", err);
    }
  };

  const fetchRefunds = async () => {
    try {
      const data = await getPendingRefundsApi();
      setPendingRefunds(data);
    } catch (err) {
      console.error("Failed to load refunds", err);
    }
  };

  const handleDecision = async (id, status, reason = "") => {
    try {
      await updateRefundDecisionApi(id, status, reason);
      fetchRefunds();
    } catch (err) {
      console.error("Error updating refund:", err);
      throw err;
    }
  };

  const handleCreateUser = async (e) => {
    e.preventDefault();
    setMessage("");
    try {
      const userPayload = {
        username: newUser.username,
        password: newUser.password,
        role: "TICKET_ISSUER",
        active: true,
      };
      await createUserApi(userPayload);
      setMessage("");
      setNewUser({ username: "", password: "" });
      fetchUsers();
      setShowCreateForm(false);
    } catch (err) {
      setMessage(`Error: ${err.response?.data?.message || err.message}`);
    }
  };

  const handleDelete = async (userId) => {
    try {
      await deleteUserApi(userId);
      fetchUsers();
    } catch (err) {
      alert("Failed to delete user.");
    }
  };

  if (!isAdminLoggedIn) return null;

  return (
    <div className="admin-dashboard-wrapper">
      {/* Dashboard Section */}
      {isDashboard && (
        <Dashboard
          dashboardSummary={dashboardSummary}
          refundApprovalRequired={refundApprovalRequired}
        />
      )}

      {isUsers && (
        <Users
          userList={userList}
          searchTerm={searchTerm}
          setSearchTerm={setSearchTerm}
          showCreateForm={showCreateForm}
          setShowCreateForm={setShowCreateForm}
          newUser={newUser}
          setNewUser={setNewUser}
          handleCreateUser={handleCreateUser}
          handleDelete={handleDelete}
          message={message}
        />
      )}

      {/* Refunds Section */}
      {isRefunds && refundApprovalRequired && (
        <Refund
          pendingRefunds={pendingRefunds}
          handleDecision={handleDecision}
        />
      )}

      {/* Reports Section */}
      {isReports && (
        <Reports
          reportType={reportType}
          setReportType={setReportType}
          dailyDate={dailyDate}
          setDailyDate={setDailyDate}
          month={month}
          setMonth={setMonth}
          year={year}
          setYear={setYear}
          customStart={customStart}
          setCustomStart={setCustomStart}
          customEnd={customEnd}
          setCustomEnd={setCustomEnd}
          fetchDailyReport={fetchDailyReport}
          fetchMonthlyReport={fetchMonthlyReport}
          fetchYearlyReport={fetchYearlyReport}
          fetchCustomReport={fetchCustomReport}
          reportData={reportData}
        />
      )}

    </div>
  );
};

export default AdminPanel;