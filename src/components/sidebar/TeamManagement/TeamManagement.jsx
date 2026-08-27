import { useState, useEffect, useCallback, useContext } from "react";
import { Search, UserPlus, Trash2, Mail, ShieldCheck, X } from "lucide-react";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import { AuthContext, ROLE_LABELS } from "../../../context/authContext";
import {
  getTeam,
  inviteTeamMember,
  removeTeamMember,
} from "../../../utils/API_SERVICE";

const initialInviteForm = {
  email: "",
  firstname: "",
  lastname: "",
  role: "content_manager",
};

const ROLE_BADGE_CLASS = {
  owner: "badge-owner",
  admin: "badge-brand",
  content_manager: "badge-neutral",
};

const formatDate = (value) => {
  if (!value) return "—";
  const date = new Date(value);
  return Number.isNaN(date.getTime())
    ? "—"
    : date.toLocaleDateString(undefined, {
        year: "numeric",
        month: "short",
        day: "numeric",
      });
};

export default function TeamManagement() {
  const { accessToken, user, isOwner, isAdmin } = useContext(AuthContext);

  const [team, setTeam] = useState([]);
  const [fetching, setFetching] = useState(false);
  const [fetchError, setFetchError] = useState("");
  const [search, setSearch] = useState("");

  const [showInviteForm, setShowInviteForm] = useState(false);
  const [inviteForm, setInviteForm] = useState(initialInviteForm);
  const [inviteLoading, setInviteLoading] = useState(false);

  const [memberToRemove, setMemberToRemove] = useState(null);
  const [removeLoading, setRemoveLoading] = useState(false);

  // Only the Owner can list the team; Admins get a 403 from GET /team.
  const fetchTeam = useCallback(async () => {
    if (!accessToken || !isOwner) return;

    setFetching(true);
    setFetchError("");
    try {
      const data = await getTeam(accessToken);
      setTeam(data.team || []);
    } catch (error) {
      setFetchError(error.message);
      toast.error(error.message || "Error fetching team members");
    } finally {
      setFetching(false);
    }
  }, [accessToken, isOwner]);

  useEffect(() => {
    fetchTeam();
  }, [fetchTeam]);

  const handleInviteChange = (e) => {
    const { name, value } = e.target;
    setInviteForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleInviteSubmit = async (e) => {
    e.preventDefault();
    setInviteLoading(true);
    try {
      const response = await inviteTeamMember(
        {
          email: inviteForm.email.trim(),
          firstname: inviteForm.firstname.trim(),
          lastname: inviteForm.lastname.trim(),
          role: inviteForm.role,
        },
        accessToken
      );

      // The API tells us which email it sent: a brand new user gets a
      // set-password link, an existing customer just gets access granted.
      toast.success(
        response.inviteType === "access_granted"
          ? "Access granted. The user keeps their existing password."
          : "Invitation sent. They will receive a set-password email."
      );

      setInviteForm(initialInviteForm);
      setShowInviteForm(false);
      fetchTeam();
    } catch (error) {
      if (error.status === 409) {
        toast.error("That email is already on the team");
      } else if (error.status === 403) {
        toast.error("You do not have permission to invite that role");
      } else {
        toast.error(error.message || "Failed to send invitation");
      }
    } finally {
      setInviteLoading(false);
    }
  };

  const handleRemoveConfirm = async () => {
    if (!memberToRemove) return;

    setRemoveLoading(true);
    try {
      await removeTeamMember(memberToRemove._id, accessToken);
      toast.success(
        `${memberToRemove.firstname} ${memberToRemove.lastname} removed from the team`
      );
      setTeam((prev) => prev.filter((m) => m._id !== memberToRemove._id));
      setMemberToRemove(null);
    } catch (error) {
      toast.error(error.message || "Failed to remove team member");
    } finally {
      setRemoveLoading(false);
    }
  };

  const filteredTeam = team.filter((member) => {
    const term = search.trim().toLowerCase();
    if (!term) return true;
    return (
      `${member.firstname} ${member.lastname}`.toLowerCase().includes(term) ||
      (member.email || "").toLowerCase().includes(term) ||
      (ROLE_LABELS[member.role] || "").toLowerCase().includes(term)
    );
  });

  const renderInviteForm = () => (
    <div className="card mb-6">
      <div className="card-header">
        <div>
          <h2 className="card-title">Invite Team Member</h2>
          <p className="card-description">
            New users receive a set-password email. Existing ComeAway customers
            keep their password and are simply granted access.
          </p>
        </div>
        <button
          type="button"
          className="btn btn-icon btn-ghost"
          onClick={() => {
            setInviteForm(initialInviteForm);
            setShowInviteForm(false);
          }}
          aria-label="Close invite form"
        >
          <X size={16} />
        </button>
      </div>
      <form onSubmit={handleInviteSubmit}>
        <div className="card-body">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="field">
              <label htmlFor="invite-firstname" className="field-label">
                First Name
              </label>
              <input
                id="invite-firstname"
                name="firstname"
                type="text"
                className="input"
                placeholder="Jane"
                value={inviteForm.firstname}
                onChange={handleInviteChange}
                required
              />
            </div>
            <div className="field">
              <label htmlFor="invite-lastname" className="field-label">
                Last Name
              </label>
              <input
                id="invite-lastname"
                name="lastname"
                type="text"
                className="input"
                placeholder="Doe"
                value={inviteForm.lastname}
                onChange={handleInviteChange}
                required
              />
            </div>
            <div className="field">
              <label htmlFor="invite-email" className="field-label">
                Email
              </label>
              <input
                id="invite-email"
                name="email"
                type="email"
                className="input"
                placeholder="name@example.com"
                value={inviteForm.email}
                onChange={handleInviteChange}
                required
              />
            </div>
            <div className="field">
              <label htmlFor="invite-role" className="field-label">
                Role
              </label>
              <select
                id="invite-role"
                name="role"
                className="select"
                value={inviteForm.role}
                onChange={handleInviteChange}
              >
                <option value="content_manager">Content Manager</option>
                {/* Admins may only invite content managers. */}
                {isOwner && <option value="admin">Admin</option>}
              </select>
              <p className="kpi-meta mt-2">
                {inviteForm.role === "admin"
                  ? "Full access, including inviting Content Managers."
                  : "Can manage sounds and categories only."}
              </p>
            </div>
          </div>
        </div>
        <div className="modal-footer" style={{ borderRadius: 0 }}>
          <button
            type="button"
            className="btn btn-secondary"
            onClick={() => {
              setInviteForm(initialInviteForm);
              setShowInviteForm(false);
            }}
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={inviteLoading}
            className="btn btn-primary"
          >
            <Mail size={15} />
            {inviteLoading ? "Sending..." : "Send Invitation"}
          </button>
        </div>
      </form>
    </div>
  );

  const renderTeamTable = () => (
    <div className="card">
      <div className="card-header">
        <div>
          <h2 className="card-title">Team Members</h2>
          <p className="card-description">
            {team.length} {team.length === 1 ? "member" : "members"} with access
            to the admin panel
          </p>
        </div>
        <div className="input-icon-wrap" style={{ width: 260 }}>
          <Search className="input-icon" size={15} />
          <input
            type="text"
            placeholder="Search name, email or role"
            className="input input-with-icon"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
      </div>

      <div className="table-wrap">
        <table className="data-table">
          <thead>
            <tr>
              <th>Member</th>
              <th>Role</th>
              <th>Date Added</th>
              <th>Status</th>
              <th className="cell-actions">Actions</th>
            </tr>
          </thead>
          <tbody>
            {fetching ? (
              <tr>
                <td colSpan={5} className="empty-state">
                  Loading team members...
                </td>
              </tr>
            ) : filteredTeam.length === 0 ? (
              <tr>
                <td colSpan={5} className="empty-state">
                  {fetchError || "No team members found"}
                </td>
              </tr>
            ) : (
              filteredTeam.map((member) => (
                <tr key={member._id}>
                  <td>
                    <div className="flex items-center gap-3">
                      <span className="user-avatar">
                        {`${member.firstname?.[0] || ""}${
                          member.lastname?.[0] || ""
                        }`.toUpperCase()}
                      </span>
                      <span>
                        <span className="cell-strong block">
                          {member.firstname} {member.lastname}
                          {member._id === user?._id && (
                            <span className="text-muted"> (you)</span>
                          )}
                        </span>
                        <span className="text-muted block text-xs">
                          {member.email}
                          {!member.isEmailVerified && " · unverified"}
                        </span>
                      </span>
                    </div>
                  </td>
                  <td>
                    <span
                      className={`badge ${
                        ROLE_BADGE_CLASS[member.role] || "badge-neutral"
                      }`}
                    >
                      {ROLE_LABELS[member.role] || member.role || "—"}
                    </span>
                  </td>
                  <td>{formatDate(member.teamDateAdded)}</td>
                  <td>
                    <span
                      className={`badge ${
                        member.status === "active"
                          ? "badge-success"
                          : "badge-danger"
                      }`}
                    >
                      {member.status === "active" ? "Active" : "Inactive"}
                    </span>
                  </td>
                  <td className="cell-actions">
                    {/* canRemove comes straight from the API: the Owner and
                        the current user are never removable. */}
                    {member.canRemove ? (
                      <button
                        type="button"
                        className="btn btn-icon btn-danger-soft"
                        onClick={() => setMemberToRemove(member)}
                        title="Remove from team"
                        aria-label={`Remove ${member.firstname} ${member.lastname}`}
                      >
                        <Trash2 size={15} />
                      </button>
                    ) : (
                      <span className="text-muted">—</span>
                    )}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );

  const RemoveConfirmModal = () => {
    if (!memberToRemove) return null;

    return (
      <div className="modal-overlay" onClick={() => setMemberToRemove(null)}>
        <div className="modal" onClick={(e) => e.stopPropagation()}>
          <div className="modal-body">
            <div className="flex items-start gap-4">
              <span className="modal-icon modal-icon-danger">
                <Trash2 size={19} />
              </span>
              <div>
                <h2 className="card-title">Remove Team Member</h2>
                <p className="card-description mt-2">
                  Remove <strong>{memberToRemove.firstname}{" "}
                  {memberToRemove.lastname}</strong> from the team? They lose
                  admin access immediately and revert to a regular customer
                  account. Their account itself is not deleted.
                </p>
              </div>
            </div>
          </div>
          <div className="modal-footer">
            <button
              type="button"
              className="btn btn-secondary"
              onClick={() => setMemberToRemove(null)}
            >
              Cancel
            </button>
            <button
              type="button"
              disabled={removeLoading}
              className="btn btn-danger"
              onClick={handleRemoveConfirm}
            >
              {removeLoading ? "Removing..." : "Remove Member"}
            </button>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="page">
      <div className="page-header">
        <div>
          <h1 className="page-title">Team Management</h1>
          <p className="page-subtitle">
            Invite staff and control who can access the admin panel.
          </p>
        </div>
        {!showInviteForm && (
          <button
            type="button"
            className="btn btn-primary"
            onClick={() => setShowInviteForm(true)}
          >
            <UserPlus size={16} />
            Invite Team Member
          </button>
        )}
      </div>

      {showInviteForm && renderInviteForm()}

      {isOwner ? (
        renderTeamTable()
      ) : (
        // Admins can invite but GET /team is Owner-only, so there is no roster
        // to show them.
        <div className="card">
          <div className="card-body">
            <div className="flex items-start gap-3">
              <ShieldCheck
                size={18}
                className="flex-shrink-0"
                style={{ color: "#8494a8", marginTop: 2 }}
              />
              <div>
                <h2 className="card-title">Invitations only</h2>
                <p className="card-description mt-1">
                  {isAdmin
                    ? "As an Admin you can invite Content Managers. Only the Owner can view or remove team members."
                    : "Only the Owner can view or manage the team list."}
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      <RemoveConfirmModal />
      <ToastContainer position="top-right" />
    </div>
  );
}
