import React from "react";
import { Card, Button, Modal, Form, Row, Col } from "react-bootstrap";

const Users = ({
  userList,
  searchTerm,
  setSearchTerm,
  showCreateForm,
  setShowCreateForm,
  newUser,
  setNewUser,
  handleCreateUser,
  handleDelete,
  message
}) => {
const [showDeleteModal, setShowDeleteModal] = React.useState(false);
const [selectedUser, setSelectedUser] = React.useState(null);

  return (
    <>
      {/* paste Users section here */}
      <>
              <div className="users-section-container p-4">
                <Card style={{ maxWidth: 900, margin: "0 auto", padding: 20 }}>
                  <Card.Header className="bg-white border-0">
                    <h3>User Management</h3>
                  </Card.Header>

                  {/* Search + Create Button */}
                  <div className="d-flex mb-3" style={{ gap: "10px" }}>
                    <Form.Control
                      type="text"
                      placeholder="Search by username..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      style={{ flex: 1 }}
                    />
                    <Button
                      onClick={() => setShowCreateForm(true)}
                      style={{ backgroundColor: "#9f2b2b", borderColor: "#9f2b2b", color: "white" }}
                    >
                      + Create Ticket Issuer
                    </Button>
                  </div>

                  {/* Users Table */}
                  <table className="table table-striped">
                    <thead>
                      <tr>
                        <th>Username</th>
                        <th>Status</th>
                        <th>Action</th>
                      </tr>
                    </thead>
                    <tbody>
                      {userList
                        .filter(u => u.username.toLowerCase().includes(searchTerm.toLowerCase()))
                        .map(u => (
                          <tr key={u.id}>
                            <td>{u.username}</td>
                            <td>
                              <span className={`badge ${u.active ? "bg-success" : "bg-secondary"}`}>
                                {u.active ? "ACTIVE" : "INACTIVE"}
                              </span>
                            </td>
                            <td>
                              {u.role !== "ADMIN" && (
                                <Button
                                  style={{
                                    backgroundColor: "#9f2b2b",
                                    borderColor: "#9f2b2b",
                                    color: "white"
                                  }}
                                  onClick={() => {
                                    setSelectedUser(u);
                                    setShowDeleteModal(true);
                                  }}
                                >
                                  Remove
                                </Button>
                              )}
                            </td>
                          </tr>
                        ))}
                    </tbody>
                  </table>
                </Card>

                {/* Create Modal */}
                <Modal show={showCreateForm} onHide={() => setShowCreateForm(false)} centered>
                  <Modal.Header closeButton>
                    <Modal.Title>Create Ticket Issuer</Modal.Title>
                  </Modal.Header>
                  <Modal.Body>
                    <Form onSubmit={handleCreateUser}>
                      <Form.Group as={Row} className="mb-3">
                        <Form.Label column sm={3}>
                          Username
                        </Form.Label>
                        <Col sm={9}>
                          <Form.Control
                            type="text"
                            value={newUser.username}
                            onChange={(e) =>
                              setNewUser({ ...newUser, username: e.target.value })
                            }
                            required
                          />
                        </Col>
                      </Form.Group>

                      <Form.Group as={Row} className="mb-3">
                        <Form.Label column sm={3}>
                          Password
                        </Form.Label>
                        <Col sm={9}>
                          <Form.Control
                            type="password"
                            value={newUser.password}
                            onChange={(e) =>
                              setNewUser({ ...newUser, password: e.target.value })
                            }
                            required
                          />
                        </Col>
                      </Form.Group>
                      {message && <p className="text-danger">{message}</p>}
                      <div className="d-flex justify-content-end gap-2">
                        <Button variant="secondary" onClick={() => setShowCreateForm(false)}>Cancel</Button>
                        <Button
                          type="submit"
                          style={{ backgroundColor: "#9f2b2b", borderColor: "#9f2b2b", color: "white" }}
                        >
                          Create
                        </Button>
                      </div>
                    </Form>
                  </Modal.Body>
                </Modal>

                <Modal
                  show={showDeleteModal}
                  onHide={() => setShowDeleteModal(false)}
                  centered
                >
                  <Modal.Header closeButton>
                    <Modal.Title>Confirm Delete</Modal.Title>
                  </Modal.Header>

                  <Modal.Body>
                    Are you sure you want to remove{" "}
                    <strong>{selectedUser?.username}</strong>?
                  </Modal.Body>

                  <Modal.Footer className="justify-content-center">
                    <Button
                      variant="secondary"
                      onClick={() => setShowDeleteModal(false)}
                    >
                      Cancel
                    </Button>

                    <Button
                      style={{
                        backgroundColor: "#9f2b2b",
                        borderColor: "#9f2b2b",
                        color: "white"
                      }}
                      onClick={() => {
                        handleDelete(selectedUser.id);
                        setShowDeleteModal(false);
                      }}
                    >
                      Remove
                    </Button>
                  </Modal.Footer>
                </Modal>
              </div>
      </>
    </>
  );
};

export default Users;