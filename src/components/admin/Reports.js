import React from "react";
import { Card, Row, Col, Form, Button } from "react-bootstrap";
import { IoMdArrowDropdown } from "react-icons/io";

const Reports = ({
  reportType,
  setReportType,
  dailyDate,
  setDailyDate,
  month,
  setMonth,
  year,
  setYear,
  customStart,
  setCustomStart,
  customEnd,
  setCustomEnd,
  fetchDailyReport,
  fetchMonthlyReport,
  fetchYearlyReport,
  fetchCustomReport,
  reportData
}) => {

  return (
    <>
      <div className="login-card" style={{ marginTop: "10px", padding: "10px" }}>
        {/* Applied sharp-shadow-report class here */}
        <Card className="report-filter-card sharp-shadow-report">
          <Card.Body>
            <Row className="align-items-end g-3">
              {/* Report Type */}
              <Col md={2}>
                <Form.Group>
                  <Form.Label>Report Type</Form.Label>
                  <div style={{ position: "relative" }}>
                    <Form.Select
                      value={reportType}
                      onChange={(e) => setReportType(e.target.value)}
                      style={{ paddingRight: "30px" }}
                    >
                      <option value="daily">Date</option>
                      <option value="monthly">Month</option>
                      <option value="yearly">Year</option>
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
                  <Form.Label style={{ opacity: reportType !== "daily" ? 0.5 : 1 }}>Date</Form.Label>
                  <Form.Control
                    type="date"
                    value={dailyDate}
                    disabled={reportType !== "daily"}
                    onChange={(e) => setDailyDate(e.target.value)}
                  />
                </Form.Group>
              </Col>

              {/* Month */}
              <Col md={1}>
                <Form.Group>
                  <Form.Label style={{ opacity: reportType !== "monthly" ? 0.5 : 1 }}>Month</Form.Label>
                  <Form.Control
                    type="number"
                    placeholder="1-12"
                    value={month}
                    disabled={reportType !== "monthly"}
                    onChange={(e) => setMonth(e.target.value)}
                  />
                </Form.Group>
              </Col>

              {/* Year */}
              <Col md={1}>
                <Form.Group>
                  <Form.Label style={{ opacity: reportType !== "yearly" && reportType !== "monthly" ? 0.5 : 1 }}>Year</Form.Label>
                  <Form.Control
                    type="number"
                    value={year}
                    disabled={reportType !== "yearly" && reportType !== "monthly"}
                    onChange={(e) => setYear(e.target.value)}
                  />
                </Form.Group>
              </Col>

              {/* Custom From */}
              <Col md={2}>
                <Form.Group>
                  <Form.Label style={{ opacity: reportType !== "custom" ? 0.5 : 1 }}>From</Form.Label>
                  <Form.Control
                    type="date"
                    value={customStart}
                    disabled={reportType !== "custom"}
                    onChange={(e) => setCustomStart(e.target.value)}
                  />
                </Form.Group>
              </Col>

              {/* Custom To */}
              <Col md={2}>
                <Form.Group>
                  <Form.Label style={{ opacity: reportType !== "custom" ? 0.5 : 1 }}>To</Form.Label>
                  <Form.Control
                    type="date"
                    value={customEnd}
                    disabled={reportType !== "custom"}
                    onChange={(e) => setCustomEnd(e.target.value)}
                  />
                </Form.Group>
              </Col>

              {/* Generate Button */}
              <Col md={2} className="d-flex align-items-end">
                <Button
                  className="btn-submit w-100"
                  style={{
                      backgroundColor: "#9f2b2b",
                      borderColor: "#9f2b2b",
                      color: "white"
                    }}
                  onClick={() => {
                    if (reportType === "daily") fetchDailyReport();
                    else if (reportType === "monthly") fetchMonthlyReport();
                    else if (reportType === "yearly") fetchYearlyReport();
                    else if (reportType === "custom") fetchCustomReport();
                  }}
                >
                  Generate Report
                </Button>
              </Col>
            </Row>
          </Card.Body>
        </Card>

        {/* Report Display Summary Cards */}
        {reportData && (
          <div style={{ marginTop: "50px" }}>
            <h3 style={{ textAlign: "center", marginBottom: "30px", fontWeight: "600" }}>Report Summary</h3>
            <Row className="g-3">
              {/* Card 1: Blue Shadow */}
              <Col md={3}>
                <Card className="parameterCards sharp-shadow-blue" style={{ border: '1px solid #1a237e' }}>
                  <div className="text-center py-2">
                    <h6 style={{ color: '#1a237e', fontWeight: 'bold', marginBottom: '0', fontSize: '14px' }}>Total Tickets</h6>
                  </div>
                  <div style={{ borderBottom: '1px solid #e0e0e0', margin: '0 15px' }}></div>
                  <div className="d-flex text-center py-2">
                    <div style={{ flex: 1, borderRight: '1px solid #e0e0e0' }}>
                      <div style={{ fontStyle: 'italic', fontSize: '12px', color: '#1a237e', opacity: 0.8 }}>Count</div>
                      <div className="fw-bold" style={{ fontSize: '16px', color: '#1a237e' }}>{reportData.totalTickets}</div>
                    </div>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontStyle: 'italic', fontSize: '12px', color: '#1a237e', opacity: 0.8 }}>Status</div>
                      <div className="fw-bold" style={{ fontSize: '16px', color: '#1a237e' }}>Closed</div>
                    </div>
                  </div>
                </Card>
              </Col>

              {/* Card 2: Light Blue Shadow */}
              <Col md={3}>
                <Card className="parameterCards sharp-shadow-lightblue" style={{ border: '1px solid #3498db' }}>
                  <div className="text-center py-2">
                    <h6 style={{ color: '#3498db', fontWeight: 'bold', marginBottom: '0', fontSize: '14px' }}>Total Collection</h6>
                  </div>
                  <div style={{ borderBottom: '1px solid #e0e0e0', margin: '0 15px' }}></div>
                  <div className="d-flex text-center py-2">
                    <div style={{ flex: 1, borderRight: '1px solid #e0e0e0' }}>
                      <div style={{ fontStyle: 'italic', fontSize: '12px', color: '#3498db', opacity: 0.8 }}>Type</div>
                      <div className="fw-bold" style={{ fontSize: '16px', color: '#3498db' }}>Gross</div>
                    </div>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontStyle: 'italic', fontSize: '12px', color: '#3498db', opacity: 0.8 }}>Amount</div>
                      <div className="fw-bold" style={{ fontSize: '16px', color: '#3498db' }}>₹{reportData.totalRevenue}</div>
                    </div>
                  </div>
                </Card>
              </Col>

              {/* Card 3: Red Shadow */}
              <Col md={3}>
                <Card className="parameterCards sharp-shadow-red" style={{ border: '1px solid #c0392b' }}>
                  <div className="text-center py-2">
                    <h6 style={{ color: '#c0392b', fontWeight: 'bold', marginBottom: '0', fontSize: '14px' }}>Total Refund</h6>
                  </div>
                  <div style={{ borderBottom: '1px solid #e0e0e0', margin: '0 15px' }}></div>
                  <div className="d-flex text-center py-2">
                    <div style={{ flex: 1, borderRight: '1px solid #e0e0e0' }}>
                      <div style={{ fontStyle: 'italic', fontSize: '12px', color: '#c0392b', opacity: 0.8 }}>Type</div>
                      <div className="fw-bold" style={{ fontSize: '16px', color: '#c0392b' }}>Refunded</div>
                    </div>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontStyle: 'italic', fontSize: '12px', color: '#c0392b', opacity: 0.8 }}>Amount</div>
                      <div className="fw-bold" style={{ fontSize: '16px', color: '#c0392b' }}>₹{reportData.totalRefund}</div>
                    </div>
                  </div>
                </Card>
              </Col>

              {/* Card 4: Green Shadow */}
              <Col md={3}>
                <Card className="parameterCards sharp-shadow-green" style={{ border: '1px solid #27ae60' }}>
                  <div className="text-center py-2">
                    <h6 style={{ color: '#27ae60', fontWeight: 'bold', marginBottom: '0', fontSize: '14px' }}>Net Revenue</h6>
                  </div>
                  <div style={{ borderBottom: '1px solid #e0e0e0', margin: '0 15px' }}></div>
                  <div className="d-flex text-center py-2">
                    <div style={{ flex: 1, borderRight: '1px solid #e0e0e0' }}>
                      <div style={{ fontStyle: 'italic', fontSize: '12px', color: '#27ae60', opacity: 0.8 }}>Type</div>
                      <div className="fw-bold" style={{ fontSize: '16px', color: '#27ae60' }}>Net</div>
                    </div>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontStyle: 'italic', fontSize: '12px', color: '#27ae60', opacity: 0.8 }}>Amount</div>
                      <div className="fw-bold" style={{ fontSize: '16px', color: '#27ae60' }}>₹{reportData.netRevenue}</div>
                    </div>
                  </div>
                </Card>
              </Col>
            </Row>
          </div>
        )}
      </div>
    </>
  );
};

export default Reports;