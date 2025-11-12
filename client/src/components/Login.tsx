import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import "./Login.css";
import { Logo } from "./Logo";

export const Login = () => {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    if (!username || !password) {
      setError("Please enter both your username and password.");
      return;
    }

    setLoading(true);

    const body = `username=${encodeURIComponent(username)}&password=${encodeURIComponent(password)}`;

    try {
      const authRes = await fetch("/guacamole/api/tokens", {
        method: "POST",
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
        body: body,
      });

      if (authRes.ok) {
        const authData = await authRes.json();
        sessionStorage.setItem("authToken", authData.authToken);
        localStorage.setItem("GUAC_AUTH", JSON.stringify(authData));

        navigate("/viewer");
      } else {
        setError("Invalid username or password. Please try again.");
      }
    } catch (err) {
      setError("A network error occurred. Please check your connection.");
      setTimeout(() => {
        setError("");
      }, 2000);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-container">
      <form className="login-form" onSubmit={handleSubmit}>
        <Logo size={188} />

        {error && <p className="error-message">{error}</p>}

        <div className="input-group">
          <label htmlFor="username">Username</label>
          <input
            type="text"
            id="username"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            required
            disabled={loading}
          />
        </div>

        <div className="input-group">
          <label htmlFor="password">Password</label>
          <input
            type="password"
            id="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            disabled={loading}
          />
        </div>

        <button type="submit" className="login-button" disabled={loading}>
          {loading ? "Logging In..." : "Log In"}
        </button>
      </form>
    </div>
  );
};

