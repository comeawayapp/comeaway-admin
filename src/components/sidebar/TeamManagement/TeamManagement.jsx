"use client";

import { useState, useEffect, useCallback, useContext } from "react";
import { Search, UserPlus, Trash2, Mail, ShieldCheck } from "lucide-react";
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

const ROLE_BADGE_CLASSES = {
  owner: "bg-purple-100 text-purple-800",
  admin: "bg-blue-100 text-blue-800",
  content_manager: "bg-green-100 text-green-800",
};

const formatDate = (value) => {
  if (!value) return "-";
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? "-" : date.toLocaleDateString();
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
    <div className="bg-white rounded-lg border border-gray-200 shadow-md mb-6">
      <div className="p-6 bg-gray-50 border-b border-gray-200 rounded-t-lg">
        <h3 className="text-xl font-bold">Invite Team Member</h3>
        <p className="text-gray-500 mt-1">
          New users receive a set-password email. Existing ComeAway customers
          keep their password and are simply granted access.
        </p>
      </div>
      <div className="p-6">
        <form className="space-y-6" onSubmit={handleInviteSubmit}>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <label
                htmlFor="invite-firstname"
                className="block text-sm font-medium text-gray-700"
              >
                First Name
              </label>
              <input
                id="invite-firstname"
                name="firstname"
                type="text"
                className="mt-1 block w-full px-3 py-2 bg-white border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                placeholder="Enter first name"
                value={inviteForm.firstname}
                onChange={handleInviteChange}
                required
              />
            </div>
            <div className="space-y-2">
              <label
                htmlFor="invite-lastname"
                className="block text-sm font-medium text-gray-700"
              >
                Last Name
              </label>
              <input
                id="invite-lastname"
                name="lastname"
                type="text"
                className="mt-1 block w-full px-3 py-2 bg-white border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                placeholder="Enter last name"
                value={inviteForm.lastname}
                onChange={handleInviteChange}
                required
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <label
                htmlFor="invite-email"
                className="block text-sm font-medium text-gray-700"
              >
                Email
              </label>
              <input
                id="invite-email"
                name="email"
                type="email"
                className="mt-1 block w-full px-3 py-2 bg-white border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                placeholder="name@example.com"
                value={inviteForm.email}
                onChange={handleInviteChange}
                required
              />
            </div>
            <div className="space-y-2">
              <label
                htmlFor="invite-role"
                className="block text-sm font-medium text-gray-700"
              >
                Role
              </label>
              <select
                id="invite-role"
                name="role"
                className="mt-1 block w-full px-3 py-2 bg-white border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                value={inviteForm.role}
                onChange={handleInviteChange}
              >
                <option value="content_manager">Content Manager</option>
                {/* Admins may only invite content managers. */}
                {isOwner && <option value="admin">Admin</option>}
              </select>
            </div>
          </div>

          <div className="flex justify-end gap-2">
            <button
              type="button"
              className="py-2 px-4 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
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
              className="py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-60 disabled:cursor-not-allowed"
              style={{ backgroundColor: "#439AB8" }}
            >
              {inviteLoading ? "Sending..." : "Send Invitation"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );

  const renderTeamTable = () => (
    <div className="bg-white rounded-lg border border-gray-200 shadow-md hover:shadow-lg transition-shadow overflow-x-auto">
      <div className="p-6 bg-gray-50 border-b border-gray-200 rounded-t-lg">
        <h3 className="text-xl font-bold">Team Members</h3>
        <p className="text-gray-500 mt-1">
          {team.length} {team.length === 1 ? "member" : "members"} with access to
          the admin panel
        </p>
      </div>
      <div className="p-6">
        <div className="relative mb-6 max-w-md">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-gray-400" />
          <input
            type="text"
            placeholder="Search by name, email or role..."
            className="pl-8 block w-full px-3 py-2 bg-white border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>

        <div className="rounded-md border border-gray-200 overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Name
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Email
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Role
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Date Added
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {fetching ? (
                <tr>
                  <td colSpan={6} className="px-6 py-6 text-center text-gray-500">
                    Loading team members...
                  </td>
                </tr>
              ) : filteredTeam.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-6 py-6 text-center text-gray-500">
                    {fetchError || "No team members found"}
                  </td>
                </tr>
              ) : (
                filteredTeam.map((member) => (
                  <tr key={member._id}>
                    <td className="px-6 py-4 whitespace-nowrap font-medium text-gray-900">
                      {member.firstname} {member.lastname}
                      {member._id === user?._id && (
                        <span className="ml-2 text-xs text-gray-400">(you)</span>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-gray-500">
                      {member.email}
                      {/* {!member.isEmailVerified && (
                        <span className="ml-2 inline-flex items-center px-2 py-0.5 rounded-full text-xs bg-yellow-100 text-yellow-800">
                          Unverified
                        </span>
                      )} */}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span
                        className={`inline-flex px-2 py-1 rounded-full text-xs font-medium ${
                          ROLE_BADGE_CLASSES[member.role] ||
                          "bg-gray-100 text-gray-800"
                        }`}
                      >
                        {ROLE_LABELS[member.role] || member.role || "-"}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-gray-500">
                      {formatDate(member.teamDateAdded)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span
                        className={`inline-flex px-2 py-1 rounded-full text-xs font-medium ${
                          member.status === "active"
                            ? "bg-green-100 text-green-800"
                            : "bg-red-100 text-red-800"
                        }`}
                      >
                        {member.status === "active" ? "Active" : "Inactive"}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right">
                      {/* canRemove comes straight from the API: the Owner and
                          the current user are never removable. */}
                      {member.canRemove ? (
                        <button
                          className="inline-flex items-center p-1.5 border border-transparent rounded-md shadow-sm text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
                          onClick={() => setMemberToRemove(member)}
                          title="Remove from team"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      ) : (
                        <span className="text-xs text-gray-400">—</span>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );

  const RemoveConfirmModal = () => {
    if (!memberToRemove) return null;

    return (
      <div className="fixed inset-0 z-50 overflow-y-auto">
        <div className="flex items-end justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
          <div className="fixed inset-0 transition-opacity" aria-hidden="true">
            <div className="absolute inset-0 bg-gray-500 opacity-75"></div>
          </div>

          <span
            className="hidden sm:inline-block sm:align-middle sm:h-screen"
            aria-hidden="true"
          >
            &#8203;
          </span>

          <div className="inline-block align-bottom bg-white rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-lg sm:w-full">
            <div className="bg-white px-4 pt-5 pb-4 sm:p-6 sm:pb-4">
              <div className="sm:flex sm:items-start">
                <div className="mx-auto flex-shrink-0 flex items-center justify-center h-12 w-12 rounded-full bg-red-100 sm:mx-0 sm:h-10 sm:w-10">
                  <Trash2 className="h-6 w-6 text-red-600" aria-hidden="true" />
                </div>
                <div className="mt-3 text-center sm:mt-0 sm:ml-4 sm:text-left">
                  <h3 className="text-lg leading-6 font-medium text-gray-900">
                    Remove Team Member
                  </h3>
                  <div className="mt-2">
                    <p className="text-sm text-gray-500">
                      Remove {memberToRemove.firstname}{" "}
                      {memberToRemove.lastname} from the team? They lose admin
                      access immediately and revert to a regular customer
                      account. Their account itself is not deleted.
                    </p>
                  </div>
                </div>
              </div>
            </div>
            <div className="bg-gray-50 px-4 py-3 sm:px-6 sm:flex sm:flex-row-reverse">
              <button
                type="button"
                disabled={removeLoading}
                className="w-full inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 bg-red-600 text-base font-medium text-white hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 sm:ml-3 sm:w-auto sm:text-sm disabled:opacity-60 disabled:cursor-not-allowed"
                onClick={handleRemoveConfirm}
              >
                {removeLoading ? "Removing..." : "Remove"}
              </button>
              <button
                type="button"
                className="mt-3 w-full inline-flex justify-center rounded-md border border-gray-300 shadow-sm px-4 py-2 bg-white text-base font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 sm:mt-0 sm:ml-3 sm:w-auto sm:text-sm"
                onClick={() => setMemberToRemove(null)}
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="container mx-auto py-8 px-4">
      <h1 className="text-3xl font-bold mb-8 text-center">Team Management</h1>

      {!showInviteForm && (
        <div className="flex justify-end mb-6">
          <button
            className="w-400 py-3 px-4 inline-flex justify-center items-center gap-2 rounded-md text-white transition-colors text-sm font-medium"
            onClick={() => setShowInviteForm(true)}
            style={{ backgroundColor: "#439AB8" }}
          >
            <UserPlus className="h-5 w-5" />
            Invite Team Member
          </button>
        </div>
      )}

      {showInviteForm && renderInviteForm()}

      {isOwner ? (
        renderTeamTable()
      ) : (
        // Admins can invite but GET /team is Owner-only, so there is no roster
        // to show them.
        <div className="bg-white rounded-lg border border-gray-200 shadow-md p-6">
          <div className="flex items-start gap-3">
            <ShieldCheck className="h-5 w-5 text-gray-400 mt-0.5 flex-shrink-0" />
            <div>
              <h3 className="text-lg font-medium text-gray-900">
                Invitations only
              </h3>
              <p className="text-gray-500 mt-1 text-sm">
                {isAdmin
                  ? "As an Admin you can invite Content Managers. Only the Owner can view or remove team members."
                  : "Only the Owner can view or manage the team list."}
              </p>
              {isAdmin && (
                <p className="text-gray-500 mt-3 text-sm inline-flex items-center gap-2">
                  <Mail className="h-4 w-4 text-gray-400" />
                  Invited users receive an email with next steps.
                </p>
              )}
            </div>
          </div>
        </div>
      )}

      <RemoveConfirmModal />
      <ToastContainer />
    </div>
  );
}
