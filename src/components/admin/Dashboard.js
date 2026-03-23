import React from "react";
import { Card, Row, Col } from "react-bootstrap";
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

const Dashboard = ({ dashboardSummary, refundApprovalRequired }) => {

  if (!dashboardSummary) return null;

  return (
    <>
      {/* paste dashboard section here exactly */}
      <>
              <>
                <Row className="dashboard-cards-row g-3">
                  {/* Card 1: Blue Theme */}
                  <Col md={3}>
                    <Card className="parameterCards sharp-shadow-blue" style={{ border: '1px solid #1a237e' }}>
                      <div className="text-center py-2">
                        <h6 style={{ color: '#1a237e', fontWeight: 'bold', marginBottom: '0', fontSize: '14px' }}>Total Tickets Today</h6>
                      </div>
                      <div style={{ borderBottom: '1px solid #e0e0e0', margin: '0 15px' }}></div>
                      <div className="d-flex text-center py-2">
                        <div style={{ flex: 1, borderRight: '1px solid #e0e0e0' }}>
                          <div style={{ fontStyle: 'italic', fontSize: '12px', color: '#1a237e' }}>Count</div>
                          <div className="fw-bold" style={{ fontSize: '16px', color: '#1a237e' }}>{dashboardSummary.totalTickets}</div>
                        </div>
                        <div style={{ flex: 1 }}>
                          <div style={{ fontStyle: 'italic', fontSize: '12px', color: '#1a237e' }}>Status</div>
                          <div className="fw-bold" style={{ fontSize: '16px', color: '#1a237e' }}>Active</div>
                        </div>
                      </div>
                    </Card>
                  </Col>

                  {/* Card 2: Light Blue Theme */}
                  <Col md={3}>
                    <Card className="parameterCards sharp-shadow-lightblue" style={{ border: '1px solid #3498db' }}>
                      <div className="text-center py-2">
                        <h6 style={{ color: '#3498db', fontWeight: 'bold', marginBottom: '0', fontSize: '14px' }}>Total Collection</h6>
                      </div>
                      <div style={{ borderBottom: '1px solid #e0e0e0', margin: '0 15px' }}></div>
                      <div className="d-flex text-center py-2">
                        <div style={{ flex: 1, borderRight: '1px solid #e0e0e0' }}>
                          <div style={{ fontStyle: 'italic', fontSize: '12px', color: '#3498db' }}>Type</div>
                          <div className="fw-bold" style={{ fontSize: '16px', color: '#3498db' }}>Gross</div>
                        </div>
                        <div style={{ flex: 1 }}>
                          <div style={{ fontStyle: 'italic', fontSize: '12px', color: '#3498db' }}>Amount</div>
                          <div className="fw-bold" style={{ fontSize: '16px', color: '#3498db' }}>₹{dashboardSummary.totalRevenue}</div>
                        </div>
                      </div>
                    </Card>
                  </Col>

                  {/* Card 3: Red Theme */}
                  <Col md={3}>
                    <Card className="parameterCards sharp-shadow-red" style={{ border: '1px solid #c0392b' }}>
                      <div className="text-center py-2">
                        <h6 style={{ color: '#c0392b', fontWeight: 'bold', marginBottom: '0', fontSize: '14px' }}>Total Refund</h6>
                      </div>
                      <div style={{ borderBottom: '1px solid #e0e0e0', margin: '0 15px' }}></div>
                      <div className="d-flex text-center py-2">
                        <div style={{ flex: 1, borderRight: '1px solid #e0e0e0' }}>
                          <div style={{ fontStyle: 'italic', fontSize: '12px', color: '#c0392b' }}>Status</div>
                          <div className="fw-bold" style={{ fontSize: '16px', color: '#c0392b' }}>Processed</div>
                        </div>
                        <div style={{ flex: 1 }}>
                          <div style={{ fontStyle: 'italic', fontSize: '12px', color: '#c0392b' }}>Amount</div>
                          <div className="fw-bold" style={{ fontSize: '16px', color: '#c0392b' }}>₹{dashboardSummary.totalRefund}</div>
                        </div>
                      </div>
                    </Card>
                  </Col>

                  {/* Card 4: Green Theme */}
                  <Col md={3}>
                    <Card className="parameterCards sharp-shadow-green" style={{ border: '1px solid #27ae60' }}>
                      <div className="text-center py-2">
                        <h6 style={{ color: '#27ae60', fontWeight: 'bold', marginBottom: '0', fontSize: '14px' }}>Net Revenue</h6>
                      </div>
                      <div style={{ borderBottom: '1px solid #e0e0e0', margin: '0 15px' }}></div>
                      <div className="d-flex text-center py-2">
                        <div style={{ flex: 1, borderRight: '1px solid #e0e0e0' }}>
                          <div style={{ fontStyle: 'italic', fontSize: '12px', color: '#27ae60' }}>Type</div>
                          <div className="fw-bold" style={{ fontSize: '16px', color: '#27ae60' }}>Actual</div>
                        </div>
                        <div style={{ flex: 1 }}>
                          <div style={{ fontStyle: 'italic', fontSize: '12px', color: '#27ae60' }}>Amount</div>
                          <div className="fw-bold" style={{ fontSize: '16px', color: '#27ae60' }}>₹{dashboardSummary.netRevenue}</div>
                        </div>
                      </div>
                    </Card>
                  </Col>
                </Row>

                <div className="admin-grid" style={{ marginTop: "35px" }}>
                  <div className="chart-box">
                    <div className="chart-header">
                      <h3>Ticket Overview</h3>
                    </div>
                    <ResponsiveContainer width="100%" height={320}>
                      <BarChart
                        data={[
                          {
                            name: "Today",
                            Tickets: dashboardSummary.totalTickets,
                            Refund: dashboardSummary.totalRefund
                          }
                        ]}
                      >
                        <CartesianGrid stroke="#e6edf7" strokeDasharray="3 3" />
                        <XAxis dataKey="name" />
                        <YAxis />
                        <Tooltip />
                        <Legend />
                        <Bar dataKey="Tickets" fill="#1f66cc" radius={[4, 4, 0, 0]} />
                        <Bar dataKey="Refund" fill="#5b8bd9" radius={[4, 4, 0, 0]} />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>

                  <div className="chart-box">
                    <div className="chart-header">
                      <h3>Revenue Overview</h3>
                    </div>
                    <ResponsiveContainer width="100%" height={320}>
                      <BarChart
                        data={[
                          {
                            name: "Today",
                            Revenue: dashboardSummary.totalRevenue,
                            Net: dashboardSummary.netRevenue
                          }
                        ]}
                      >
                        <CartesianGrid stroke="#e6edf7" strokeDasharray="3 3" />
                        <XAxis dataKey="name" />
                        <YAxis />
                        <Tooltip />
                        <Legend />
                        <Bar dataKey="Revenue" fill="#1f66cc" radius={[4, 4, 0, 0]} />
                        <Bar dataKey="Net" fill="#8faee8" radius={[4, 4, 0, 0]} />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </div>
              </>
            )}
      </>
    </>
  );
};

export default Dashboard;