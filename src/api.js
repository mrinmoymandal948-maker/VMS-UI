import axios from "axios";

const API_BASE = "http://localhost:8080/api";

const api = axios.create({
  baseURL: API_BASE,
});

// Attach JWT automatically
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem("token");

    if (token && token.includes(".")) {
      config.headers.Authorization = `Bearer ${token}`;
    }

    return config;
  },
  (error) => Promise.reject(error)
);

/* ---------------- AUTH ---------------- */

export const loginUser = async (username, password) => {
  const res = await api.post("/auth/login", { username, password });
  return res.data;
};

export const createUserApi = async (userData) => {
  const res = await api.post("/auth/create-user", userData);
  return res.data;
};

export const deleteUserApi = async (userId) => {
  const res = await api.delete(`/auth/user/${userId}`);
  return res.data;
};

/* ---------------- LOOKUPS ---------------- */

export const getLookupsApi = async (type) => {
  const res = await api.get(`/lookups/${type}`);
  return res.data;
};

/* ---------------- BOOKING ---------------- */

export const createBooking = async (bookingData) => {
  const res = await api.post("/bookings", bookingData);
  return res.data;
};

export const getOccupancyApi = async (centreId) => {
  const res = await api.get(`/bookings/occupancy/${centreId}`);
  return res.data;
};

export const getActiveVisitorsApi = async (centreId) => {
  const res = await api.get(`/bookings/active/${centreId}`);
  return res.data;
};

export const markExitApi = async (ticketNumber) => {
  const res = await api.put(`/bookings/exit/${ticketNumber}`);
  return res.data;
};

/* ---------------- PRICING ---------------- */
export const calculatePriceApi = async (pricingQuery) => {
  const res = await api.post("/pricing/calculate", pricingQuery);
  return res.data; // Should return { totalAmount: 150 } or similar
};

/* ---------------- PAYMENT ---------------- */

export const confirmPaymentApi = async (paymentData) => {
  const res = await api.post("/payments/confirm", paymentData);
  return res.data;
};

/* ---------------- REFUND ---------------- */

export const requestRefundApi = async (refundData) => {
  const res = await api.post("/refunds/request", refundData);
  return res.data;
};

export const getPendingRefundsApi = async () => {
  const res = await api.get("/refunds/pending");
  return res.data;
};

// Fetch application config for a centre
export const getApplicationConfigApi = async (centreId) => {
  const res = await api.get(`/application-config/${centreId}`);
  return res.data;
};

export const getTodayBookingsApi = async (centreId) => {
  const res = await api.get(`/bookings/today/${centreId}`);
  return res.data;
};

export const updateRefundDecisionApi = (id, status, reason = "") => {
  return api.post(
    `/refunds/decision/${id}?status=${status}&reason=${encodeURIComponent(
      reason
    )}`
  );
};

export const checkRefundStatusApi = async (ticketNumber) => {
  const res = await api.get(`/refunds/status/${ticketNumber}`);
  return res.data;
};

export const getAdminDashboardApi = async () => {
  const res = await api.get("/admin/dashboard");
  return res.data;
};

export const getDailyReportApi = async (date) => {
  const res = await api.get(`/admin/reports/daily?date=${date}`);
  return res.data;
};

export const getMonthlyReportApi = async (month, year) => {
  const res = await api.get(`/admin/reports/monthly?month=${month}&year=${year}`);
  return res.data;
};

export const getYearlyReportApi = async (year) => {
  const res = await api.get(`/admin/reports/yearly?year=${year}`);
  return res.data;
};

export const getCustomReportApi = async (start, end) => {
  const res = await api.get(`/admin/reports/custom?start=${start}&end=${end}`);
  return res.data;
};


export default api;
