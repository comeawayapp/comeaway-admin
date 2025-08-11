import { useState, useEffect, useContext } from "react";
import ReactPaginate from "react-paginate";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import { FaEye, FaTrash } from "react-icons/fa";
import { AuthContext } from "../../../context/authContext";
import {
  getAllUsers,
  updateUserStatus,
  getUserSubscriptionDetails,
  deleteUserById,
} from "../../../utils/API_SERVICE";

const UserManagement = () => {
  const { accessToken } = useContext(AuthContext);
  const [currentPage, setCurrentPage] = useState(0);
  const [userIdSearch, setUserIdSearch] = useState("");
  const [userNameSearch, setUserNameSearch] = useState("");
  const [selectedUser, setSelectedUser] = useState(null);
  const [selectedStatus, setSelectedStatus] = useState("");
  const [subscriptionSearch, setSubscriptionSearch] = useState("");
  const [transactionIdSearch, setTransactionIdSearch] = useState("");
  const [userData, setUserData] = useState([]);
  const [subscriptionHistory, setSubscriptionHistory] = useState([]);
  const itemsPerPage = 5;

  console.log(subscriptionHistory);

  useEffect(() => {
    const fetchUsers = async () => {
      try {
        const users = await getAllUsers(accessToken);
        // Add dummy user type data to each user
        const usersWithType = users.map((user, index) => ({
          ...user,
          userType: index % 2 === 0 ? "standard" : "pro", // Alternate between standard and pro
        }));
        setUserData(usersWithType);
        toast.success("Users fetched successfully");
      } catch {
        toast.error("Error fetching users");
      }
    };

    fetchUsers();
  }, [accessToken]);

  const handleDeleteUser = async (userId) => {
    if (
      !window.confirm(
        "Are you sure you want to delete this user? This action cannot be undone."
      )
    )
      return;
    try {
      await deleteUserById(userId, accessToken);
      setUserData((prev) => prev.filter((user) => user._id !== userId));
      toast.success("User deleted successfully");
    } catch {
      toast.error("Error deleting user");
    }
  };

  const handleStatusUpdate = async () => {
    if (selectedUser) {
      try {
        await updateUserStatus(selectedUser._id, selectedStatus, accessToken);
        const updatedUsers = userData.map((user) =>
          user._id === selectedUser._id
            ? { ...user, status: selectedStatus }
            : user
        );
        setUserData(updatedUsers);
        toast.success("Status updated successfully");
      } catch {
        toast.error("Error updating status");
      }
    }
  };

  const handlePageClick = (data) => {
    setCurrentPage(data.selected);
  };

  const handleUserIdSearchChange = (e) => {
    setUserIdSearch(e.target.value);
  };

  const handleUserNameSearchChange = (e) => {
    setUserNameSearch(e.target.value);
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
    console.log(user._id);
    try {
      const userSubscriptionHistory = await getUserSubscriptionDetails(
        user._id,
        accessToken
      );
      setSubscriptionHistory(userSubscriptionHistory);
    } catch {
      toast.error("Error fetching subscription history");
    }
  };

  const handleBackToTable = () => {
    setSelectedUser(null);
    setSubscriptionHistory([]);
  };

  const filteredData = userData.filter(
    (user) =>
      user._id.toString().includes(userIdSearch) &&
      (
        user.firstname.toLowerCase() +
        " " +
        user.lastname.toLowerCase()
      ).includes(userNameSearch.toLowerCase())
  );

  const filteredSubscriptionHistory = subscriptionHistory.filter(
    (history) =>
      history.plan.toLowerCase().includes(subscriptionSearch.toLowerCase()) &&
      history._id.toString().includes(transactionIdSearch)
  );

  const offset = currentPage * itemsPerPage;
  const currentPageData = filteredData.slice(offset, offset + itemsPerPage);

  return (
    <div className="container mx-auto p-4">
      <div className="mb-10">
        <h1 className="text-4xl font-bold text-center mt-6">User Management</h1>
      </div>
      {selectedUser ? (
        <div className="container mx-auto p-4 bg-white rounded shadow-md flex">
          <div className="w-2/3">
            <button
              onClick={handleBackToTable}
              className="mb-4 px-4 py-2 bg-gray-400 text-white rounded"
            >
              Back
            </button>
            <div className="bg-gray-100 p-6 rounded shadow-md">
              <h2 className="text-3xl font-bold mb-6 text-center">
                User Details
              </h2>
              <div className="mb-4">
                <p className="text-lg">
                  <strong>User ID:</strong> {selectedUser._id}
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
                      selectedUser.userType === "pro"
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
              <h2 className="text-3xl font-bold mb-6 text-center">
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
              <div className="overflow-x-auto">
                <table className="min-w-full bg-white border border-gray-300 rounded-lg">
                  <thead>
                    <tr>
                      <th className="py-2 px-4 border-b border-gray-300 text-left bg-gray-100">
                        Transaction ID
                      </th>
                      <th className="py-2 px-4 border-b border-gray-300 text-left bg-gray-100">
                        Subscription Name
                      </th>
                      <th className="py-2 px-4 border-b border-gray-300 text-left bg-gray-100">
                        Status
                      </th>
                      <th className="py-2 px-4 border-b border-gray-300 text-left bg-gray-100">
                        Start Date
                      </th>
                      <th className="py-2 px-4 border-b border-gray-300 text-left bg-gray-100">
                        End Date
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredSubscriptionHistory.map((history) => (
                      <tr key={history._id} className="hover:bg-gray-50">
                        <td className="py-2 px-4 border-b border-gray-300">
                          {history._id}
                        </td>
                        <td className="py-2 px-4 border-b border-gray-300">
                          {history.plan}
                        </td>
                        <td className="py-2 px-4 border-b border-gray-300">
                          {history.status}
                        </td>
                        <td className="py-2 px-4 border-b border-gray-300">
                          {new Date(history.startDate).toLocaleDateString()}
                        </td>
                        <td className="py-2 px-4 border-b border-gray-300">
                          {new Date(history.endDate).toLocaleDateString()}
                        </td>
                      </tr>
                    ))}
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
                className="px-4 py-2 border rounded w-full mb-4"
              >
                <option value="active">Active</option>
                <option value="inactive">Inactive</option>
              </select>
              <button
                onClick={handleStatusUpdate}
                className="px-4 py-2 text-white rounded w-full"
                style={{ backgroundColor: "#439AB8" }}
              >
                Update
              </button>
            </div>
          </div>
        </div>
      ) : (
        <div className="container mx-auto p-4 bg-white rounded shadow-md">
          <div className="mb-4 flex justify-between space-x-4">
            <input
              type="text"
              placeholder="Search by User ID"
              value={userIdSearch}
              onChange={handleUserIdSearchChange}
              className="px-4 py-2 border rounded w-full"
            />
            <input
              type="text"
              placeholder="Search by User Name"
              value={userNameSearch}
              onChange={handleUserNameSearchChange}
              className="px-4 py-2 border rounded w-full"
            />
          </div>
          <div className="overflow-x-auto">
            <table className="min-w-full bg-white border border-gray-300 rounded-lg">
              <thead>
                <tr>
                  <th className="py-2 px-4 border-b border-gray-300 text-left bg-gray-100">
                    Email
                  </th>
                  <th className="py-2 px-4 border-b border-gray-300 text-left bg-gray-100">
                    First Name
                  </th>
                  <th className="py-2 px-4 border-b border-gray-300 text-left bg-gray-100">
                    Last Name
                  </th>
                  <th className="py-2 px-4 border-b border-gray-300 text-left bg-gray-100">
                    Status
                  </th>
                  <th className="py-2 px-4 border-b border-gray-300 text-left bg-gray-100">
                    Tags
                  </th>
                  <th className="py-2 px-4 border-b border-gray-300 text-left bg-gray-100">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody>
                {currentPageData.map((user) => (
                  <tr key={user._id} className="hover:bg-gray-50">
                    <td className="py-2 px-4 border-b border-gray-300">
                      {user.email}
                    </td>
                    <td className="py-2 px-4 border-b border-gray-300">
                      {user.firstname}
                    </td>
                    <td className="py-2 px-4 border-b border-gray-300">
                      {user.lastname}
                    </td>
                    <td className="py-2 px-4 border-b border-gray-300">
                      {user.status}
                    </td>
                    <td className="py-2 px-4 border-b border-gray-300">
                      <span
                        className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${
                          user.userType === "pro"
                            ? "bg-yellow-100 text-yellow-800"
                            : "bg-green-100 text-green-800"
                        }`}
                      >
                        {user.userType}
                      </span>
                    </td>
                    <td className="py-2 px-4 border-b border-gray-300 flex gap-2">
                      <button
                        onClick={() => handleUserPreview(user)}
                        className="px-3 py-1 rounded text-white"
                        style={{ backgroundColor: "#439AB8" }}
                        title="View"
                      >
                        <FaEye />
                      </button>
                      <button
                        onClick={() => handleDeleteUser(user._id)}
                        className="px-3 py-1 rounded text-white bg-red-600 hover:bg-red-700"
                        title="Delete"
                      >
                        <FaTrash />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="mt-4 flex justify-end">
            <ReactPaginate
              previousLabel={"Previous"}
              nextLabel={"Next"}
              breakLabel={"..."}
              pageCount={Math.ceil(filteredData.length / itemsPerPage)}
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
      <ToastContainer />
    </div>
  );
};

export default UserManagement;
