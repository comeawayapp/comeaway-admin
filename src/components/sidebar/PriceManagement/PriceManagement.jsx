import { useState, useEffect, useContext } from "react";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
// import {
//   FaEye,
//   FaEdit,
// } from "react-icons/fa";
import ReactPaginate from "react-paginate";
import { AuthContext } from "../../../context/authContext";
import { getPrices, updatePrices } from "../../../utils/API_SERVICE";
import { Pencil } from "lucide-react";

const PriceManagement = () => {
  const { accessToken } = useContext(AuthContext);
  const [currentPage, setCurrentPage] = useState(0);
  const [searchField, ] = useState("planName");
  const [searchValue, ] = useState("");
  const [statusFilter] = useState("");
  const [error, setError] = useState("");
  // const [success, setSuccess] = useState("");
  // const [loading, setLoading] = useState(false);
  const [prices, setPrices] = useState([]);
  const [fetching, setFetching] = useState(false);
  const [selectedPrice, setSelectedPrice] = useState(null);
  const [deleteLoading, setDeleteLoading] = useState(false);
  // const [openDropdown, setOpenDropdown] = useState(null);
  // const [dropdownPosition, setDropdownPosition] = useState({ x: 0, y: 0 });
  const [showEditForm, setShowEditForm] = useState(false);
  const [editingPrice, setEditingPrice] = useState(null);
  const [editForm, setEditForm] = useState({
    planName: "",
    planType: "monthly",
    basePrice: "",
    currency: "USD",
    description: "",
    isActive: true,
  });
  const [editLoading, setEditLoading] = useState(false);
  const [showDeleteConfirmation, setShowDeleteConfirmation] = useState(false);
  const [priceToDelete, setPriceToDelete] = useState(null);
  const [formErrors, setFormErrors] = useState({});
  const itemsPerPage = 10;

  useEffect(() => {
    if (accessToken) {
      fetchPrices();
    }
  }, [accessToken]);

  const fetchPrices = async () => {
    setFetching(true);
    setError("");
    try {
      const response = await getPrices(accessToken);
      console.log(response);
      setPrices(response.prices || []);
    } catch (err) {
      setError(err.message);
      toast.error("Error fetching prices");
    } finally {
      setFetching(false);
    }
  };

  const handlePageClick = (data) => {
    setCurrentPage(data.selected);
  };

  // const handlePricePreview = (price) => {
  //   setSelectedPrice(price);
  // };

  const handleBackToTable = () => {
    setSelectedPrice(null);
  };

  // const handleDeletePrice = (price) => {
  //   setPriceToDelete(price);
  //   setShowDeleteConfirmation(true);
  //   setOpenDropdown(null);
  // };

  const handleConfirmDelete = async () => {
    if (!priceToDelete) return;

    setDeleteLoading(true);
    try {
      // Note: There's no delete endpoint in the API, so we'll just remove from local state
      // In a real implementation, you'd call an API endpoint
      setPrices((prev) => prev.filter((p) => p._id !== priceToDelete._id));
      toast.success("Price plan deleted successfully");
      setShowDeleteConfirmation(false);
      setPriceToDelete(null);
    } catch (err) {
      toast.error(err.message || "Error deleting price plan");
      setShowDeleteConfirmation(false);
      setPriceToDelete(null);
    } finally {
      setDeleteLoading(false);
    }
  };

  const handleCancelDelete = () => {
    setShowDeleteConfirmation(false);
    setPriceToDelete(null);
  };

  // const handleDropdownToggle = (priceId, event) => {
  //   if (openDropdown === priceId) {
  //     setOpenDropdown(null);
  //     return;
  //   }

  //   if (event) {
  //     const rect = event.currentTarget.getBoundingClientRect();
  //     const viewportWidth = window.innerWidth;
  //     const viewportHeight = window.innerHeight;

  //     let x = rect.right + 10;
  //     let y = rect.bottom + 10;

  //     if (x + 192 > viewportWidth) {
  //       x = rect.left - 192 - 10;
  //     }

  //     if (y + 300 > viewportHeight) {
  //       y = rect.top - 300 - 10;
  //     }

  //     if (x < 10) {
  //       x = 10;
  //     }

  //     setDropdownPosition({ x, y });
  //   }

  //   setOpenDropdown(priceId);
  // };

  const validateEditForm = () => {
    const errors = {};

    if (!editForm.basePrice || editForm.basePrice <= 0) {
      errors.basePrice = "Price must be greater than 0";
    }

    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleEditPrice = (price) => {
    setEditingPrice(price);
    setEditForm({
      planName: price.planName || "",
      planType: price.planType || "monthly",
      basePrice: price.basePrice || "",
      currency: price.currency || "USD",
      description: price.description || "",
      isActive: price.isActive !== undefined ? price.isActive : true,
    });
    setFormErrors({});
    setShowEditForm(true);
    // setOpenDropdown(null);
  };

  const handleEditSubmit = async (e) => {
    e.preventDefault();
    if (!editingPrice) return;

    if (!validateEditForm()) {
      toast.error("Please fix the errors in the form");
      return;
    }

    setEditLoading(true);
    try {
      // Update the price using the API
      await updatePrices(editingPrice.planType, editForm, accessToken);

      // Update local state
      const updatedPrices = prices.map((p) =>
        p._id === editingPrice._id ? { ...p, ...editForm } : p
      );
      setPrices(updatedPrices);
      toast.success("Price plan updated successfully!");
      setShowEditForm(false);
      setEditingPrice(null);
      setEditForm({
        planName: "",
        planType: "monthly",
        basePrice: "",
        currency: "USD",
        description: "",
        isActive: true,
      });
      setFormErrors({});
    } catch (error) {
      toast.error(error.message || "Error updating price plan");
    } finally {
      setEditLoading(false);
    }
  };

  const handleEditCancel = () => {
    setShowEditForm(false);
    setEditingPrice(null);
    setEditForm({
      planType: "monthly",
      basePrice: "",
      currency: "USD",
      description: "",
      isActive: true,
    });
    setFormErrors({});
  };

  // const handleViewPrice = (price) => {
  //   handlePricePreview(price);
  //   setOpenDropdown(null);
  // };

  const formatPrice = (price, currency = "USD") => {
    return `${currency === "USD" ? "$" : currency}${price}`;
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString();
  };

  const filteredData = prices.filter((price) => {
    const matchesSearch = searchValue
      ? price[searchField]
          ?.toString()
          .toLowerCase()
          .includes(searchValue.toLowerCase())
      : true;
    const matchesStatus = statusFilter
      ? statusFilter === "active"
        ? price.isActive
        : !price.isActive
      : true;
    return matchesSearch && matchesStatus;
  });

  const currentPageData = filteredData.slice(
    currentPage * itemsPerPage,
    (currentPage + 1) * itemsPerPage
  );

  const pageCount = Math.ceil(filteredData.length / itemsPerPage);

  // Portal-based dropdown component
  // const DropdownPortal = ({ price, isOpen, onClose, position }) => {
  //   if (!isOpen) return null;

  //   return (
  //     <div
  //       className="fixed w-48 bg-white rounded-lg shadow-xl z-[9999] border border-gray-200 overflow-hidden"
  //       style={{
  //         left: position.x,
  //         top: position.y,
  //       }}
  //       onClick={(e) => e.stopPropagation()}
  //     >
  //       <div className="px-3 py-2 bg-gray-50 border-b border-gray-200">
  //         <p className="text-xs font-medium text-gray-600">
  //           Actions for {price.planName}
  //         </p>
  //       </div>

  //       <div className="py-1">
  //         <button
  //           onClick={(e) => {
  //             e.stopPropagation();
  //             handleViewPrice(price);
  //             onClose();
  //           }}
  //           className="flex items-center w-full px-4 py-2 text-sm text-gray-700 hover:bg-blue-50 hover:text-blue-700 transition-colors duration-150"
  //         >
  //           <FaEye className="mr-3 h-4 w-4 text-gray-500" />
  //           View Details
  //         </button>
  //         <button
  //           onClick={(e) => {
  //             e.stopPropagation();
  //             handleEditPrice(price);
  //             onClose();
  //           }}
  //           className="flex items-center w-full px-4 py-2 text-sm text-gray-700 hover:bg-green-50 hover:text-green-700 transition-colors duration-150"
  //         >
  //           <FaEdit className="mr-3 h-4 w-4 text-gray-500" />
  //           Edit Price Plan
  //         </button>
  //       </div>
  //     </div>
  //   );
  // };

  if (fetching) {
    return (
      <div className="container mx-auto p-4">
        <div className="mb-10">
          <h1 className="text-4xl font-bold text-center mt-6">
            Price Management
          </h1>
        </div>
        <div className="flex justify-center items-center h-64">
          <div className="text-lg text-gray-600">Loading prices...</div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="container mx-auto p-4">
        <div className="mb-10">
          <h1 className="text-4xl font-bold text-center mt-6">
            Price Management
          </h1>
        </div>
        <div className="flex justify-center items-center h-64">
          <div className="text-lg text-red-600">Error: {error}</div>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-4">
      <div className="mb-10">
        <h1 className="text-4xl font-bold text-center mt-6">
          Price Management
        </h1>
      </div>

      {selectedPrice ? (
        <div className="container mx-auto p-4 bg-white rounded shadow-md">
          <button
            onClick={handleBackToTable}
            className="mb-4 px-4 py-2 bg-gray-400 text-white rounded hover:bg-gray-500 transition-colors"
          >
            ← Back to Table
          </button>
          <div className="bg-gray-100 p-6 rounded shadow-md">
            <h2 className="text-3xl font-bold mb-6 text-center">
              Price Plan Details
            </h2>
            <div className="grid grid-cols-2 gap-4">
              <div className="mb-4">
                <p className="text-lg">
                  <strong>Plan Name:</strong> {selectedPrice.planName}
                </p>
              </div>
              <div className="mb-4">
                <p className="text-lg">
                  <strong>Plan Type:</strong>{" "}
                  <span className="capitalize">{selectedPrice.planType}</span>
                </p>
              </div>
              <div className="mb-4">
                <p className="text-lg">
                  <strong>Price:</strong>{" "}
                  {formatPrice(selectedPrice.basePrice, selectedPrice.currency)}
                </p>
              </div>
              <div className="mb-4">
                <p className="text-lg">
                  <strong>Currency:</strong> {selectedPrice.currency}
                </p>
              </div>
              <div className="mb-4">
                <p className="text-lg">
                  <strong>Description:</strong> {selectedPrice.description}
                </p>
              </div>
              <div className="mb-4">
                <p className="text-lg">
                  <strong>Status:</strong>{" "}
                  <span
                    className={`inline-block px-2 py-1 rounded text-sm font-bold ${
                      selectedPrice.isActive
                        ? "bg-green-100 text-green-700"
                        : "bg-red-100 text-red-700"
                    }`}
                  >
                    {selectedPrice.isActive ? "Active" : "Inactive"}
                  </span>
                </p>
              </div>
              <div className="mb-4">
                <p className="text-lg">
                  <strong>Created:</strong>{" "}
                  {formatDate(selectedPrice.createdAt)}
                </p>
              </div>
            </div>
          </div>
        </div>
      ) : (
        <div className="container mx-auto p-4 bg-white rounded shadow-md">
          {/* Search and Filter Controls */}
          <div className="mb-6">
            <div className="flex flex-col lg:flex-row gap-4 items-center justify-between">
              {/* <div className="flex flex-col sm:flex-row gap-4 w-full lg:w-auto">
                <div className="flex items-center gap-2">
                  <FaSearch className="text-gray-400" />
                  <select
                    value={searchField}
                    onChange={(e) => setSearchField(e.target.value)}
                    className="border border-gray-300 rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-400"
                  >
                    <option value="planName">Plan Name</option>
                    <option value="planType">Plan Type</option>
                    <option value="description">Description</option>
                  </select>
                  <input
                    type="text"
                    placeholder="Search..."
                    value={searchValue}
                    onChange={(e) => setSearchValue(e.target.value)}
                    className="border border-gray-300 rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-400 min-w-[200px]"
                  />
                </div>

                <div className="flex items-center gap-2">
                  <FaFilter className="text-gray-400" />
                  <select
                    value={statusFilter}
                    onChange={(e) => setStatusFilter(e.target.value)}
                    className="border border-gray-300 rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-400"
                  >
                    <option value="">All Status</option>
                    <option value="active">Active</option>
                    <option value="inactive">Inactive</option>
                  </select>
                </div>
              </div> */}
              {/* 
                <div className="text-sm text-gray-600">
                  {filteredData.length} of {prices.length} price plans
                </div> */}
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="min-w-full bg-white border border-gray-300 rounded-lg">
              <thead>
                <tr>
                  <th className="py-3 px-4 border-b border-gray-300 text-left bg-gray-100 font-semibold">
                    Plan Type
                  </th>
                  <th className="py-3 px-4 border-b border-gray-300 text-left bg-gray-100 font-semibold">
                    Price
                  </th>
                  <th className="py-3 px-4 border-b border-gray-300 text-left bg-gray-100 font-semibold">
                    Status
                  </th>
                  <th className="py-3 px-4 border-b border-gray-300 text-left bg-gray-100 font-semibold">
                    Created
                  </th>
                  <th className="py-3 px-4 border-b border-gray-300 text-left bg-gray-100 font-semibold">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody>
                {currentPageData.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="text-center py-8 text-gray-500">
                      {searchValue || statusFilter
                        ? "No price plans match your filters."
                        : "No price plans found."}
                    </td>
                  </tr>
                ) : (
                  currentPageData.map((price) => (
                    <tr
                      key={price._id}
                      className="relative hover:bg-gray-50 transition-colors"
                    >
                      <td className="py-3 px-4 border-b border-gray-300 capitalize">
                        {price.planType}
                      </td>
                      <td className="py-3 px-4 border-b border-gray-300 font-semibold">
                        {formatPrice(price.basePrice, price.currency)}
                      </td>
                      <td className="py-3 px-4 border-b border-gray-300">
                        <span
                          className={`inline-block px-3 py-1 rounded-full text-xs font-bold ${
                            price.isActive
                              ? "bg-green-100 text-green-700"
                              : "bg-red-100 text-red-700"
                          }`}
                        >
                          {price.isActive ? "Active" : "Inactive"}
                        </span>
                      </td>
                      <td className="py-3 px-4 border-b border-gray-300 text-gray-600">
                        {formatDate(price.createdAt)}
                      </td>
                      <td className="py-3 px-4 border-b border-gray-300">
                        <div className="dropdown-container">
                          <button
                            onClick={() => handleEditPrice(price)}
                            className="px-3 py-2 rounded text-gray-600 hover:text-gray-800 hover:bg-gray-100 transition-colors"
                            title="Actions"
                          >
                            <Pencil />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          {pageCount > 1 && (
            <div className="mt-6 flex justify-center">
              <ReactPaginate
                previousLabel={"Previous"}
                nextLabel={"Next"}
                breakLabel={"..."}
                pageCount={pageCount}
                marginPagesDisplayed={2}
                pageRangeDisplayed={5}
                onPageChange={handlePageClick}
                containerClassName={"pagination flex space-x-2"}
                pageClassName={"page-item"}
                pageLinkClassName={
                  "page-link px-3 py-2 border rounded hover:bg-gray-50 transition-colors"
                }
                previousLinkClassName={
                  "page-link px-3 py-2 border rounded hover:bg-gray-50 transition-colors"
                }
                nextLinkClassName={
                  "page-link px-3 py-2 border rounded hover:bg-gray-50 transition-colors"
                }
                breakLinkClassName={"page-link px-3 py-2 border rounded"}
                activeClassName={"active"}
                activeLinkClassName={"bg-blue-600 text-white border-blue-600"}
              />
            </div>
          )}
        </div>
      )}

      {/* Edit Form Overlay */}
      {showEditForm && editingPrice && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-xl font-semibold text-gray-800">
                Edit Price Plan
              </h3>
              <button
                onClick={handleEditCancel}
                className="text-gray-400 hover:text-gray-600 transition-colors"
              >
                <svg
                  className="w-6 h-6"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M6 18L18 6M6 6l12 12"
                  />
                </svg>
              </button>
            </div>

            <form onSubmit={handleEditSubmit} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-1 gap-4">
                {/* <div className="flex flex-col gap-2">
                  <label
                    htmlFor="editPlanName"
                    className="font-medium text-gray-700"
                  >
                    Plan Name <span className="text-red-500">*</span>
                  </label>
                  <input
                    id="editPlanName"
                    name="planName"
                    className={`border rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-400 ${
                      formErrors.planName ? "border-red-500" : "border-gray-300"
                    }`}
                    placeholder="Enter plan name"
                    value={editForm.planName}
                    onChange={(e) =>
                      setEditForm({
                        ...editForm,
                        [e.target.name]: e.target.value,
                      })
                    }
                    autoComplete="off"
                  />
                  {formErrors.planName && (
                    <span className="text-red-500 text-sm">
                      {formErrors.planName}
                    </span>
                  )}
                </div> */}

                {/* <div className="flex flex-col gap-2">
                  <label
                    htmlFor="editPlanType"
                    className="font-medium text-gray-700"
                  >
                    Plan Type
                  </label>
                  <select
                    id="editPlanType"
                    name="planType"
                    className="border border-gray-300 rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-400"
                    value={editForm.planType}
                    onChange={(e) =>
                      setEditForm({
                        ...editForm,
                        [e.target.name]: e.target.value,
                      })
                    }
                  >
                    <option value="monthly">Monthly</option>
                    <option value="annual">Annual</option>
                  </select>
                </div> */}

                <div className="flex flex-col gap-2">
                  <label
                    htmlFor="editBasePrice"
                    className="font-medium text-gray-700"
                  >
                    Price <span className="text-red-500">*</span>
                  </label>
                  <input
                    id="editBasePrice"
                    name="basePrice"
                    type="number"
                    min="0"
                    step="0.01"
                    className={`border rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-400 ${
                      formErrors.basePrice
                        ? "border-red-500"
                        : "border-gray-300"
                    }`}
                    placeholder="0.00"
                    value={editForm.basePrice}
                    onChange={(e) =>
                      setEditForm({
                        ...editForm,
                        [e.target.name]: e.target.value,
                      })
                    }
                  />
                  {formErrors.basePrice && (
                    <span className="text-red-500 text-sm">
                      {formErrors.basePrice}
                    </span>
                  )}
                </div>

                {/* <div className="flex flex-col gap-2">
                  <label
                    htmlFor="editCurrency"
                    className="font-medium text-gray-700"
                  >
                    Currency
                  </label>
                  <select
                    id="editCurrency"
                    name="currency"
                    className="border border-gray-300 rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-400"
                    value={editForm.currency}
                    onChange={(e) =>
                      setEditForm({
                        ...editForm,
                        [e.target.name]: e.target.value,
                      })
                    }
                  >
                    <option value="USD">USD</option>
                    <option value="EUR">EUR</option>
                    <option value="GBP">GBP</option>
                  </select>
                </div> */}
              </div>

              {/* <div className="flex flex-col gap-2">
                <label
                  htmlFor="editDescription"
                  className="font-medium text-gray-700"
                >
                  Description <span className="text-red-500">*</span>
                </label>
                <textarea
                  id="editDescription"
                  name="description"
                  rows="3"
                  className={`w-full border rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-400 ${
                    formErrors.description
                      ? "border-red-500"
                      : "border-gray-300"
                  }`}
                  placeholder="Enter plan description"
                  value={editForm.description}
                  onChange={(e) =>
                    setEditForm({
                      ...editForm,
                      [e.target.name]: e.target.value,
                    })
                  }
                />
                {formErrors.description && (
                  <span className="text-red-500 text-sm">
                    {formErrors.description}
                  </span>
                )}
              </div> */}

              {/* <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="editIsActive"
                  name="isActive"
                  checked={editForm.isActive}
                  onChange={(e) =>
                    setEditForm({
                      ...editForm,
                      [e.target.name]: e.target.checked,
                    })
                  }
                  className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                />
                <label
                  htmlFor="editIsActive"
                  className="text-gray-700 font-medium"
                >
                  Active
                </label>
              </div> */}

              <div className="flex gap-3 justify-end pt-4 border-t border-gray-200">
                <button
                  type="button"
                  onClick={handleEditCancel}
                  disabled={editLoading}
                  className="px-6 py-2 text-gray-600 border border-gray-300 rounded hover:bg-gray-50 disabled:opacity-50 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={editLoading}
                  className="px-6 py-2 text-white rounded hover:opacity-80 disabled:opacity-50 flex items-center gap-2 transition-colors"
                  style={{ backgroundColor: "#439AB8" }}
                >
                  {editLoading ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                      Updating...
                    </>
                  ) : (
                    "Update Price Plan"
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirmation Overlay */}
      {showDeleteConfirmation && priceToDelete && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
            <h3 className="text-lg font-semibold mb-4 text-red-600">
              Confirm Deletion
            </h3>
            <p className="text-gray-600 mb-6">
              Are you sure you want to delete the price plan{" "}
              <span className="font-semibold">{priceToDelete.planName}</span>?
            </p>
            <p className="text-sm text-gray-500 mb-6">
              This action cannot be undone and will permanently remove the price
              plan.
            </p>
            <div className="flex gap-3 justify-end">
              <button
                onClick={handleCancelDelete}
                disabled={deleteLoading}
                className="px-4 py-2 text-gray-600 border border-gray-300 rounded hover:bg-gray-50 disabled:opacity-50 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleConfirmDelete}
                disabled={deleteLoading}
                className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700 disabled:opacity-50 flex items-center gap-2 transition-colors"
              >
                {deleteLoading ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                    Deleting...
                  </>
                ) : (
                  "Delete Price Plan"
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Portal-based dropdown */}
      {/* {openDropdown && (
        <DropdownPortal
          price={prices.find((price) => price._id === openDropdown)}
          isOpen={true}
          onClose={() => setOpenDropdown(null)}
          position={dropdownPosition}
        />
      )} */}

      <ToastContainer />
    </div>
  );
};

export default PriceManagement;
