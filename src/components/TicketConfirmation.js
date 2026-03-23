import React, { useState, useEffect } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { confirmPaymentApi, getLookupsApi } from "../api";

const TicketConfirmation = () => {
  const [paymentMode, setPaymentMode] = useState("");
  const [paymentOptions, setPaymentOptions] = useState([]);
  const [isConfirmed, setIsConfirmed] = useState(false);
  const [totalPrice, setTotalPrice] = useState(0);
  const location = useLocation();
  const navigate = useNavigate();

  const bookingData = location.state?.bookingData;
  const backendTicket = location.state?.backendTicket;

  useEffect(() => {
    const loadPaymentModes = async () => {
      try {
        const modes = await getLookupsApi("PAYMENT_MODE");
        setPaymentOptions(modes); // NO FILTERING
      } catch (e) {
        console.error("Failed to load payment modes", e);
      }
    };

    loadPaymentModes();

    if (backendTicket?.items) {
      const total = backendTicket.items.reduce(
        (sum, item) => sum + (item.amount || 0),
        0
      );
      setTotalPrice(total);
    }
  }, [backendTicket]);

  const handleProceed = async () => {
    if (!paymentMode) {
      alert("Please select a mode of payment");
      return;
    }

    const generateReferenceNumber = (mode) => {
      if (!mode) return "NA";

      const prefix = mode.substring(0, 3).toUpperCase();
      const timestamp = Date.now();
      const random = Math.floor(1000 + Math.random() * 9000);

      return `${prefix}-${timestamp}-${random}`;
    };


    const paymentPayload = {
      ticketNumber: backendTicket.ticketNumber,
      paymentMode,
      amountPaid: totalPrice,
      referenceNumber: generateReferenceNumber(paymentMode)
    };

    try {
      await confirmPaymentApi(paymentPayload);
      setIsConfirmed(true);
    } catch (error) {
      alert(
        "Error saving payment: " +
          (error.response?.data?.message || "Check connection")
      );
    }
  };

  const bigButtonStyle = {
    width: "100%",
    padding: "15px",
    backgroundColor: "#d32f2f",
    color: "#fff",
    border: "none",
    fontSize: "18px",
    fontWeight: "bold",
    cursor: "pointer",
    marginTop: "20px"
  };

  if (!backendTicket) {
    return (
      <div className="page-wrapper" style={{ textAlign: "center", marginTop: "50px" }}>
        <h2 style={{ fontWeight: "bold" }}>
          No booking data found. Please restart the process.
        </h2>
        <button
          onClick={() => navigate("/booking")}
          style={{ ...bigButtonStyle, width: "250px" }}
        >
          Go Back
        </button>
      </div>
    );
  }

  return (
    <div
      className="page-wrapper"
      style={{
        backgroundColor: "#f4f4f4",
        minHeight: "calc(100vh - 60px)",
        fontFamily: "Arial, sans-serif"
      }}
    >
      <style>
        {`
          @media print {
            body * { visibility: hidden; }
            .printable-ticket, .printable-ticket * { visibility: visible; }
            .printable-ticket {
              position: absolute;
              left: 0;
              top: 0;
              width: 100%;
              padding: 20px;
              color: #000 !important;
              font-family: 'Courier New', Courier, monospace;
            }
            .no-print { display: none !important; }
          }
        `}
      </style>

      <div
        className="site-header no-print"
        style={{
          backgroundColor: "#121212",
          color: "#fff",
          textAlign: "center",
          height: "10px",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          borderBottom: "5px solid #d32f2f"
        }}
      >
      </div>

      <div
        className="form-container-main"
        style={{
          maxWidth: "600px",
          backgroundColor: "#fff",
          padding: "20px",
          boxShadow: "0 4px 15px rgba(0,0,0,0.1)",
          borderTop: "8px solid #d32f2f"
        }}
      >
        <div className="printable-ticket">
          <h2 style={{ textAlign: "center", fontWeight: "900", marginBottom: "12px" }}>
            {isConfirmed ? "TICKET" : "Booking Summary"}
          </h2>

          <div
            style={{
              fontSize: "16px",
              lineHeight: "1.7",
              fontWeight: "bold",
              borderBottom: "2px dashed #000",
              paddingBottom: "10px",
              textAlign: "center"
            }}
          >
            <p><strong>Ticket Number:</strong> {backendTicket.ticketNumber}</p>
            <p><strong>Visitor Name:</strong> {bookingData?.visitorName}</p>
            <p><strong>Visit Date:</strong> {bookingData?.visitDate}</p>
            <p><strong>Visit Time:</strong> {bookingData?.visitTime}</p>
            <p><strong>Category:</strong> {bookingData?.visitorCategory}</p>
            <div style={{ marginTop: "10px", backgroundColor: "#eee", padding: "10px" }}>
              <strong>Ticket Types:</strong>
              {backendTicket.items?.map((item, idx) => (
                <div key={idx}>
                  - {item.ticketType} (Qty: {item.quantity})
                </div>
              ))}
            </div>

            <p style={{ fontSize: "24px", marginTop: "10px", color: "#d32f2f", border: "2px solid #000", padding: "8px" }}>
              <strong>Amount Paid: ₹{totalPrice}</strong>
            </p>

            {isConfirmed && (
              <p><strong>Payment Mode:</strong> {paymentMode}</p>
            )}
          </div>

          <p style={{ textAlign: "center", fontSize: "12px", marginTop: "10px" }}>
            *** Keep this ticket safe for entry ***
          </p>
        </div>

        {!isConfirmed ? (
          <div className="no-print" style={{ marginTop: "20px" }}>
            <label style={{ fontWeight: "bold", marginBottom: "10px" }}>
              Select Payment Mode *
            </label>
            <select
              value={paymentMode}
              onChange={(e) => setPaymentMode(e.target.value)}
              style={{
                width: "100%",
                padding: "12px",
                fontSize: "16px",
                fontWeight: "bold",
                border: "2px solid #000"
              }}
            >
              <option value="">-- Choose Payment Mode --</option>
              {paymentOptions.map(opt => (
                <option key={opt.lookupDtlId} value={opt.lookupValue}>
                  {opt.lookupLabel}
                </option>
              ))}
            </select>

            <button style={bigButtonStyle} onClick={handleProceed}>
              Confirm Payment
            </button>
          </div>
        ) : (
          <div className="no-print" style={{ textAlign: "center", marginTop: "20px" }}>
            <h2 style={{ color: "#2e7d32" }}>PAYMENT SUCCESSFUL</h2>
            <button
              style={{ ...bigButtonStyle, backgroundColor: "#121212" }}
              onClick={() => window.print()}
            >
              Print Ticket
            </button>
            <button style={bigButtonStyle} onClick={() => navigate("/booking")}>
              New Booking
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default TicketConfirmation;
