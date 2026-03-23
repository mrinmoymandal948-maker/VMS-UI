import React from "react";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import Login from "./components/Login";
import BookingForm from "./components/BookingForm";
import HomePage from "./pages/HomePage";
import NotFound from "./pages/NotFound";
import TicketConfirmation from "./components/TicketConfirmation";
import Header from "./components/Header";
import AdminPanel from "./components/AdminPanel"; // Import the new component
import { useAuth } from "./context/AuthContext";
import { Navigate } from "react-router-dom";

const ProtectedRoute = ({ children }) => {
  const { user } = useAuth();

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  return children;
};

const App = () => {
  return (
    <Router>
      {/* Header stays here so it appears on every page */}
      <Header />
      <main>
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/login" element={<Login />} />
          <Route path="*" element={<NotFound />} />
          <Route path="/booking" element={<ProtectedRoute><BookingForm /></ProtectedRoute>} />
          <Route path="/confirmation" element={<ProtectedRoute><TicketConfirmation /></ProtectedRoute>} />
          <Route path="/admin-panel" element={<ProtectedRoute><AdminPanel /></ProtectedRoute>} />
          <Route path="/admin/dashboard" element={<ProtectedRoute><AdminPanel /></ProtectedRoute>} />
          <Route path="/admin/users" element={<ProtectedRoute><AdminPanel /></ProtectedRoute>} />
          <Route path="/admin/reports" element={<ProtectedRoute><AdminPanel /></ProtectedRoute>} />
          <Route path="/admin/refunds" element={<ProtectedRoute><AdminPanel /></ProtectedRoute>} />

        </Routes>
      </main>
    </Router>
  );
};

export default App;