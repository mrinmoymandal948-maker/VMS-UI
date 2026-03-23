import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { loginUser } from "../api";
import { FaUser, FaLock, FaEye, FaEyeSlash } from "react-icons/fa";
import bgImage from "../assets/bernd-dittrich-Nr2c0krCK-s-unsplash.jpg";

const Login = () => {
  const [username, setUsername] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setIsLoading(true);

    try {
      const userData = await loginUser(username, password);

      // Store token if backend returns it
      if (userData.token) {
        localStorage.setItem("token", userData.token);
      }

      login(userData);

      // ROLE BASED REDIRECT
      if (userData.role === "ADMIN") {
        navigate("/admin/dashboard");
      } else {
        navigate("/booking");
      }

    } catch (err) {
      if (err.response && err.response.status === 401) {
        setError("Invalid username or password");
      } else {
        setError("Could not connect to the server.");
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
      <div className="login-screen">
        <div className="login-container-wrapper">

          {/* Right Pane: Form */}
          <div className="login-left-pane">
            <div className="login-card">
              <h2 className="login-title">Sign In</h2>
              {error && <p className="error-text">{error}</p>}

              <form onSubmit={handleSubmit} className="login-form-layout">

                {/* Username */}
                <div className="input-field icon-input">
                  <FaUser className="input-icon left-icon" />
                  <input
                    type="text"
                    placeholder="Username"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    required
                  />
                </div>

                {/* Password */}
                <div className="input-field icon-input">
                  <FaLock className="input-icon left-icon" />
                  <input
                    type={showPassword ? "text" : "password"}
                    placeholder="Password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                  />
                  {showPassword ? (
                    <FaEyeSlash
                      className="input-icon right-icon"
                      onClick={() => setShowPassword(false)}
                    />
                  ) : (
                    <FaEye
                      className="input-icon right-icon"
                      onClick={() => setShowPassword(true)}
                    />
                  )}
                </div>

                <div className="login-btn-container">
                  <button type="submit" className="btn-login" disabled={isLoading}>
                    {isLoading ? "Loading..." : "Login"}
                  </button>
                  <button
                    type="button"
                    className="btn-reset"
                    onClick={() => {
                      setUsername("");
                      setPassword("");
                      setError("");
                    }}
                  >
                    Reset
                  </button>
                </div>

              </form>

              {/* --- CORRECTED ADMIN PANEL BUTTON --- */}
              <div style={{ marginTop: "20px" }}>

              </div>
              {/* -------------------------------------- */}

            </div>
          </div>

          {/* Left Pane: Branding */}
          {/* Left Pane: Branding */}
          <div
            className="login-right-pane"
            style={{
              backgroundImage: `
                linear-gradient(
                  212.38deg,
                  rgba(244, 82, 80, 0.85) 0%,
                  rgba(65, 78, 102, 0.65) 100%
                ),
                url(${bgImage})
              `,
            }}
          >
            <div className="branding-text">
              <h1>Visitor Management System</h1>
            </div>
          </div>

        </div>
      </div>
    );
};

export default Login;