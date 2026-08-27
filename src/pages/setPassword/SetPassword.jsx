import { useState, useMemo, useContext } from "react";
import { useNavigate, useSearchParams, Link } from "react-router-dom";
import { jwtDecode } from "jwt-decode";

import logo from "../../assets/logo.png";
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
      <div className="flex items-center justify-center min-h-screen bg-white">
        <div className="bg-gray-800 p-8 rounded shadow-md w-full max-w-md">
          <div className="flex justify-center mb-6 gap-2">
            <img src={logo} alt="Logo" className="h-10 w-10" />
            <img src={companyname} alt="Company Name" className="h-10 w-60" />
          </div>
          {children}
        </div>
      </div>
      <ToastContainer />
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
        <h2 className="text-2xl font-bold mb-4 text-white text-center">
          Invitation Link Invalid
        </h2>
        <p className="text-gray-300 text-sm text-center mb-6">
          {tokenRejected
            ? "This invitation link is invalid, has expired, or has already been used. Ask the person who invited you to send a new invitation."
            : messages[invite.reason]}
        </p>
        <Link
          to="/login"
          className="block bg-white hover:bg-gray-200 text-black w-full font-bold py-2 px-4 rounded-full text-center"
        >
          Go to Login
        </Link>
      </>
    );
  }

  return renderCardShell(
    <>
      <h2 className="text-2xl font-bold mb-2 text-white text-center">
        Set Your Password
      </h2>
      <p className="text-gray-300 text-sm text-center mb-6">
        Choose a password to finish setting up your ComeAway team account
        {invite.email ? " for " : "."}
        {invite.email && (
          <span className="text-white font-medium">{invite.email}</span>
        )}
      </p>
      <form onSubmit={handleSubmit}>
        <div className="mb-4">
          <label
            className="block text-white text-sm font-bold mb-2"
            htmlFor="password"
          >
            New Password
          </label>
          <input
            type={showPassword ? "text" : "password"}
            id="password"
            className="shadow appearance-none border rounded w-full py-2 px-3 text-black bg-white leading-tight focus:outline-none focus:shadow-outline"
            placeholder="At least 6 characters"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            autoComplete="new-password"
          />
        </div>
        <div className="mb-3">
          <label
            className="block text-white text-sm font-bold mb-2"
            htmlFor="confirm-password"
          >
            Confirm Password
          </label>
          <input
            type={showPassword ? "text" : "password"}
            id="confirm-password"
            className="shadow appearance-none border rounded w-full py-2 px-3 text-black bg-white leading-tight focus:outline-none focus:shadow-outline"
            placeholder="Re-enter your password"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            autoComplete="new-password"
          />
        </div>
        <div className="mb-6">
          <label className="flex items-center text-gray-300 text-sm cursor-pointer">
            <input
              type="checkbox"
              className="mr-2"
              checked={showPassword}
              onChange={(e) => setShowPassword(e.target.checked)}
            />
            Show password
          </label>
        </div>
        <button
          type="submit"
          disabled={loading}
          className="bg-white hover:bg-gray-200 text-black w-full font-bold py-2 px-4 rounded-full focus:outline-none focus:shadow-outline disabled:opacity-60 disabled:cursor-not-allowed"
        >
          {loading ? "Setting Password..." : "Set Password & Continue"}
        </button>
      </form>
      <p className="text-gray-400 text-xs text-center mt-4">
        Already have an account?{" "}
        <Link to="/login" className="text-white underline">
          Log in
        </Link>
      </p>
    </>
  );
}

export default SetPassword;
