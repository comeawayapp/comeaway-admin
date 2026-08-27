import { useState, useMemo, useContext } from "react";
import { useNavigate, useSearchParams, Link } from "react-router-dom";
import { jwtDecode } from "jwt-decode";

import companyname from "../../assets/companyname.png";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import { AuthContext } from "../../context/authContext";
import { acceptTeamInvite } from "../../utils/API_SERVICE";

const MIN_PASSWORD_LENGTH = 6;

// The invite token is a JWT carrying the invitee's email and an expiry, so we
// can show who the link is for (and catch a stale link) before hitting the API.
const readInviteToken = (token) => {
  if (!token) return { valid: false, reason: "missing" };

  try {
    const payload = jwtDecode(token);
    const now = Math.floor(Date.now() / 1000);
    if (payload.exp && payload.exp < now) {
      return { valid: false, reason: "expired" };
    }
    return { valid: true, email: payload.email };
  } catch {
    return { valid: false, reason: "malformed" };
  }
};

function SetPassword() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { login: authLogin } = useContext(AuthContext);

  const token = searchParams.get("token") || "";
  const invite = useMemo(() => readInviteToken(token), [token]);

  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  // Set when the API itself rejects the token (400/404), e.g. already used.
  const [tokenRejected, setTokenRejected] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (password.length < MIN_PASSWORD_LENGTH) {
      toast.error(`Password must be at least ${MIN_PASSWORD_LENGTH} characters`);
      return;
    }
    if (password !== confirmPassword) {
      toast.error("Passwords do not match");
      return;
    }

    setLoading(true);
    try {
      const response = await acceptTeamInvite(token, password);
      toast.success("Password set. Signing you in...");
      // The API returns a JWT, so the invitee goes straight into the panel.
      authLogin(response.token, response.user);
      setTimeout(() => {
        navigate("/");
      }, 1000);
    } catch (error) {
      if (error.status === 400 || error.status === 404) {
        setTokenRejected(true);
      }
      toast.error(error.message || "Failed to set password");
    } finally {
      setLoading(false);
    }
  };

  const renderCardShell = (children) => (
    <>
      <div className="auth-screen">
        <div className="auth-card">
          <div className="auth-brand">
            <img src={companyname} alt="ComeAway" className="h-9" />
          </div>
          {children}
        </div>
      </div>
      <ToastContainer position="top-right" theme="dark" />
    </>
  );

  if (!invite.valid || tokenRejected) {
    const messages = {
      missing:
        "This link is missing its invitation token. Please open the link from your invitation email exactly as it was sent.",
      malformed:
        "This invitation link is not valid. Please open the link from your invitation email exactly as it was sent.",
      expired:
        "This invitation link has expired. Ask the person who invited you to send a new invitation.",
    };

    return renderCardShell(
      <>
        <h1 className="auth-title">Invitation Link Invalid</h1>
        <p className="auth-subtitle">
          {tokenRejected
            ? "This invitation link is invalid, has expired, or has already been used. Ask the person who invited you to send a new invitation."
            : messages[invite.reason]}
        </p>
        <Link
          to="/login"
          className="auth-submit auth-form"
          style={{ display: "flex", alignItems: "center", justifyContent: "center" }}
        >
          Go to Login
        </Link>
      </>
    );
  }

  return renderCardShell(
    <>
      <h1 className="auth-title">Set Your Password</h1>
      <p className="auth-subtitle">
        Choose a password to finish setting up your team account
        {invite.email ? " for " : "."}
        {invite.email && (
          <span style={{ color: "#ffffff", fontWeight: 600 }}>
            {invite.email}
          </span>
        )}
      </p>

      <form className="auth-form" onSubmit={handleSubmit}>
        <div className="mb-4">
          <label className="auth-label" htmlFor="password">
            New Password
          </label>
          <input
            type={showPassword ? "text" : "password"}
            id="password"
            className="auth-input"
            placeholder="At least 6 characters"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            autoComplete="new-password"
          />
        </div>
        <div className="mb-3">
          <label className="auth-label" htmlFor="confirm-password">
            Confirm Password
          </label>
          <input
            type={showPassword ? "text" : "password"}
            id="confirm-password"
            className="auth-input"
            placeholder="Re-enter your password"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            autoComplete="new-password"
          />
        </div>
        <label className="auth-checkbox mb-6">
          <input
            type="checkbox"
            checked={showPassword}
            onChange={(e) => setShowPassword(e.target.checked)}
          />
          Show password
        </label>
        <button type="submit" disabled={loading} className="auth-submit">
          {loading ? "Setting Password..." : "Set Password & Continue"}
        </button>
      </form>

      <p className="auth-footnote">
        Already have an account?{" "}
        <Link to="/login" className="auth-link">
          Log in
        </Link>
      </p>
    </>
  );
}

export default SetPassword;
