import React, { useState } from "react";

/**
 * Login component renders a simple username/password form and calls onLogin handler.
 * Shows error messages passed via props.
 *
 * Props:
 * - onLogin: (username, password) => Promise<void>
 * - loading: boolean
 * - error: string | null
 */
export default function Login({ onLogin, loading = false, error = null }) {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");

  const disabled = loading || !username || !password;

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (disabled) return;
    await onLogin(username, password);
  };

  return (
    <div className="auth-container">
      <div className="auth-card">
        <h1 className="app-title">Smart Task Organizer</h1>
        <p className="app-subtitle">Stay on top of your day</p>
        <form className="auth-form" onSubmit={handleSubmit}>
          <label className="input-label">
            Username
            <input
              className="input"
              type="text"
              autoComplete="username"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="Enter username"
            />
          </label>
          <label className="input-label">
            Password
            <input
              className="input"
              type="password"
              autoComplete="current-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Enter password"
            />
          </label>
          {error ? <div className="alert error">{error}</div> : null}
          <button type="submit" className="btn btn-primary btn-large" disabled={disabled}>
            {loading ? "Logging in..." : "Login"}
          </button>
        </form>
      </div>
    </div>
  );
}
