import { useState, useEffect, useContext, useCallback } from "react";
import ReactPaginate from "react-paginate";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import { FaEye, FaTrash, FaSearch } from "react-icons/fa";
import { AuthContext } from "../../../context/authContext";
import {
  getAllUsers,
  updateUserStatus,
  // updateUserType,
  getUserSubscriptionDetails,
  deleteUserById,
  updateUserPlanStatus,
} from "../../../utils/API_SERVICE";

const UserManagement = () => {
  const { accessToken } = useContext(AuthContext);
  const [currentPage, setCurrentPage] = useState(0);
  const [userNameSearch, setUserNameSearch] = useState("");
  const [userTypeFilter, setUserTypeFilter] = useState("");
  const [selectedUser, setSelectedUser] = useState(null);
  const [selectedStatus, setSelectedStatus] = useState("");
  const [selectedUserType, setSelectedUserType] = useState("");
  const [subscriptionSearch, setSubscriptionSearch] = useState("");
  const [transactionIdSearch, setTransactionIdSearch] = useState("");
  const [userData, setUserData] = useState([]);
  const [subscriptionHistory, setSubscriptionHistory] = useState([]);
  const [fetching, setFetching] = useState(false);
  const [fetchError, setFetchError] = useState("");
  const [showDeleteConfirmation, setShowDeleteConfirmation] = useState(false);
  const [userToDelete, setUserToDelete] = useState(null);
  const itemsPerPage = 20;

  // console.log(subscriptionHistory);

  useEffect(() => {
    if (accessToken) fetchUsers();
  }, [accessToken]);

  // Optimized debounced search effect with faster response
  useEffect(() => {
    if (accessToken) {
      const timeoutId = setTimeout(() => {
        fetchUsers();
      }, 300); // Reduced to 300ms for faster response

      return () => clearTimeout(timeoutId);
    }
  }, [accessToken, userNameSearch, userTypeFilter]);

  const fetchUsers = useCallback(async () => {
    setFetching(true);
    setFetchError("");

    try {
      const queryParams = {};

      if (userNameSearch.trim()) {
        queryParams.query = userNameSearch.trim();
      }

      if (userTypeFilter) {
        queryParams.type = userTypeFilter;
      }

      const users = await getAllUsers(accessToken, queryParams);
      // console.log("users", users.users);
      setUserData(users.users);
    } catch (err) {
      setFetchError(err.message);
      toast.error("Error fetching users");
    } finally {
      setFetching(false);
    }
  }, [accessToken, userNameSearch, userTypeFilter]);

  const handleDeleteUser = (userId) => {
    const user = userData.find((u) => u._id === userId);
    setUserToDelete(user);
    setShowDeleteConfirmation(true);
  };

  const handleConfirmDelete = async () => {
    if (!userToDelete) return;

    try {
      await deleteUserById(userToDelete._id, accessToken);
      setUserData((prev) =>
        Array.isArray(prev)
          ? prev.filter((user) => user._id !== userToDelete._id)
          : []
      );
      toast.success("User deleted successfully");
      setShowDeleteConfirmation(false);
      setUserToDelete(null);
    } catch {
      toast.error("Error deleting user");
      setShowDeleteConfirmation(false);
      setUserToDelete(null);
    }
  };

  const handleCancelDelete = () => {
    setShowDeleteConfirmation(false);
    setUserToDelete(null);
  };

  const handleStatusUpdate = async () => {
    if (selectedUser) {
      try {
        await updateUserStatus(selectedUser._id, selectedStatus, accessToken);
        const updatedUsers = Array.isArray(userData)
          ? userData.map((user) =>
              user._id === selectedUser._id
                ? { ...user, status: selectedStatus }
                : user
            )
          : [];
        setUserData(updatedUsers);
        toast.success("Status updated successfully");
      } catch {
        toast.error("Error updating status");
      }
    }
  };

  const handleUserTypeUpdate = async () => {
    if (selectedUser && selectedUserType) {
      try {
        await updateUserPlanStatus(
          selectedUser._id,
          selectedUserType,
          accessToken
        );
        const updatedUsers = Array.isArray(userData)
          ? userData.map((user) =>
              user._id === selectedUser._id
                ? { ...user, userType: selectedUserType }
                : user
            )
          : [];
        setUserData(updatedUsers);
        toast.success("User type updated successfully");
        setSelectedUserType("");
      } catch {
        toast.error("Error updating user type");
      }
    }
  };

  const handlePageClick = (data) => {
    setCurrentPage(data.selected);
  };

  const handleUserNameSearchChange = (e) => {
    setUserNameSearch(e.target.value);
  };

  const handleUserTypeFilterChange = (e) => {
    setUserTypeFilter(e.target.value);
  };

  const handleSubscriptionSearchChange = (e) => {
    setSubscriptionSearch(e.target.value);
  };

  const handleTransactionIdSearchChange = (e) => {
    setTransactionIdSearch(e.target.value);
  };

  const handleUserPreview = async (user) => {
    setSelectedUser(user);
    // console.log(user._id);

    // console.log(selectedUser);

    setSelectedStatus(user.status);
    setSelectedUserType(user.isPro ? "pro" : "standard");
    // console.log(user._id);
    try {
      const userSubscriptionHistory = await getUserSubscriptionDetails(
        user._id,
        accessToken
      );
      // console.log("userSubscriptionHistory", userSubscriptionHistory);
      setSubscriptionHistory(userSubscriptionHistory.subscriptions);
    } catch {
      toast.error("Error fetching subscription history");
    }
  };

  const handleBackToTable = () => {
    setSelectedUser(null);
    setSubscriptionHistory([]);
  };

  // const filteredSubscriptionHistory = subscriptionHistory.filter(
  //   (history) =>
  //     history.plan.toLowerCase().includes(subscriptionSearch.toLowerCase()) &&
  //     history._id.toString().includes(transactionIdSearch)
  // );

  const filteredSubscriptionHistory = subscriptionHistory;

  const offset = currentPage * itemsPerPage;
  const currentPageData = Array.isArray(userData)
    ? userData.slice(offset, offset + itemsPerPage)
    : [];

  return (
    <div className="page">
      <div className="mb-10">
        <h1 className="page-title">User Management</h1>
      </div>
      {selectedUser ? (
        <div className="container mx-auto p-4 bg-white rounded shadow-md flex">
          <div className="w-2/3">
            <button
              onClick={handleBackToTable}
              className="btn btn-secondary mb-4"
            >
              Back
            </button>
            <div className="bg-gray-100 p-6 rounded shadow-md">
              <h2 className="page-title">
                User Details
              </h2>
              <div className="mb-4">
                <p className="text-lg">
                  <strong>Email:</strong> {selectedUser.email}
                </p>
              </div>
              <div className="mb-4">
                <p className="text-lg">
                  <strong>User Name:</strong> {selectedUser.firstname}{" "}
                  {selectedUser.lastname}
                </p>
              </div>
              <div className="mb-4">
                <p className="text-lg">
                  <strong>Status:</strong> {selectedUser.status}
                </p>
              </div>
              <div className="mb-4">
                <p className="text-lg">
                  <strong>User Type:</strong>{" "}
                  <span
                    className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${
                      selectedUser.userType === "Pro"
                        ? "bg-yellow-100 text-yellow-800"
                        : "bg-green-100 text-green-800"
                    }`}
                  >
                    {selectedUser.userType}
                  </span>
                </p>
              </div>
            </div>
            <div className="width-600 bg-gray-100 p-6 rounded shadow-md mt-6">
              <h2 className="page-title">
                Subscription History
              </h2>
              <div className="mb-4 flex justify-between space-x-4">
                <input
                  type="text"
                  placeholder="Search by Transaction ID"
                  value={transactionIdSearch}
                  onChange={handleTransactionIdSearchChange}
                  className="px-4 py-2 border rounded w-full"
                />
                <input
                  type="text"
                  placeholder="Search by Subscription Name"
                  value={subscriptionSearch}
                  onChange={handleSubscriptionSearchChange}
                  className="px-4 py-2 border rounded w-full"
                />
              </div>
              <div className="table-wrap">
                <table className="data-table">
                  <thead>
                    <tr>
                      <th>
                        Transaction ID
                      </th>
                      <th>
                        Plan
                      </th>
                      <th>
                        Status
                      </th>
                      <th>
                        Start Date
                      </th>
                      <th>
                        End Date
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredSubscriptionHistory.length === 0 ? (
                      <tr>
                        <td colSpan={5} className="empty-state">
                          No subscription history found.
                        </td>
                      </tr>
                    ) : (
                      filteredSubscriptionHistory.map((history) => (
                        <tr key={history._id} className="hover:bg-gray-50">
                          <td>
                            {history._id}
                          </td>
                          <td>
                            {history.plan}
                          </td>
                          <td>
                            {history.status}
                          </td>
                          <td>
                            {new Date(history.startDate).toLocaleDateString()}
                          </td>
                          <td>
                            {new Date(history.endDate).toLocaleDateString()}
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
          <div className="w-1/3 pl-4">
            <div className="bg-gray-100 p-6 rounded shadow-md mt-14">
              <h2 className="text-2xl font-bold mb-4">Update Status</h2>
              <label className="block mb-2 text-lg font-medium">
                <strong>Status:</strong>
              </label>
              <select
                value={selectedStatus}
                onChange={(e) => setSelectedStatus(e.target.value)}
                className="select mb-4"
              >
                <option value="active">Active</option>
                <option value="inactive">Inactive</option>
              </select>
              <button
                onClick={handleStatusUpdate}
                className="btn btn-primary w-full"
              >
                Update
              </button>
            </div>

            <div className="bg-gray-100 p-6 rounded shadow-md mt-4">
              <h2 className="text-2xl font-bold mb-4">Update User Type</h2>
              <label className="block mb-2 text-lg font-medium">
                <strong>User Type:</strong>
              </label>
              <select
                value={selectedUserType}
                // value={sel}
                onChange={(e) => setSelectedUserType(e.target.value)}
                className="select mb-4"
              >
                <option value="standard">Standard</option>
                <option value="pro">Pro</option>
              </select>
              <button
                onClick={handleUserTypeUpdate}
                className="btn btn-primary w-full"
              >
                Update
              </button>
            </div>
          </div>
        </div>
      ) : (
        <div className="card is-padded">
          <div className="mb-4 flex gap-4">
            <div className="relative flex-1">
              <FaSearch className="input-icon" />
              <input
                type="text"
                placeholder="Search by first name, last name or email"
                value={userNameSearch}
                onChange={handleUserNameSearchChange}
                className="input input-with-icon"
              />
            </div>
            <div className="flex-1">
              <select
                value={userTypeFilter}
                onChange={handleUserTypeFilterChange}
                className="select"
              >
                <option value="">All User Types</option>
                <option value="standard">Standard</option>
                <option value="pro">Pro</option>
              </select>
            </div>
          </div>
          <div className="table-wrap">
            <table className="data-table">
              <thead>
                <tr>
                  <th>
                    Email
                  </th>
                  <th>
                    First Name
                  </th>
                  <th>
                    Last Name
                  </th>
                  <th>
                    Status
                  </th>
                  <th>
                    Type
                  </th>
                  <th>
                    Activation Method
                  </th>
                  <th>
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody>
                {fetching ? (
                  <tr>
                    <td colSpan={6} className="empty-state">
                      Loading users...
                    </td>
                  </tr>
                ) : fetchError ? (
                  <tr>
                    <td colSpan={6} className="text-center py-4 text-red-500">
                      {fetchError}
                    </td>
                  </tr>
                ) : currentPageData.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="empty-state">
                      No users found.
                    </td>
                  </tr>
                ) : (
                  currentPageData.map((user) => (
                    <tr key={user._id} className="hover:bg-gray-50">
                      <td>
                        {user.email}
                      </td>
                      <td>
                        {user.firstname}
                      </td>
                      <td>
                        {user.lastname}
                      </td>
                      <td>
                        <span
                          className={`badge ${
                            user.status === "active" ? "badge-success" : "badge-danger"
                          }`}
                        >
                          {user.status === "active" ? "Active" : "Inactive"}
                        </span>
                      </td>
                      <td>
                        {user.userType ? (
                          <span
                            className={`badge ${
                              user.userType === "Pro"
                                ? "badge-warning"
                                : "badge-success"
                            }`}
                          >
                            {user.userType}
                          </span>
                        ) : (
                          <span className="text-muted">—</span>
                        )}
                      </td>
                      <td>
                        {user.activationMethod}
                      </td>
                      <td className="cell-actions">
                        <div className="flex gap-2 justify-end">
                          <button
                            onClick={() => handleUserPreview(user)}
                            className="btn btn-icon btn-secondary"
                            title="View"
                          >
                            <FaEye />
                          </button>
                          <button
                            onClick={() => handleDeleteUser(user._id)}
                            className="btn btn-icon btn-danger-soft"
                            title="Delete"
                          >
                            <FaTrash />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
          <div className="mt-4 flex justify-end">
            <ReactPaginate
              previousLabel={"Previous"}
              nextLabel={"Next"}
              breakLabel={"..."}
              pageCount={Math.ceil(
                (Array.isArray(userData) ? userData.length : 0) / itemsPerPage
              )}
              marginPagesDisplayed={2}
              pageRangeDisplayed={5}
              onPageChange={handlePageClick}
              containerClassName={"pagination flex space-x-2"}
              pageClassName={"page-item"}
              pageLinkClassName={"page-link px-3 py-1 border rounded"}
              previousLinkClassName={"page-link px-3 py-1 border rounded"}
              nextLinkClassName={"page-link px-3 py-1 border rounded"}
              breakLinkClassName={"page-link px-3 py-1 border rounded"}
              activeClassName={"active"}
              activeLinkClassName={"bg-gray-300 text-white"}
            />
          </div>
        </div>
      )}

      {/* Delete Confirmation Overlay */}
      {showDeleteConfirmation && userToDelete && (
        <div className="modal-overlay">
          <div className="modal is-padded">
            <h3 className="card-title">
              Confirm User Deletion
            </h3>
            <p className="card-description mb-6">
              Are you sure you want to delete the user{" "}
              <span className="font-semibold">
                {userToDelete.firstname} {userToDelete.lastname}
              </span>
              ?
            </p>
            <p className="text-sm text-gray-500 mb-6">
              This action cannot be undone and will permanently remove the user
              account.
            </p>
            <div className="modal-footer">
              <button
                onClick={handleCancelDelete}
                className="px-4 py-2 text-gray-600 border border-gray-300 rounded hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                onClick={handleConfirmDelete}
                className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700"
              >
                Delete User
              </button>
            </div>
          </div>
        </div>
      )}

      <ToastContainer />
    </div>
  );
};

export default UserManagement;
