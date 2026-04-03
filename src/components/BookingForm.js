import React, { useState, useEffect, useRef } from "react";
import { Card, Row, Col, Form } from "react-bootstrap";
import { IoMdArrowDropdown } from "react-icons/io";
import { Modal, Button } from "react-bootstrap";
import { TicketStatus } from "../utils/constants";
import Swal from "sweetalert2";
import api, {
  getLookupsApi,
  createBooking,
  requestRefundApi,
  calculatePriceApi,
  getApplicationConfigApi,
  getTodayBookingsApi,
  confirmPaymentApi,
  getPaymentByTicketApi,
  getRefundByTicketApi
} from "../api";

import { useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

const BookingForm = () => {
  const { user } = useAuth();
  const [todayBookings, setTodayBookings] = useState([]);
  const location = useLocation();
  const navigate = useNavigate();
  const [refundApprovalRequired, setRefundApprovalRequired] = useState(null);
  const [categories, setCategories] = useState([]);
  const [ticketTypes, setTicketTypes] = useState([]);
  const ticketTypesRef = useRef([]); // always-current ref for use inside intervals
  const [refundData, setRefundData] = useState({ ticketNumber: "", ticketTypes: [], reason: "" });
  const [refundableTypes, setRefundableTypes] = useState([]);
  const [currentTime, setCurrentTime] = useState("");
  const [refundTicket, setRefundTicket] = useState(null);
  const [totalToPay, setTotalToPay] = useState(0);
  const [filterType, setFilterType] = useState("date");
  const [filterDate, setFilterDate] = useState(new Date().toISOString().split("T")[0]);
  const [filterMonth, setFilterMonth] = useState("");
  const [filterYear, setFilterYear] = useState("");
  const [fromDate, setFromDate] = useState("");
  const [toDate, setToDate] = useState("");
  const [showRefundModal, setShowRefundModal] = useState(false);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [selectedBooking, setSelectedBooking] = useState(null);
  const [paymentRefundData, setPaymentRefundData] = useState({}); // Maps ticketNumber -> { amountPaid, amountRefunded }

  // ─── Modal step: "form" | "confirm" ──────────────────────────────────────
  const [modalStep, setModalStep] = useState("form");
  const [backendTicket, setBackendTicket] = useState(null);
  const [savedPayload, setSavedPayload] = useState(null);
  const [paymentMode, setPaymentMode] = useState("");
  const [paymentOptions, setPaymentOptions] = useState([]);
  const [isPaymentConfirmed, setIsPaymentConfirmed] = useState(false);
  const [confirmTotalPrice, setConfirmTotalPrice] = useState(0);

  const [formData, setFormData] = useState({
    visitorName: "",
    phoneNumber: "",
    visitDate: new Date().toISOString().split("T")[0],
    visitorCategory: "",
    numVisitors: 1
  });

  const [selectedEntries, setSelectedEntries] = useState({});

  // ─── Fetch payment and refund data for a ticket ──────────────────────────
  const fetchPaymentRefundData = async (ticketNumber) => {
    try {
      const paymentRes = await getPaymentByTicketApi(ticketNumber);
      const refundRes = await getRefundByTicketApi(ticketNumber);

      const amountPaid = paymentRes?.amountPaid ?? paymentRes ?? 0;
      const amountRefunded =
        refundRes?.totalRefundAmount ??
        refundRes?.amountRefunded ??
        refundRes ??
        0;

      setPaymentRefundData(prev => ({
        ...prev,
        [ticketNumber]: { amountPaid, amountRefunded }
      }));
    } catch (err) {
      console.error(`Failed to fetch payment/refund data for ${ticketNumber}`, err);

      setPaymentRefundData(prev => ({
        ...prev,
        [ticketNumber]: { amountPaid: 0, amountRefunded: 0 }
      }));
    }
  };

  // ─── Refund Modal ────────────────────────────────────────────────────────────
  const handleOpenRefundModal = async (ticketNumber) => {
    try {
      const res = await api.get(`/refunds/ticket/${ticketNumber}`);
      const freshBooking = res.data;
      if (!freshBooking) return;

      const mainType = ticketTypes.find(t => t.sortOrder === 1)?.lookupValue;
      const refundableItems = freshBooking.items.filter(
        item => item.ticketType !== mainType && item.quantity > 0
      );

      setSelectedBooking(freshBooking);
      setRefundableTypes(refundableItems);
      setRefundData({ ticketNumber, ticketTypes: [], reason: "" });
      setShowRefundModal(true);
    } catch (err) {
      console.error("Failed to fetch ticket details", err);
      Swal.fire({ icon: "error", title: "Error", text: "Could not load ticket details. Please try again." });
    }
  };

  // ─── Create Modal open ───────────────────────────────────────────────────
  const handleOpenCreateModal = () => {
    setFormData({
      visitorName: "",
      phoneNumber: "",
      visitDate: new Date().toISOString().split("T")[0],
      visitorCategory: categories.length > 0 ? categories[0].lookupValue : "",
      numVisitors: 1
    });
    const initialSelections = {};
    ticketTypes.forEach(type => {
      initialSelections[type.lookupValue] = type.sortOrder === 1;
    });
    setSelectedEntries(initialSelections);
    setModalStep("form");
    setBackendTicket(null);
    setSavedPayload(null);
    setPaymentMode("");
    setIsPaymentConfirmed(false);
    setShowCreateModal(true);
  };

  // ─── Create Modal close ──────────────────────────────────────────────────
  const handleCloseCreateModal = () => {
    setShowCreateModal(false);
    setModalStep("form");
    setBackendTicket(null);
    setSavedPayload(null);
    setPaymentMode("");
    setIsPaymentConfirmed(false);
  };

  const isToday = (dateString) => {
    if (!dateString) return false;
    try {
      const d = new Date(dateString);
      const today = new Date();
      return (
        d.getDate() === today.getDate() &&
        d.getMonth() === today.getMonth() &&
        d.getFullYear() === today.getFullYear()
      );
    } catch (e) {
      return false;
    }
  };

  // ─── Config ──────────────────────────────────────────────────────────────────
  useEffect(() => {
    const fetchConfig = async () => {
      try {
        const centreId = user?.centre?.id || 1;
        const configData = await getApplicationConfigApi(centreId);
        const refundConfig = configData.find(c => c.configKey === "REFUND_APPROVAL_REQUIRED");
        setRefundApprovalRequired(
          refundConfig ? String(refundConfig.configValue).toLowerCase() === "true" : true
        );
      } catch (err) {
        console.error("Failed to fetch application config", err);
      }
    };
    fetchConfig();
  }, [user]);

  // ─── Load lookups ─────────────────────────────────────────────────────────
  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      setCurrentTime(`${now.getHours().toString().padStart(2, "0")}:${now.getMinutes().toString().padStart(2, "0")}`);
    };
    updateTime();
    const timerId = setInterval(updateTime, 10000);

    const loadData = async () => {
      try {
        const [catData, typeData] = await Promise.all([
          getLookupsApi("VISITOR_CATEGORY"),
          getLookupsApi("TICKET_TYPE")
        ]);

        if (catData && catData.length > 0) {
          setCategories(catData);
          setFormData(prev => ({ ...prev, visitorCategory: catData[0].lookupValue }));
        }

        if (typeData && Array.isArray(typeData)) {
          setTicketTypes(typeData);
          ticketTypesRef.current = typeData;
          const initialSelections = {};
          typeData.forEach(type => {
            initialSelections[type.lookupValue] = type.sortOrder === 1;
          });
          setSelectedEntries(initialSelections);
        }
      } catch (err) {
        console.error("Lookup Error:", err);
      }
    };

    loadData();
    return () => clearInterval(timerId);
  }, [user?.centre?.id]);

  // ─── Auto-load today's bookings on mount ─────────────────────────────────
  useEffect(() => {
    const loadTodayBookings = async () => {
      try {
        const centreId = user?.centre?.id || 1;
        const today = new Date().toISOString().split("T")[0];
        const res = await api.get(`/bookings/filter/date?date=${today}&centreId=${centreId}`);
        setTodayBookings(res.data || []);

        // Fetch payment and refund data for all tickets
        if (res.data && Array.isArray(res.data)) {
          res.data.forEach(booking => {
            fetchPaymentRefundData(booking.ticketNumber);
          });
        }
      } catch (err) {
        console.error("Failed to load today's bookings", err);
      }
    };
    loadTodayBookings();
  }, [user]);

  // ─── Price calculation ───────────────────────────────────────────────────
  useEffect(() => {
    const fetchPrice = async () => {
      const selectedKeys = Object.keys(selectedEntries).filter(k => selectedEntries[k]);
      const finalCentreId = user?.centre?.id || user?.centreId || 1;

      if (!formData.visitorCategory || selectedKeys.length === 0) {
        setTotalToPay(0);
        return;
      }

      try {
        const priceRequests = selectedKeys.map(type =>
          calculatePriceApi({
            ticketType: type,
            visitorCategory: formData.visitorCategory,
            centreId: Number(finalCentreId),
            quantity: Number(formData.numVisitors)
          })
        );
        const responses = await Promise.all(priceRequests);
        const grandTotal = responses.reduce((acc, curr) => acc + (Number(curr.totalPrice) || 0), 0);
        setTotalToPay(grandTotal);
      } catch (err) {
        console.error("Price calculation failed", err);
        setTotalToPay(0);
      }
    };
    fetchPrice();
  }, [formData.numVisitors, formData.visitorCategory, selectedEntries, user]);

  // ─── Refund status polling ───────────────────────────────────────────────
  useEffect(() => {
    const ticketToCheck = refundTicket || localStorage.getItem("refundTicket");
    if (!ticketToCheck) return;

    const pollId = setInterval(async () => {
      try {
        const res = await api.get(`/refunds/status/${ticketToCheck}`);

        if (res.data?.status === "APPROVED") {
          // Re-fetch fresh ticket data from backend so UI reflects actual DB state
          try {
            const freshRes = await api.get(`/refunds/ticket/${ticketToCheck}`);
            const freshItems = freshRes.data?.items || [];
            // Backend status is unreliable — always returns FULLY_REFUNDED even for partial.
            // Derive status from item quantities: use the existing booking's mainType from state.
            const mainTypeLookup = ticketTypesRef.current.find(t => t.sortOrder === 1)?.lookupValue;
            setTodayBookings(prev =>
              prev.map(bk => {
                if (bk.ticketNumber !== ticketToCheck) return bk;
                const additionalItems = freshItems.filter(i => i.ticketType !== mainTypeLookup);
                const hasRemainingAdditional = additionalItems.some(i => i.quantity > 0);
                return {
                  ...bk,
                  items: freshItems,
                  status: hasRemainingAdditional ? "PARTIALLY_REFUNDED" : "FULLY_REFUNDED"
                };
              })
            );
            // Refresh payment/refund data
            fetchPaymentRefundData(ticketToCheck);
          } catch (fetchErr) {
            console.error("Failed to re-fetch ticket after approval", fetchErr);
          }
          Swal.fire({ icon: "success", title: "Refund Approved", text: `Refund approved for ${ticketToCheck}` });
          localStorage.removeItem("refundTicket");
          setRefundTicket(null);
          clearInterval(pollId);
        }

        if (res.data?.status === "REJECTED") {
          Swal.fire({ icon: "error", title: "Refund Rejected", text: `Reason: ${res.data?.reason || "No reason provided"}` });
          localStorage.removeItem("refundTicket");
          setRefundTicket(null);
          clearInterval(pollId);
        }
      } catch (err) { console.error(err); }
    }, 3000);
    return () => clearInterval(pollId);
  }, [refundTicket]);

  // ─── Filter/Search ───────────────────────────────────────────────────────
  const fetchBookings = async () => {
    const centreId = user?.centre?.id || 1;
    try {
      let query = "";
      switch (filterType) {
        case "date":
          if (!filterDate) {
            Swal.fire({ icon: "warning", title: "Missing Date", text: "Please select a date." });
            return;
          }
          query = `/bookings/filter/date?date=${filterDate}&centreId=${centreId}`;
          break;
        case "month":
          if (!filterMonth || !filterYear) {
            Swal.fire({ icon: "warning", title: "Missing Month/Year", text: "Please select both month and year." });
            return;
          }
          query = `/bookings/filter/month?month=${Number(filterMonth)}&year=${filterYear}&centreId=${centreId}`;
          break;
        case "year":
          if (!filterYear) {
            Swal.fire({ icon: "warning", title: "Missing Year", text: "Please select a year." });
            return;
          }
          query = `/bookings/filter/year?year=${filterYear}&centreId=${centreId}`;
          break;
        case "custom":
          if (!fromDate || !toDate) {
            Swal.fire({ icon: "warning", title: "Missing Date Range", text: "Please select both From and To dates." });
            return;
          }
          const startDate = new Date(fromDate).toISOString().split("T")[0];
          const endDate = new Date(toDate).toISOString().split("T")[0];
          query = `/bookings/filter/range?start=${startDate}&end=${endDate}&centreId=${centreId}`;
          break;
        default:
          return;
      }
      const res = await api.get(query);
      setTodayBookings(res.data || []);

      // Fetch payment and refund data for all tickets in the result
      if (res.data && Array.isArray(res.data)) {
        res.data.forEach(booking => {
          fetchPaymentRefundData(booking.ticketNumber);
        });
      }
    } catch (err) {
      console.error("Booking fetch failed", err);
      Swal.fire({ icon: "error", title: "Fetch Failed", text: err.response?.data?.message || "Server error." });
    }
  };

  // ─── Checkbox ────────────────────────────────────────────────────────────
  const handleCheckboxChange = (value) => {
    const mainTicket = ticketTypes.find(t => t.sortOrder === 1);
    const isMainType = mainTicket?.lookupValue === value;

    if (isMainType) {
      const toggle = !selectedEntries[value];
      const updated = {};
      ticketTypes.forEach(type => { updated[type.lookupValue] = toggle; });
      setSelectedEntries(updated);
    } else {
      setSelectedEntries(prev => {
        const updated = { ...prev, [value]: !prev[value] };
        const anyOtherSelected = ticketTypes
          .filter(t => t.sortOrder !== 1)
          .some(t => updated[t.lookupValue]);
        if (anyOtherSelected) updated[mainTicket.lookupValue] = true;
        return updated;
      });
    }
  };

  // ─── Refund Submit ───────────────────────────────────────────────────────
  const handleRefund = async () => {
    if (!refundData.ticketNumber || refundData.ticketTypes.length === 0 || !refundData.reason.trim()) {
      Swal.fire({ icon: "error", title: "Missing Information", text: "Please fill all refund fields" });
      return;
    }

    try {
      const refundAmount = refundableTypes
        .filter(t => refundData.ticketTypes.includes(t.ticketType))
        .reduce((sum, t) => sum + (Number(t.amount) || 0), 0);

      await requestRefundApi({ ...refundData });

      setShowRefundModal(false);

      if (refundApprovalRequired) {
        // Do NOT update item quantities yet — wait for admin approval via polling
        setRefundTicket(refundData.ticketNumber);
        Swal.fire({ icon: "success", title: "Request Submitted", text: `Refund request submitted for admin approval (Amount: ₹${refundAmount})` });
      } else {
        // Approval not required — refund is instant, safe to update UI immediately
        setTodayBookings(prev =>
          prev.map(bk => {
            if (bk.ticketNumber !== refundData.ticketNumber) return bk;
            const updatedItems = bk.items.map(item =>
              refundData.ticketTypes.includes(item.ticketType) ? { ...item, quantity: 0 } : item
            );
            // Derive new status: fully refunded if all non-main items have quantity 0
            const mainTypeLookup = ticketTypes.find(t => t.sortOrder === 1)?.lookupValue;
            const additionalItems = updatedItems.filter(i => i.ticketType !== mainTypeLookup);
            const allAdditionalZero = additionalItems.length > 0 && additionalItems.every(i => i.quantity === 0);
            return {
              ...bk,
              items: updatedItems,
              status: allAdditionalZero ? "FULLY_REFUNDED" : "PARTIALLY_REFUNDED"
            };
          })
        );
        // Refresh payment/refund data
        fetchPaymentRefundData(refundData.ticketNumber);
        Swal.fire({ icon: "success", title: "Refund Successful", text: `Refunded Amount: ₹${refundAmount}` });
      }

      setRefundData({ ticketNumber: "", ticketTypes: [], reason: "" });
    } catch (err) {
      const message = err.response?.data?.message || err.response?.data || "Refund request failed";
      Swal.fire({ icon: "error", title: "Refund Failed", text: message });
    }
  };

  // ─── Create Booking Submit → go to confirm step ──────────────────────────
  const handleSubmit = (e) => {
    e.preventDefault();
    const finalCentreId = user?.centre?.id || user?.centreId || 1;
    const payload = {
      ...formData,
      visitTime: currentTime,
      quantity: Number(formData.numVisitors),
      centreId: Number(finalCentreId),
      items: Object.keys(selectedEntries)
        .filter(k => selectedEntries[k])
        .map(k => ({
          ticketType: k,
          visitorCategory: formData.visitorCategory,
          quantity: Number(formData.numVisitors),
          slotTime: "NA"
        }))
    };

    createBooking(payload)
      .then(async response => {
        try {
          const modes = await getLookupsApi("PAYMENT_MODE");
          setPaymentOptions(modes);
        } catch (e) {
          console.error("Failed to load payment modes", e);
        }
        const total = response.items?.reduce((sum, item) => sum + (item.amount || 0), 0) || 0;
        setConfirmTotalPrice(total);
        setBackendTicket(response);
        setSavedPayload(payload);
        setPaymentMode("");
        setIsPaymentConfirmed(false);
        setModalStep("confirm");
      })
      .catch(err => alert("Booking failed: " + (err.response?.data?.message || err.message)));
  };

  // ─── Print Ticket — opens a clean isolated print window ─────────────────
  const handlePrintTicket = () => {
    if (!backendTicket || !savedPayload) return;

    const itemsHtml = backendTicket.items
      ?.map(item => `<div style="margin-left:12px">— ${item.ticketType} (Qty: ${item.quantity})</div>`)
      .join("") || "";

    const html = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8"/>
        <title>Ticket</title>
        <style>
          body { font-family: "Courier New", Courier, monospace; font-size: 14px; color: #000; padding: 30px; max-width: 420px; margin: 0 auto; }
          h2 { text-align: center; font-size: 20px; font-weight: 900; margin-bottom: 16px; }
          .row { display: flex; justify-content: space-between; margin-bottom: 6px; }
          .label { font-weight: bold; }
          .divider { border-top: 2px dashed #000; margin: 14px 0; }
          .types { background: #eee; padding: 10px; margin-top: 10px; }
          .amount { font-size: 18px; font-weight: bold; color: #c0392b; border: 2px solid #000; padding: 8px; text-align: center; margin-top: 12px; }
          .footer { text-align: center; font-size: 11px; margin-top: 14px; }
        </style>
      </head>
      <body>
        <h2>TICKET</h2>
        <div class="row"><span class="label">Ticket Number:</span><span>${backendTicket.ticketNumber}</span></div>
        <div class="row"><span class="label">Visitor Name:</span><span>${savedPayload.visitorName}</span></div>
        <div class="row"><span class="label">Visit Date:</span><span>${savedPayload.visitDate}</span></div>
        <div class="row"><span class="label">Visit Time:</span><span>${savedPayload.visitTime}</span></div>
        <div class="row"><span class="label">Category:</span><span>${savedPayload.visitorCategory}</span></div>
        <div class="types"><strong>Ticket Types:</strong>${itemsHtml}</div>
        <div class="amount">Amount: ₹${confirmTotalPrice}</div>
        <div class="row" style="margin-top:10px"><span class="label">Payment Mode:</span><span>${paymentMode}</span></div>
        <div class="divider"></div>
        <div class="footer">*** Keep this ticket safe for entry ***</div>
      </body>
      </html>
    `;

    const printWindow = window.open("", "_blank", "width=500,height=700");
    printWindow.document.write(html);
    printWindow.document.close();
    printWindow.focus();
    printWindow.print();
    printWindow.close();
  };

  // ─── Confirm Payment ─────────────────────────────────────────────────────
  const handleConfirmPayment = async () => {
    if (!paymentMode) {
      alert("Please select a mode of payment");
      return;
    }

    const generateReferenceNumber = (mode) => {
      const prefix = mode.substring(0, 3).toUpperCase();
      const timestamp = Date.now();
      const random = Math.floor(1000 + Math.random() * 9000);
      return `${prefix}-${timestamp}-${random}`;
    };

    const paymentPayload = {
      ticketNumber: backendTicket.ticketNumber,
      paymentMode,
      amountPaid: confirmTotalPrice,
      referenceNumber: generateReferenceNumber(paymentMode)
    };

    try {
      await confirmPaymentApi(paymentPayload);
      setIsPaymentConfirmed(true);
      // Refresh table
      const centreId = user?.centre?.id || 1;
      const today = new Date().toISOString().split("T")[0];
      const res = await api.get(`/bookings/filter/date?date=${today}&centreId=${centreId}`);
      setTodayBookings(res.data || []);

      // Fetch payment data for the new ticket
      fetchPaymentRefundData(backendTicket.ticketNumber);
    } catch (error) {
      alert("Error saving payment: " + (error.response?.data?.message || "Check connection"));
    }
  };

  // ─── Shared styles ───────────────────────────────────────────────────────
  const inputStyle = { flex: 1, padding: "7px 9px", borderRadius: "6px", border: "1px solid #d4d3d3", background: "#f9fafb", fontSize: "13px", minWidth: 0 };
  const labelStyle = { flex: "0 0 130px", fontWeight: "600", fontSize: "13px", margin: 0 };
  const rowStyle = { display: "flex", alignItems: "center", gap: "12px" };

  return (
    <div className="page-wrapper">
      <div
        className="form-container-main"
        style={{
          marginTop: "50px",
          marginBottom: "50px",
          maxWidth: "1600px",
          marginLeft: "auto",
          marginRight: "auto"
        }}
      >
        <div className="auto-time-display">Current Time: <strong>{currentTime}</strong></div>

        {/* ── FILTER BAR ────────────────────────────────────────────────── */}
        <div className="login-card" style={{ marginTop: "10px", padding: "10px" }}>
          <Card className="report-filter-card sharp-shadow-report">
            <Card.Body>
              <Row className="align-items-end g-3">

                <Col md={2}>
                  <Form.Group>
                    <Form.Label>Filter Type</Form.Label>
                    <div style={{ position: "relative" }}>
                      <Form.Select
                        value={filterType}
                        onChange={(e) => setFilterType(e.target.value)}
                        style={{ paddingRight: "30px" }}
                      >
                        <option value="date">Date</option>
                        <option value="month">Month</option>
                        <option value="year">Year</option>
                        <option value="custom">Custom</option>
                      </Form.Select>
                      <IoMdArrowDropdown
                        style={{
                          position: "absolute", right: "10px", top: "50%",
                          transform: "translateY(-50%)", pointerEvents: "none",
                          fontSize: "18px", color: "#555"
                        }}
                      />
                    </div>
                  </Form.Group>
                </Col>

                <Col md={2}>
                  <Form.Group>
                    <Form.Label style={{ opacity: filterType !== "date" ? 0.5 : 1 }}>Date</Form.Label>
                    <Form.Control
                      type="date"
                      disabled={filterType !== "date"}
                      value={filterDate}
                      onChange={(e) => setFilterDate(e.target.value)}
                    />
                  </Form.Group>
                </Col>

                <Col md={1}>
                  <Form.Group>
                    <Form.Label style={{ opacity: filterType !== "month" ? 0.5 : 1 }}>Month</Form.Label>
                    <Form.Control
                      type="number"
                      placeholder="1-12"
                      disabled={filterType !== "month"}
                      value={filterMonth}
                      onChange={(e) => setFilterMonth(e.target.value)}
                    />
                  </Form.Group>
                </Col>

                <Col md={1}>
                  <Form.Group>
                    <Form.Label style={{ opacity: filterType !== "year" ? 0.5 : 1 }}>Year</Form.Label>
                    <Form.Control
                      type="number"
                      disabled={filterType !== "year"}
                      value={filterYear}
                      onChange={(e) => setFilterYear(e.target.value)}
                    />
                  </Form.Group>
                </Col>

                <Col md={2}>
                  <Form.Group>
                    <Form.Label style={{ opacity: filterType !== "custom" ? 0.5 : 1 }}>From</Form.Label>
                    <Form.Control
                      type="date"
                      disabled={filterType !== "custom"}
                      value={fromDate}
                      onChange={(e) => setFromDate(e.target.value)}
                    />
                  </Form.Group>
                </Col>

                <Col md={2}>
                  <Form.Group>
                    <Form.Label style={{ opacity: filterType !== "custom" ? 0.5 : 1 }}>To</Form.Label>
                    <Form.Control
                      type="date"
                      disabled={filterType !== "custom"}
                      value={toDate}
                      onChange={(e) => setToDate(e.target.value)}
                    />
                  </Form.Group>
                </Col>

                <Col md={2} className="d-flex align-items-end">
                  <button
                    className="btn-submit w-100"
                    onClick={(e) => { e.preventDefault(); fetchBookings(); }}
                  >
                    Search
                  </button>
                </Col>

              </Row>
            </Card.Body>
          </Card>
        </div>

        {/* ── TICKETS TABLE ──────────────────────────────────────────────── */}
        <div
          className="bookings-table-container"
          style={{ marginTop: "25px", border: "1px solid #ddd", borderRadius: "8px", padding: "15px", backgroundColor: "#f9f9f9" }}
        >
          <h3 style={{ marginBottom: "15px", borderBottom: "2px solid #9f2b2b", paddingBottom: "5px" }}>
            Tickets
          </h3>

          <div style={{ maxHeight: "400px", overflowY: "auto" }}>
            <table style={{ width: "100%", borderCollapse: "collapse" }}>
              <thead>
                <tr style={{ backgroundColor: "#eee" }}>
                  <th style={{ padding: "10px" }}>Ticket No</th>
                  <th style={{ padding: "10px" }}>Time</th>
                  <th style={{ padding: "10px" }}>Details</th>
                  <th style={{ padding: "10px" }}>Paid</th>
                  <th style={{ padding: "10px" }}>Refunded</th>
                  <th style={{ padding: "10px" }}>Action</th>
                </tr>
              </thead>

              <tbody>
                <tr style={{ backgroundColor: "#fff8f8" }}>
                  <td style={{ padding: "10px", color: "#aaa", fontStyle: "italic" }}>—</td>
                  <td style={{ padding: "10px", color: "#aaa", fontStyle: "italic" }}>—</td>
                  <td style={{ padding: "10px", color: "#aaa", fontStyle: "italic" }}>New ticket</td>
                  <td style={{ padding: "10px", color: "#aaa", fontStyle: "italic" }}>—</td>
                  <td style={{ padding: "10px", color: "#aaa", fontStyle: "italic" }}>—</td>
                  <td style={{ padding: "10px" }}>
                    <button
                      className="btn btn-sm"
                      style={{ backgroundColor: "#9f2b2b", color: "white", border: "none", borderRadius: "4px", padding: "4px 12px" }}
                      onClick={handleOpenCreateModal}
                    >
                      Create
                    </button>
                  </td>
                </tr>

                {todayBookings.length > 0 ? (
                  todayBookings.map((bk, idx) => {
                    const mainType = ticketTypes.find(t => t.sortOrder === 1)?.lookupValue;

                    const additionalItems = bk.items?.filter(
                      item => item.ticketType !== mainType
                    ) || [];

                    const hasAdditionalTickets = additionalItems.some(i => i.quantity > 0);

                    const isRefundAllowed =
                      isToday(bk.bookingTime) &&
                      hasAdditionalTickets &&
                      bk.status !== "FULLY_REFUNDED";

                    const paymentData = paymentRefundData[bk.ticketNumber] || { amountPaid: 0, amountRefunded: 0 };

                    return (
                      <tr key={idx}>
                        <td style={{ padding: "10px", fontWeight: "bold" }}>{bk.ticketNumber}</td>
                        <td style={{ padding: "10px" }}>
                          {bk.bookingTime
                            ? new Date(bk.bookingTime).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
                            : "-"}
                        </td>
                        <td style={{ padding: "10px" }}>
                          {bk.items?.map(i => i.ticketType).join(", ") || "-"}
                        </td>
                        <td style={{ padding: "10px" }}>
                          ₹{paymentData.amountPaid || 0}
                        </td>
                        <td style={{ padding: "10px" }}>
                          ₹{paymentData.amountRefunded || 0}
                        </td>
                        <td style={{ padding: "10px" }}>
                          {isRefundAllowed ? (
                            <button
                              className="btn btn-danger btn-sm"
                              onClick={() => handleOpenRefundModal(bk.ticketNumber)}
                            >
                              Refund
                            </button>
                          ) : null}
                        </td>
                      </tr>
                    );
                  })
                ) : (
                  <tr>
                    <td colSpan="6" style={{ textAlign: "center", padding: "20px", color: "#aaa" }}>
                      No tickets found.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* ── CREATE TICKET MODAL (Step 1: Form / Step 2: Confirm) ───────── */}
        <Modal show={showCreateModal} onHide={handleCloseCreateModal} centered style={{ "--bs-modal-width": "520px" }}>
          <Modal.Header closeButton>
            <Modal.Title>
              {modalStep === "form"
                ? "Create Ticket"
                : isPaymentConfirmed ? "TICKET" : "Booking Summary"}
            </Modal.Title>
          </Modal.Header>

          <Modal.Body>

            {/* ── STEP 1: Booking Form ── */}
            {modalStep === "form" && (
              <form onSubmit={handleSubmit} id="create-ticket-form">
                <div style={{ display: "flex", flexDirection: "column", gap: "14px" }}>

                  <div style={rowStyle}>
                    <label style={labelStyle}>Visit Date</label>
                    <input type="date" value={formData.visitDate} min={new Date().toISOString().split("T")[0]}
                      onChange={e => setFormData({ ...formData, visitDate: e.target.value })} required style={inputStyle} />
                  </div>

                  <div style={rowStyle}>
                    <label style={labelStyle}>Visitor Category</label>
                    <select value={formData.visitorCategory}
                      onChange={e => setFormData({ ...formData, visitorCategory: e.target.value })} required style={inputStyle}>
                      {categories.map(cat => <option key={cat.lookupDtlId} value={cat.lookupValue}>{cat.lookupLabel}</option>)}
                    </select>
                  </div>

                  <div style={rowStyle}>
                    <label style={labelStyle}>No. of Visitors</label>
                    <input type="number" min="1" value={formData.numVisitors}
                      onChange={e => setFormData({ ...formData, numVisitors: e.target.value })} required style={inputStyle} />
                  </div>

                  <div style={rowStyle}>
                    <label style={labelStyle}>Entry Types</label>
                    <div style={{ flex: 1, display: "flex", gap: "12px", alignItems: "center", flexWrap: "nowrap", minWidth: 0 }}>
                      {ticketTypes.map(type => (
                        <div key={type.lookupDtlId} style={{ display: "flex", alignItems: "center", gap: "4px", whiteSpace: "nowrap" }}>
                          <input type="checkbox" id={`et-${type.lookupDtlId}`}
                            checked={!!selectedEntries[type.lookupValue]}
                            onChange={() => handleCheckboxChange(type.lookupValue)}
                            disabled={type.sortOrder === 1}
                            style={{ width: "13px", height: "13px", flexShrink: 0, margin: 0, cursor: type.sortOrder === 1 ? "default" : "pointer" }} />
                          <label htmlFor={`et-${type.lookupDtlId}`}
                            style={{ marginBottom: 0, fontSize: "13px", fontWeight: "normal", whiteSpace: "nowrap", cursor: type.sortOrder === 1 ? "default" : "pointer" }}>
                            {type.lookupLabel}
                          </label>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div style={rowStyle}>
                    <label style={labelStyle}>Visitor Name</label>
                    <input type="text" value={formData.visitorName}
                      onChange={e => /^[a-zA-Z\s]*$/.test(e.target.value) && setFormData({ ...formData, visitorName: e.target.value })}
                      required style={inputStyle} />
                  </div>

                  <div style={rowStyle}>
                    <label style={labelStyle}>Phone Number</label>
                    <input type="tel" value={formData.phoneNumber} maxLength={10} pattern="\d{10}"
                      onChange={e => { const v = e.target.value.replace(/\D/g, ""); if (v.length <= 10) setFormData({ ...formData, phoneNumber: v }); }}
                      required style={inputStyle} />
                  </div>

                  <div style={{ textAlign: "right", paddingTop: "12px", fontSize: "16px", fontWeight: "bold", color: "#9f2b2b", borderTop: "2px solid #eee", marginTop: "4px" }}>
                    Total Amount To Pay: ₹{totalToPay}
                  </div>

                </div>
              </form>
            )}

            {/* ── STEP 2: Booking Summary + Payment ── */}
            {modalStep === "confirm" && backendTicket && (
              <div>
                {/* Summary */}
                <div style={{ fontSize: "14px", lineHeight: "1.9", borderBottom: "2px dashed #ccc", paddingBottom: "12px", marginBottom: "14px" }}>
                  <div style={{ display: "flex", justifyContent: "space-between" }}>
                    <span><strong>Ticket Number:</strong></span><span>{backendTicket.ticketNumber}</span>
                  </div>
                  <div style={{ display: "flex", justifyContent: "space-between" }}>
                    <span><strong>Visitor Name:</strong></span><span>{savedPayload?.visitorName}</span>
                  </div>
                  <div style={{ display: "flex", justifyContent: "space-between" }}>
                    <span><strong>Visit Date:</strong></span><span>{savedPayload?.visitDate}</span>
                  </div>
                  <div style={{ display: "flex", justifyContent: "space-between" }}>
                    <span><strong>Visit Time:</strong></span><span>{savedPayload?.visitTime}</span>
                  </div>
                  <div style={{ display: "flex", justifyContent: "space-between" }}>
                    <span><strong>Category:</strong></span><span>{savedPayload?.visitorCategory}</span>
                  </div>
                  <div style={{ marginTop: "8px", background: "#f1f1f1", padding: "8px", borderRadius: "6px" }}>
                    <strong>Ticket Types:</strong>
                    {backendTicket.items?.map((item, idx) => (
                      <div key={idx} style={{ fontSize: "13px" }}>— {item.ticketType} (Qty: {item.quantity})</div>
                    ))}
                  </div>
                  <div style={{ marginTop: "10px", textAlign: "center", fontSize: "18px", fontWeight: "bold", color: "#d32f2f", border: "2px solid #ccc", padding: "8px", borderRadius: "6px" }}>
                    Amount: ₹{confirmTotalPrice}
                  </div>
                  {isPaymentConfirmed && (
                    <div style={{ display: "flex", justifyContent: "space-between", marginTop: "6px" }}>
                      <span><strong>Payment Mode:</strong></span><span>{paymentMode}</span>
                    </div>
                  )}
                </div>

                {/* Payment selection or success */}
                {!isPaymentConfirmed ? (
                  <div>
                    <label style={{ fontWeight: "bold", fontSize: "13px", display: "block", marginBottom: "6px" }}>
                      Select Payment Mode *
                    </label>
                    <select
                      value={paymentMode}
                      onChange={e => setPaymentMode(e.target.value)}
                      style={{ width: "100%", padding: "9px 10px", fontSize: "14px", fontWeight: "bold", border: "2px solid #ccc", borderRadius: "6px" }}
                    >
                      <option value="">-- Choose Payment Mode --</option>
                      {paymentOptions.map(opt => (
                        <option key={opt.lookupDtlId} value={opt.lookupValue}>{opt.lookupLabel}</option>
                      ))}
                    </select>
                  </div>
                ) : (
                  <div style={{ textAlign: "center", marginTop: "8px" }}>
                    <h5 style={{ color: "#2e7d32", fontWeight: "bold" }}>✓ PAYMENT SUCCESSFUL</h5>
                    <button
                      style={{ width: "100%", padding: "10px", backgroundColor: "#121212", color: "#fff", border: "none", borderRadius: "6px", fontWeight: "bold", cursor: "pointer", marginTop: "8px" }}
                      onClick={handlePrintTicket}
                    >
                      Print Ticket
                    </button>
                  </div>
                )}
              </div>
            )}

          </Modal.Body>

          <Modal.Footer style={{ justifyContent: "center", borderTop: "none" }}>
            {modalStep === "form" && (
              <Button type="submit" form="create-ticket-form"
                style={{ backgroundColor: "#9f2b2b", borderColor: "#9f2b2b", color: "white", width: "60%", padding: "10px", fontWeight: "700" }}>
                Proceed To Payment
              </Button>
            )}
            {modalStep === "confirm" && !isPaymentConfirmed && (
              <Button onClick={handleConfirmPayment}
                style={{ backgroundColor: "#d32f2f", borderColor: "#d32f2f", color: "white", width: "60%", padding: "10px", fontWeight: "700" }}>
                Confirm Payment
              </Button>
            )}
            {modalStep === "confirm" && isPaymentConfirmed && (
              <Button onClick={handleCloseCreateModal}
                style={{ backgroundColor: "#9f2b2b", borderColor: "#9f2b2b", color: "white", width: "60%", padding: "10px", fontWeight: "700" }}>
                New Booking
              </Button>
            )}
          </Modal.Footer>
        </Modal>

        {/* ── REFUND MODAL ───────────────────────────────────────────────── */}
        <Modal show={showRefundModal} onHide={() => setShowRefundModal(false)} centered>
          <Modal.Header closeButton className="bg-white border-0">
            <Modal.Title><strong>{refundData.ticketNumber}</strong></Modal.Title>
          </Modal.Header>

          <Modal.Body>
            <div style={{ marginBottom: "15px" }}>
              <strong>Ticket Types:</strong>
              {refundableTypes.length > 0 ? (
                refundableTypes.map((t) => (
                  <div key={t.ticketType} className="checkbox-row">
                    <input
                      type="checkbox"
                      checked={refundData.ticketTypes.includes(t.ticketType)}
                      onChange={(e) => {
                        const { checked } = e.target;
                        setRefundData(prev => {
                          let updatedTypes = [...prev.ticketTypes];
                          if (checked) updatedTypes.push(t.ticketType);
                          else updatedTypes = updatedTypes.filter(type => type !== t.ticketType);
                          return { ...prev, ticketTypes: updatedTypes };
                        });
                      }}
                    />
                    <label>
                      {ticketTypes.find(tt => tt.lookupValue === t.ticketType)?.lookupLabel || t.ticketType}
                    </label>
                  </div>
                ))
              ) : (
                <span> No refundable ticket types available.</span>
              )}
            </div>

            <Form>
              <Form.Group className="mb-3">
                <Form.Control
                  type="text"
                  placeholder="Enter reason for refund"
                  value={refundData.reason}
                  onChange={e => setRefundData({ ...refundData, reason: e.target.value })}
                />
              </Form.Group>
            </Form>
          </Modal.Body>

          <Modal.Footer>
            <Button variant="secondary" onClick={() => setShowRefundModal(false)}>Cancel</Button>
            <Button
              onClick={handleRefund}
              style={{ backgroundColor: "#9f2b2b", borderColor: "#9f2b2b", color: "white" }}
            >
              {refundApprovalRequired ? "Submit to Admin" : "Refund"}
            </Button>
          </Modal.Footer>
        </Modal>

      </div>
    </div>
  );
};

export default BookingForm;