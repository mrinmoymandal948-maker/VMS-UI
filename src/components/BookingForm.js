import React, { useState, useEffect } from "react";
import { Card, Row, Col, Form } from "react-bootstrap";
import { IoMdArrowDropdown } from "react-icons/io";
import { Modal, Button } from "react-bootstrap";
import { TicketStatus, TicketType, ConfigKey } from "../utils/constants";
import Swal from "sweetalert2";
import api, {
  getLookupsApi,
  createBooking,
  requestRefundApi,
  calculatePriceApi,
  getApplicationConfigApi,
  getTodayBookingsApi
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
  const [activeForm, setActiveForm] = useState("create");
  const [refundData, setRefundData] = useState({ ticketNumber: "", ticketTypes: [], reason: "" });
  const [refundableTypes, setRefundableTypes] = useState([]);
  const [alreadyRefunded, setAlreadyRefunded] = useState([]);
  const [currentTime, setCurrentTime] = useState("");
  const [refundTicket, setRefundTicket] = useState(null);
  const [refundStatusMessage, setRefundStatusMessage] = useState("");
  const [totalToPay, setTotalToPay] = useState(0);
  const [filterType, setFilterType] = useState("date");
  const [filterDate, setFilterDate] = useState("");
  const [filterMonth, setFilterMonth] = useState("");
  const [filterYear, setFilterYear] = useState("");
  const [fromDate, setFromDate] = useState("");
  const [toDate, setToDate] = useState("");
  const [showRefundModal, setShowRefundModal] = useState(false);
  const [selectedBooking, setSelectedBooking] = useState(null);

  const [formData, setFormData] = useState({
    visitorName: "",
    phoneNumber: "",
    visitDate: new Date().toISOString().split("T")[0],
    visitorCategory: "",
    numVisitors: 1
  });

  const handleOpenRefundModal = (ticketNumber) => {
    const booking = todayBookings.find(b => b.ticketNumber === ticketNumber);
    if (!booking) return;

    const freshItems = booking.items.map(item => ({ ...item }));

    setSelectedBooking(booking);
    setRefundableTypes(freshItems);

    setRefundData({
      ticketNumber,
      ticketTypes: [],
      reason: ""
    });

    setShowRefundModal(true);
  };

  const isToday = (dateString) => {
    if (!dateString) return false;

    try {
      // This handles both ISO strings from backend and local JS dates
      const d = new Date(dateString);
      const today = new Date();

      return (
        d.getDate() === today.getDate() &&
        d.getMonth() === today.getMonth() &&
        d.getFullYear() === today.getFullYear()
      );
    } catch (e) {
      console.error("Date parsing error", e);
      return false;
    }
  };

  const [selectedEntries, setSelectedEntries] = useState({});

  useEffect(() => {
    const fetchConfig = async () => {
      try {
        const centreId = user?.centre?.id || 1;
        const configData = await getApplicationConfigApi(centreId);

        console.log("CONFIG DATA:", configData);

        const refundConfig = configData.find(
          c => c.configKey === "REFUND_APPROVAL_REQUIRED"
        );

        console.log("REFUND CONFIG:", refundConfig);

        setRefundApprovalRequired(
          refundConfig
            ? String(refundConfig.configValue).toLowerCase() === "true"
            : true
        );

      } catch (err) {
        console.error("Failed to fetch application config", err);
      }
    };

    fetchConfig();
  }, [user]);

  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const tab = params.get("tab");

    if (tab === "refund") {
      setActiveForm("refund");
    } else {
      setActiveForm("create");
    }
  }, [location.search]);

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
          const initialSelections = {};
          typeData.forEach(type => {
            initialSelections[type.lookupValue] = type.sortOrder === 1;
          });
          setSelectedEntries(initialSelections);
        } else {
          console.error("Failed to load ticket types:", typeData);
        }
      } catch (err) {
        console.error("Lookup Error:", err);
      }
    };
    loadData();
    return () => clearInterval(timerId);
  }, [user?.centre?.id]);

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

  useEffect(() => {
      const ticketToCheck = refundTicket || localStorage.getItem("refundTicket");
      if (!ticketToCheck) return;

      const pollId = setInterval(async () => {
        try {
          const res = await api.get(`/refunds/status/${ticketToCheck}`);

          if (res.data?.status === "APPROVED") {
            Swal.fire({
              icon: "success",
              title: "Refund Approved",
              text: `Refund approved for ${ticketToCheck}`
            });

            setTodayBookings(prev =>
              prev.map(bk => {
                if (bk.ticketNumber !== ticketToCheck) return bk;

                // Get refunded types from backend response (IMPORTANT)
                const refundedTypes = res.data?.refundedTypes || [];

                const updatedItems = bk.items.map(item =>
                  refundedTypes.includes(item.ticketType)
                    ? { ...item, quantity: 0 }
                    : item
                );

                return {
                  ...bk,
                  items: updatedItems
                };
              })
            );

            localStorage.removeItem("refundTicket");
            setRefundTicket(null);
            clearInterval(pollId);
          }

          if (res.data?.status === "REJECTED") {
            const adminReason = res.data?.reason || "No reason provided";
            Swal.fire({
              icon: "error",
              title: "Refund Rejected",
              text: `Reason: ${adminReason}`
            });
            localStorage.removeItem("refundTicket");
            setRefundTicket(null);
            clearInterval(pollId);
          }

        } catch (err) { console.error(err); }
      }, 3000);
      return () => clearInterval(pollId);
    }, [refundTicket]);

  const fetchBookings = async () => {
    if (activeForm !== "refund") return;

    const centreId = user?.centre?.id || 1;

    try {
      let query = "";

      // Helper: zero-pad month
      const padMonth = (m) => String(Math.min(Math.max(Number(m), 1), 12)).padStart(2, "0");

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
          // Ensure valid YYYY-MM-DD format
          const startDate = new Date(fromDate).toISOString().split("T")[0];
          const endDate = new Date(toDate).toISOString().split("T")[0];
          query = `/bookings/filter/range?start=${startDate}&end=${endDate}&centreId=${centreId}`;
          break;

        default:
          Swal.fire({ icon: "error", title: "Invalid Filter", text: "Unknown filter type." });
          return;
      }

      const res = await api.get(query);
      setTodayBookings(res.data || []);

    } catch (err) {
      console.error("Booking fetch failed", err);
      Swal.fire({
        icon: "error",
        title: "Fetch Failed",
        text: err.response?.data?.message || "Server error. Please check the API or parameters."
      });
    }
  };

  const handleCheckboxChange = (value) => {
    const mainTicket = ticketTypes.find(t => t.sortOrder === 1);
    const isMainType = mainTicket?.lookupValue === value;

    if (isMainType) {
      const toggle = !selectedEntries[value];
      const updated = {};
      ticketTypes.forEach(type => {
        updated[type.lookupValue] = toggle;
      });
      setSelectedEntries(updated);
    } else {
      setSelectedEntries(prev => {
        const updated = {
          ...prev,
          [value]: !prev[value]
        };

        const anyOtherSelected = ticketTypes
          .filter(t => t.sortOrder !== 1)
          .some(t => updated[t.lookupValue]);

        if (anyOtherSelected) {
          updated[mainTicket.lookupValue] = true;
        }

        return updated;
      });
    }
  };

  const handleRefund = async () => {
      if (
        !refundData.ticketNumber ||
        refundData.ticketTypes.length === 0 ||
        !refundData.reason.trim()
      ) {
        Swal.fire({
          icon: "error",
          title: "Missing Information",
          text: "Please fill all refund fields"
        });
        return;
      }

      try {
        const refundAmount = refundableTypes
          .filter(t => refundData.ticketTypes.includes(t.ticketType))
          .reduce((sum, t) => sum + (Number(t.amount) || 0), 0);

        await requestRefundApi({ ...refundData });

        // Update the main bookings list immediately so the UI reflects the change
        setTodayBookings(prev =>
          prev.map(bk => {
            if (bk.ticketNumber !== refundData.ticketNumber) return bk;

            return {
              ...bk,
              // Mark items as 0 quantity locally so they are filtered out next time modal opens
              items: bk.items.map(item =>
                refundData.ticketTypes.includes(item.ticketType)
                  ? { ...item, quantity: 0 }
                  : item
              )
            };
          })
        );

        // Close the modal
        setShowRefundModal(false);

        if (refundApprovalRequired) {
          setRefundTicket(refundData.ticketNumber);
          Swal.fire({
            icon: "success",
            title: "Request Submitted",
            text: `Refund request submitted for admin approval (Amount: ₹${refundAmount})`
          });
        } else {
          Swal.fire({
            icon: "success",
            title: "Refund Successful",
            text: `Refunded Amount: ₹${refundAmount}`
          });
        }

        // Reset refund form data
        setRefundData({ ticketNumber: "", ticketTypes: [], reason: "" });

      } catch (err) {
        const message =
          err.response?.data?.message ||
          err.response?.data ||
          "Refund request failed";

        Swal.fire({
          icon: "error",
          title: "Refund Failed",
          text: message
        });
      }
    };


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
      .then(response => navigate("/confirmation", { state: { backendTicket: response, bookingData: payload } }))
      .catch(err => alert("Booking failed: " + (err.response?.data?.message || err.message)));
  };


  const visibleBookings = todayBookings;


  return (
    <div className="page-wrapper">

      {/* CENTER FORM */}
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

        {/* --- MAIN BOOKING FORM --- */}
        {activeForm === "create" && (
        <form onSubmit={handleSubmit} className="booking-form-vertical">
          <div className="form-item-row">
            <label>Visit Date</label>
            <input type="date" value={formData.visitDate} min={new Date().toISOString().split("T")[0]} onChange={e => setFormData({ ...formData, visitDate: e.target.value })} required />
          </div>

          <div className="form-item-row">
            <label>Visitor Category</label>
            <select value={formData.visitorCategory} onChange={e => setFormData({ ...formData, visitorCategory: e.target.value })} required >
              {categories.map(cat => (
                <option key={cat.lookupDtlId} value={cat.lookupValue}>{cat.lookupLabel}</option>
              ))}
            </select>
          </div>

          <div className="form-item-row">
            <label>Number of Visitors</label>
            <input type="number" min="1" value={formData.numVisitors} onChange={e => setFormData({ ...formData, numVisitors: e.target.value })} required />
          </div>

          <div className="form-item-row" style={{ alignItems: "flex-start" }}>
            <label>Entry Types</label>
            <div className="ticket-type-container">
              {ticketTypes.map(type => {
                const isMainType = type.sortOrder === 1;
                return (
                  <div key={type.lookupDtlId} className="show-booking-block">
                    <div className="checkbox-row">
                      <input
                        type="checkbox"
                        checked={!!selectedEntries[type.lookupValue]}
                        onChange={() => handleCheckboxChange(type.lookupValue)}
                        disabled={type.sortOrder === 1}
                      />
                      <label>{type.lookupLabel}</label>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          <div className="form-item-row">
            <label>Primary Visitor Name</label>
            <input type="text" value={formData.visitorName} onChange={e => /^[a-zA-Z\s]*$/.test(e.target.value) && setFormData({ ...formData, visitorName: e.target.value })} required />
          </div>

          <div className="form-item-row">
            <label>Phone Number</label>
            <input type="tel" value={formData.phoneNumber} maxLength={10} pattern="\d{10}" onChange={e => {
                const val = e.target.value.replace(/\D/g, "");
                if (val.length <= 10) setFormData({ ...formData, phoneNumber: val });
              }} required />
          </div>

          <div style={{ textAlign: "right", padding: "15px", fontSize: "22px", fontWeight: "bold", color: "#9f2b2b", borderTop: "2px solid #eee", marginTop: "10px" }}>
            Total Amount To Pay: ₹{totalToPay}
          </div>

          <div className="form-actions-center" style={{ display: "flex", gap: "10px", marginTop: "20px" }}>
            <button type="submit" className="btn-submit" style={{ flex: 1 }}>Proceed To Payment</button>
          </div>
        </form>
        )}

        {/* --- REFUND SECTION (Moved Outside Main Form) --- */}
        {activeForm === "refund" && (
          <>

            {/* FILTER BAR */}
            <div className="login-card" style={{ marginTop: "10px", padding: "10px" }}>
              <Card className="report-filter-card sharp-shadow-report">
                <Card.Body>
                  <Row className="align-items-end g-3">

                    {/* Filter Type */}
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
                              position: "absolute",
                              right: "10px",
                              top: "50%",
                              transform: "translateY(-50%)",
                              pointerEvents: "none",
                              fontSize: "18px",
                              color: "#555"
                            }}
                          />
                        </div>
                      </Form.Group>
                    </Col>

                    {/* Date */}
                    <Col md={2}>
                      <Form.Group>
                        <Form.Label style={{ opacity: filterType !== "date" ? 0.5 : 1 }}>
                          Date
                        </Form.Label>
                        <Form.Control
                          type="date"
                          disabled={filterType !== "date"}
                          value={filterDate}
                          onChange={(e) => setFilterDate(e.target.value)}
                        />
                      </Form.Group>
                    </Col>

                    {/* Month */}
                    <Col md={1}>
                      <Form.Group>
                        <Form.Label style={{ opacity: filterType !== "month" ? 0.5 : 1 }}>
                          Month
                        </Form.Label>
                        <Form.Control
                          type="number"
                          placeholder="1-12"
                          disabled={filterType !== "month"}
                          value={filterMonth}
                          onChange={(e) => setFilterMonth(e.target.value)}
                        />
                      </Form.Group>
                    </Col>

                    {/* Year */}
                    <Col md={1}>
                      <Form.Group>
                        <Form.Label style={{ opacity: filterType === "year" ? 1 : 0.5 }}>
                          Year
                        </Form.Label>
                        <Form.Control
                          type="number"
                          disabled={filterType !== "year"}
                          value={filterYear}
                          onChange={(e) => setFilterYear(e.target.value)}
                        />
                      </Form.Group>
                    </Col>

                    {/* Custom From */}
                    <Col md={2}>
                      <Form.Group>
                        <Form.Label style={{ opacity: filterType !== "custom" ? 0.5 : 1 }}>
                          From
                        </Form.Label>
                        <Form.Control
                          type="date"
                          disabled={filterType !== "custom"}
                          value={fromDate}
                          onChange={(e) => setFromDate(e.target.value)}
                        />
                      </Form.Group>
                    </Col>

                    {/* Custom To */}
                    <Col md={2}>
                      <Form.Group>
                        <Form.Label style={{ opacity: filterType !== "custom" ? 0.5 : 1 }}>
                          To
                        </Form.Label>
                        <Form.Control
                          type="date"
                          disabled={filterType !== "custom"}
                          value={toDate}
                          onChange={(e) => setToDate(e.target.value)}
                        />
                      </Form.Group>
                    </Col>

                    {/* Search Button */}
                    <Col md={2} className="d-flex align-items-end">
                      <button
                        className="btn-submit w-100"
                        onClick={(e) => {
                          e.preventDefault(); // prevent page reload
                          fetchBookings();
                        }}
                      >
                        Search
                      </button>
                    </Col>

                  </Row>
                </Card.Body>
              </Card>
            </div>


            {/* BOOKINGS TABLE */}
            <div
              className="bookings-table-container"
              style={{
                marginTop: "25px",
                border: "1px solid #ddd",
                borderRadius: "8px",
                padding: "15px",
                backgroundColor: "#f9f9f9"
              }}
            >

              <h3
                style={{
                  marginBottom: "15px",
                  borderBottom: "2px solid #9f2b2b",
                  paddingBottom: "5px"
                }}
              >
                Bookings
              </h3>

              <div style={{ maxHeight: "400px", overflowY: "auto" }}>
                <table style={{ width: "100%", borderCollapse: "collapse" }}>

                  <thead>
                    <tr style={{ backgroundColor: "#eee" }}>
                      <th style={{ padding: "10px" }}>Ticket No</th>
                      <th style={{ padding: "10px" }}>Time</th>
                      <th style={{ padding: "10px" }}>Details</th>
                      <th style={{ padding: "10px" }}>Action</th>
                    </tr>
                  </thead>

                  <tbody>
                    {visibleBookings.length > 0 ? (
                      visibleBookings.map((bk, idx) => {
                        const isFullyRefunded = bk.items?.every(i => i.quantity === 0);
                        const mainType = ticketTypes.find(t => t.sortOrder === 1)?.lookupValue;

                        const hasAdditionalTickets = bk.items?.some(
                          item => item.ticketType !== mainType && item.quantity > 0
                        );
                        return (
                          <tr key={idx}>
                            <td style={{ padding: "10px", fontWeight: "bold" }}>
                              {bk.ticketNumber}
                            </td>

                            <td style={{ padding: "10px" }}>
                              {bk.bookingTime
                                ? new Date(bk.bookingTime).toLocaleTimeString([], {
                                    hour: "2-digit",
                                    minute: "2-digit"
                                  })
                                : "-"}
                            </td>

                            <td style={{ padding: "10px" }}>
                              {bk.items
                                ?.map(i => i.ticketType)
                                .join(", ") || "-"}
                            </td>

                            <td style={{ padding: "10px" }}>
                              {isToday(bk.bookingTime) &&
                               !isFullyRefunded &&
                               hasAdditionalTickets &&
                               (bk.status === TicketStatus.PAID ||
                                bk.status === TicketStatus.CREATED ||
                                bk.status === TicketStatus.PARTIALLY_REFUNDED) ? (
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
                        <td colSpan="4" style={{ textAlign: "center", padding: "20px" }}>
                          No bookings found.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>

                <Modal show={showRefundModal} onHide={() => setShowRefundModal(false)} centered>
                  <Modal.Header closeButton className="bg-white border-0">
                    <Modal.Title><strong>{refundData.ticketNumber}</strong>
                    </Modal.Title>
                  </Modal.Header>

                  <Modal.Body>
                    <div style={{ marginBottom: "15px" }}>
                      <strong>Ticket Types:</strong>
                      {refundableTypes.length > 0 ? (
                        refundableTypes
                          .filter(t => {
                            const mainType = ticketTypes.find(tt => tt.sortOrder === 1)?.lookupValue;

                            return (
                              t.ticketType !== mainType &&
                              !alreadyRefunded.includes(t.ticketType)
                            );
                          })
                          .map((t) => (
                          <div key={t.ticketType} className="checkbox-row">
                            <input
                              type="checkbox"
                              checked={refundData.ticketTypes.includes(t.ticketType)}
                              onChange={(e) => {
                                const { checked } = e.target;

                                setRefundData(prev => {
                                  let updatedTypes = [...prev.ticketTypes];

                                  if (checked) {
                                    updatedTypes.push(t.ticketType);
                                  } else {
                                    updatedTypes = updatedTypes.filter(type => type !== t.ticketType);
                                  }

                                  return {
                                    ...prev,
                                    ticketTypes: updatedTypes
                                  };
                                });
                              }}
                            />
                            <label>
                              {ticketTypes.find(tt => tt.lookupValue === t.ticketType)?.lookupLabel || t.ticketType}
                            </label>
                          </div>
                        ))
                      ) : (
                        <span>Loading ticket types...</span>
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
                    <Button variant="secondary" onClick={() => setShowRefundModal(false)}>
                      Cancel
                    </Button>
                    <Button
                      onClick={handleRefund}
                      style={{
                        backgroundColor: "#9f2b2b",
                        borderColor: "#9f2b2b",
                        color: "white",
                      }}
                    >
                      {refundApprovalRequired ? "Submit to Admin" : "Refund"}
                    </Button>
                  </Modal.Footer>
                </Modal>
              </div>
            </div>

          </>
        )}
      </div>
    </div>
  );
};


export default BookingForm;