import { useState, useEffect, useContext } from "react";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import { AuthContext, ROLE_LABELS } from "../../../context/authContext";
import { getUserById, updateAdminDetails } from "../../../utils/API_SERVICE";

const Settings = () => {
  const { accessToken, user, role } = useContext(AuthContext);

  const [profile, setProfile] = useState({});
  const [password, setPassword] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (user && user._id) {
      async function fetchUserData() {
        try {
          const userData = await getUserById(user._id, accessToken);
          setProfile(userData);
        } catch {
          toast.error("Error fetching user data");
        }
      }
      fetchUserData();
    }
  }, [user, accessToken]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setProfile({ ...profile, [name]: value });
  };

  const handleUpdate = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      const updatedProfile = await updateAdminDetails(
        profile._id,
        profile.firstname,
        profile.lastname,
        profile.email,
        password,
        accessToken
      );
      setProfile(updatedProfile);
      setPassword("");
      toast.success("Profile updated successfully!");
    } catch {
      toast.error("Error updating profile");
    } finally {
      setSaving(false);
    }
  };

  const initials = `${profile.firstname?.[0] || ""}${
    profile.lastname?.[0] || ""
  }`.toUpperCase();

  return (
    <div className="page">
      <div className="page-header">
        <div>
          <h1 className="page-title">Profile Settings</h1>
          <p className="page-subtitle">
            Update the name and password on your admin account.
          </p>
        </div>
      </div>

      <div className="card" style={{ maxWidth: 640 }}>
        <div className="card-header">
          <div className="flex items-center gap-3">
            <span
              className="user-avatar"
              style={{ width: 42, height: 42, fontSize: 14 }}
            >
              {initials || "?"}
            </span>
            <div>
              <h2 className="card-title">
                {[profile.firstname, profile.lastname]
                  .filter(Boolean)
                  .join(" ") || "Your profile"}
              </h2>
              <p className="card-description">{profile.email}</p>
            </div>
          </div>
          <span className="badge badge-brand">
            {ROLE_LABELS[role] || "Team Member"}
          </span>
        </div>

        <form onSubmit={handleUpdate}>
          <div className="card-body">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="field">
                <label className="field-label" htmlFor="firstname">
                  First Name
                </label>
                <input
                  id="firstname"
                  type="text"
                  name="firstname"
                  placeholder="First name"
                  value={profile.firstname || ""}
                  onChange={handleInputChange}
                  className="input"
                />
              </div>
              <div className="field">
                <label className="field-label" htmlFor="lastname">
                  Last Name
                </label>
                <input
                  id="lastname"
                  type="text"
                  name="lastname"
                  placeholder="Last name"
                  value={profile.lastname || ""}
                  onChange={handleInputChange}
                  className="input"
                />
              </div>
            </div>

            <div className="field mt-4">
              <label className="field-label" htmlFor="email">
                Email
              </label>
              <input
                id="email"
                type="email"
                name="email"
                disabled
                value={profile.email || ""}
                className="input"
              />
              <p className="kpi-meta mt-2">
                Your sign-in email cannot be changed here.
              </p>
            </div>

            <div className="field mt-4">
              <label className="field-label" htmlFor="new-password">
                New Password
              </label>
              <input
                id="new-password"
                type="password"
                placeholder="Leave blank to keep your current password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="input"
                autoComplete="new-password"
              />
            </div>
          </div>

          <div className="modal-footer">
            <button type="submit" disabled={saving} className="btn btn-primary">
              {saving ? "Saving..." : "Save Changes"}
            </button>
          </div>
        </form>
      </div>

      <ToastContainer position="top-right" />
    </div>
  );
};

export default Settings;
