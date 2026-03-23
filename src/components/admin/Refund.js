import React, { useState } from "react";
import { Modal, Button, Form } from "react-bootstrap";
import Swal from "sweetalert2";

const Refund = ({ pendingRefunds, handleDecision }) => {

  const [showModal, setShowModal] = useState(false);
  const [selectedRefund, setSelectedRefund] = useState(null);
  const [actionType, setActionType] = useState(""); // APPROVED / REJECTED
  const [reason, setReason] = useState("");

  const openModal = (refund, type) => {
    setSelectedRefund(refund);
    setActionType(type);
    setReason("");
    setShowModal(true);
  };

  const handleConfirm = async () => {
    if (actionType === "REJECTED" && (!reason || reason.trim() === "")) {
      return;
    }

    try {
      await handleDecision(selectedRefund.id, actionType, reason);
      setShowModal(false);


      await Swal.fire({
        icon: actionType === "APPROVED" ? "success" : "error",
        title: actionType === "APPROVED" ? "Refund Approved" : "Refund Rejected",
        text:
          actionType === "APPROVED"
            ? "The refund has been approved successfully."
            : "The refund request has been rejected."
      });

    } catch (err) {
      console.error(err);

      await Swal.fire({
        icon: "error",
        title: "Action Failed",
        text:
          err?.response?.data?.message ||
          err?.message ||
          "Something went wrong while processing the refund."
      });
    }
  };

  return (
    <div style={{ display: "flex", justifyContent: "center" }}>
      <div
        className="login-card"
        style={{ marginTop: "30px", width: "100%", maxWidth: "1000px" }}
      >
        <h3
          className="card-subtitle"
          style={{ textAlign: "center", marginBottom: "30px" }}
        >
          Pending Refund Requests
        </h3>

        <table className="rsc-table" style={{ width: "100%" }}>
          <thead>
            <tr>
              <th>Ticket #</th>
              <th>Amount</th>
              <th>Reason</th>
              <th>Actions</th>
            </tr>
          </thead>

          <tbody>
            {pendingRefunds.length > 0 ? (
              pendingRefunds.map((req) => (
                <tr key={req.id}>
                  <td>{req.ticketNumber}</td>
                  <td>₹{req.refundAmount}</td>
                  <td>{req.reason}</td>

                  <td>
                    <div style={{ display: "flex", gap: "10px" }}>
                      <button
                        className="btn-submit"
                        onClick={() => openModal(req, "APPROVED")}
                      >
                        Accept
                      </button>

                      <button
                        className="btn-remove-small"
                        onClick={() => openModal(req, "REJECTED")}
                      >
                        Reject
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan="4" style={{ textAlign: "center", padding: "30px" }}>
                  No pending refund requests.
                </td>
              </tr>
            )}
          </tbody>
        </table>

        {/* ✅ Modal */}
        <Modal show={showModal} onHide={() => setShowModal(false)} centered>
          <Modal.Header closeButton>
            <Modal.Title>
              {actionType === "APPROVED" ? "Approve Refund" : "Reject Refund"}
            </Modal.Title>
          </Modal.Header>

          <Modal.Body>
            {actionType === "APPROVED" ? (
              <p>
                Are you sure you want to approve this refund request?
              </p>
            ) : (
              <>
                <p>Enter rejection reason:</p>
                <Form.Control
                  as="textarea"
                  rows={3}
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                />
              </>
            )}
          </Modal.Body>

          <Modal.Footer>
            <Button variant="secondary" onClick={() => setShowModal(false)}>
              Cancel
            </Button>

            <Button
              style={{
                backgroundColor: "#9f2b2b",
                borderColor: "#9f2b2b",
                color: "white"
              }}
              onClick={handleConfirm}
            >
              Confirm
            </Button>
          </Modal.Footer>
        </Modal>

      </div>
    </div>
  );
};

export default Refund;