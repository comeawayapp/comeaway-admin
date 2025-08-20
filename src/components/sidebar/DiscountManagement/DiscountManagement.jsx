import { useState, useEffect, useContext, useCallback, useMemo } from "react";
import ReactPaginate from "react-paginate";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import PropTypes from "prop-types";
import { FaEye, FaPlus, FaTrash, FaEdit, FaEllipsisV } from "react-icons/fa";
import { AuthContext } from "../../../context/authContext";
import { createPortal } from "react-dom";
import {
  createDiscount,
  getDiscounts,
  deleteDiscount,
} from "../../../utils/API_SERVICE";

const initialState = {
  name: "",
  usageLimit: "",
  startDate: "",
  endDate: "",
  discountType: "",
  discountValue: "",
  applicablePlans: ["all"],
  description: "No description",
};

const DiscountManagement = () => {
  const { accessToken } = useContext(AuthContext);
  const [currentPage, setCurrentPage] = useState(0);
  const [searchField, setSearchField] = useState("couponCode");
  const [searchValue, setSearchValue] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [form, setForm] = useState(initialState);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [loading, setLoading] = useState(false);
  const [discounts, setDiscounts] = useState([]);
  const [fetchError, setFetchError] = useState("");
  const [fetching, setFetching] = useState(false);
  const [formOpen, setFormOpen] = useState(false);
  const [selectedDiscount, setSelectedDiscount] = useState(null);
  const [deleteLoading, setDeleteLoading] = useState(false);
  //   const [importLoading, setImportLoading] = useState(false);
  const [openDropdown, setOpenDropdown] = useState(null);
  const [dropdownPosition, setDropdownPosition] = useState({ x: 0, y: 0 });
  const [showEditForm, setShowEditForm] = useState(false);
  const [editingDiscount, setEditingDiscount] = useState(null);
  const [editForm, setEditForm] = useState(initialState);
  const [editLoading, setEditLoading] = useState(false);
  const [showDeleteConfirmation, setShowDeleteConfirmation] = useState(false);
  const [discountToDelete, setDiscountToDelete] = useState(null);
  const itemsPerPage = 20;

  // Portal-based dropdown component
  const DropdownPortal = ({ discount, isOpen, onClose, position }) => {
    if (!isOpen) return null;

    return createPortal(
      <div
        className="fixed w-48 bg-white rounded-lg shadow-xl z-[9999] border border-gray-200 overflow-hidden portal-dropdown"
        style={{
          left: position.x,
          top: position.y,
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Dropdown header */}
        <div className="px-3 py-2 bg-gray-50 border-b border-gray-200">
          <p className="text-xs font-medium text-gray-600">
            Actions for {discount.couponCode}
          </p>
        </div>

        <div className="py-1">
          <button
            onClick={(e) => {
              e.stopPropagation();
              handleViewDiscount(discount);
              onClose();
            }}
            className="flex items-center w-full px-4 py-2 text-sm text-gray-700 hover:bg-blue-50 hover:text-blue-700 transition-colors duration-150"
          >
            <FaEye className="mr-3 h-4 w-4 text-gray-500" />
            View Details
          </button>
          <button
            onClick={(e) => {
              e.stopPropagation();
              handleEditDiscount(discount);
              onClose();
            }}
            className="flex items-center w-full px-4 py-2 text-sm text-gray-700 hover:bg-green-50 hover:text-green-700 transition-colors duration-150"
          >
            <FaEdit className="mr-3 h-4 w-4 text-gray-500" />
            Edit Discount
          </button>
          <button
            onClick={(e) => {
              e.stopPropagation();
              handleDeleteDiscount(discount);
              onClose();
            }}
            disabled={deleteLoading}
            className="flex items-center w-full px-4 py-2 text-sm text-red-600 hover:bg-red-50 hover:text-red-700 transition-colors duration-150 border-t border-gray-100 disabled:opacity-50"
          >
            <FaTrash className="mr-3 h-4 w-4 text-red-500" />
            Delete Discount
          </button>
        </div>
      </div>,
      document.body
    );
  };

  // Add PropTypes validation
  DropdownPortal.propTypes = {
    discount: PropTypes.shape({
      couponCode: PropTypes.string.isRequired,
    }).isRequired,
    isOpen: PropTypes.bool.isRequired,
    onClose: PropTypes.func.isRequired,
    position: PropTypes.shape({
      x: PropTypes.number.isRequired,
      y: PropTypes.number.isRequired,
    }).isRequired,
  };

  useEffect(() => {
    if (accessToken) fetchDiscounts();
  }, [accessToken]);

  // Close dropdown when clicking outside - temporarily disabled for debugging
  useEffect(() => {
    const handleClickOutside = () => {
      // Only close if we have an open dropdown
      if (openDropdown === null) return;

      // Temporarily disable auto-closing to debug the issue
      // Check if click is on dropdown container or the portal dropdown
      // const isDropdownContainer = event.target.closest(".dropdown-container");
      // const isPortalDropdown = event.target.closest(".portal-dropdown");

      // if (!isDropdownContainer && !isPortalDropdown) {
      //   setTimeout(() => {
      //     setOpenDropdown(null);
      //   }, 10);
      // }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [openDropdown]);

  // Optimized debounced search effect with faster response
  useEffect(() => {
    if (accessToken) {
      const timeoutId = setTimeout(() => {
        fetchDiscounts();
      }, 300); // Reduced to 300ms for faster response

      return () => clearTimeout(timeoutId);
    }
  }, [accessToken, searchValue, statusFilter]);

  const fetchDiscounts = useCallback(async () => {
    setFetching(true);
    setFetchError("");

    try {
      const queryParams = {};

      if (searchValue.trim()) {
        queryParams[searchField] = searchValue.trim();
      }

      if (statusFilter) {
        queryParams.status = statusFilter;
      }

      // Call the API to get discounts
      const response = await getDiscounts(accessToken);
      console.log(response.discounts);
      setDiscounts(response.discounts || []);
    } catch (err) {
      setFetchError(err.message);
      toast.error("Error fetching discounts");
    } finally {
      setFetching(false);
    }
  }, [accessToken, searchValue, searchField, statusFilter]);

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
    setError("");
    setSuccess("");
  };

  const validate = () => {
    if (!form.name.trim()) return "Discount name is required.";
    if (!form.usageLimit || form.usageLimit <= 0)
      return "Usage limit must be greater than 0.";
    if (!form.startDate) return "Start date is required.";
    if (!form.endDate) return "End date is required.";
    if (!form.discountType) return "Discount type is required.";
    if (!form.discountValue || form.discountValue < 0)
      return "Discount value must be 0 or greater.";
    if (new Date(form.startDate) >= new Date(form.endDate))
      return "End date must be after start date.";
    return null;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setSuccess("");

    const validationError = validate();
    if (validationError) {
      setError(validationError);
      return;
    }
    setLoading(true);
    try {
      console.log(form);
      const response = await createDiscount(form, accessToken);
      console.log(response);
      setSuccess("Discount created successfully.");
      setForm(initialState);
      setFormOpen(false);
      toast.success(response.message || "Discount created successfully");
      // Refresh the discounts list
      await fetchDiscounts();
    } catch (err) {
      setError(err.message);
      toast.error(err.message || "Error creating discount");
    } finally {
      setLoading(false);
    }
  };

  const handlePageClick = (data) => {
    setCurrentPage(data.selected);
  };

  const handleDiscountPreview = useCallback((discount) => {
    setSelectedDiscount(discount);
  }, []);

  const handleBackToTable = useCallback(() => {
    setSelectedDiscount(null);
  }, []);

  const handleDeleteDiscount = useCallback((discount) => {
    setDiscountToDelete(discount);
    setShowDeleteConfirmation(true);
    setOpenDropdown(null);
  }, []);

  const handleConfirmDelete = async () => {
    if (!discountToDelete) return;

    setDeleteLoading(true);
    try {
      // Call the API to delete discount
      await deleteDiscount(discountToDelete._id, accessToken);

      toast.success("Discount deleted successfully");
      setShowDeleteConfirmation(false);
      setDiscountToDelete(null);
      // Refresh the discounts list
      await fetchDiscounts();
    } catch (err) {
      toast.error(err.message || "Error deleting discount");
      setShowDeleteConfirmation(false);
      setDiscountToDelete(null);
    } finally {
      setDeleteLoading(false);
    }
  };

  const handleCancelDelete = () => {
    setShowDeleteConfirmation(false);
    setDiscountToDelete(null);
  };

  const handleDropdownToggle = (discountId, event) => {
    if (openDropdown === discountId) {
      setOpenDropdown(null);
      return;
    }

    // Calculate position for the dropdown
    if (event) {
      const rect = event.currentTarget.getBoundingClientRect();
      const viewportWidth = window.innerWidth;
      const viewportHeight = window.innerHeight;

      let x = rect.right + 10; // 10px to the right of button
      let y = rect.bottom + 10; // 10px below button

      // If dropdown would go off the right edge, position it to the left
      if (x + 192 > viewportWidth) {
        // 192px is dropdown width
        x = rect.left - 192 - 10;
      }

      // If dropdown would go off the bottom edge, position it above
      if (y + 300 > viewportHeight) {
        // 300px estimated height
        y = rect.top - 300 - 10;
      }

      // Ensure dropdown doesn't go off the left edge
      if (x < 10) {
        x = 10;
      }

      setDropdownPosition({ x, y });
    }

    setOpenDropdown(discountId);
  };

  const handleEditDiscount = (discount) => {
    setEditingDiscount(discount);
    setEditForm({
      couponCode: discount.couponCode || "",
      name: discount.name || "",
      usageLimit: discount.usageLimit || "",
      startDate: discount.startDate
        ? new Date(discount.startDate).toISOString().split("T")[0]
        : "",
      endDate: discount.endDate
        ? new Date(discount.endDate).toISOString().split("T")[0]
        : "",
      discountType: discount.discountType || "",
      discountValue: discount.discountValue || "",
      applicablePlans: discount.applicablePlans || "All",
    });
    setShowEditForm(true);
    setOpenDropdown(null);
  };

  const handleEditSubmit = async (e) => {
    e.preventDefault();
    if (!editingDiscount) return;

    setEditLoading(true);
    try {
      // Call the API to update discount
      const response = await createDiscount(editForm, accessToken);

      if (response.success) {
        toast.success("Discount updated successfully!");
        setShowEditForm(false);
        setEditingDiscount(null);
        setEditForm(initialState);
        // Refresh the discounts list
        await fetchDiscounts();
      } else {
        toast.error(response.message || "Failed to update discount");
      }
    } catch (error) {
      toast.error(error.message || "Error updating discount");
    } finally {
      setEditLoading(false);
    }
  };

  const handleEditCancel = () => {
    setShowEditForm(false);
    setEditingDiscount(null);
    setEditForm(initialState);
  };

  const handleViewDiscount = (discount) => {
    handleDiscountPreview(discount);
    setOpenDropdown(null);
  };

  const filteredData = useMemo(() => discounts, [discounts]);

  const currentPageData = useMemo(() => {
    const offset = currentPage * itemsPerPage;
    return filteredData.slice(offset, offset + itemsPerPage);
  }, [filteredData, currentPage, itemsPerPage]);

  const pageCount = useMemo(
    () => Math.ceil(filteredData.length / itemsPerPage),
    [filteredData.length, itemsPerPage]
  );

  return (
    <div className="container mx-auto p-4">
      <div className="mb-10">
        <h1 className="text-4xl font-bold text-center mt-6">
          Discount Management
        </h1>
      </div>

      {selectedDiscount ? (
        <div className="container mx-auto p-4 bg-white rounded shadow-md">
          <button
            onClick={handleBackToTable}
            className="mb-4 px-4 py-2 bg-gray-400 text-white rounded"
          >
            Back
          </button>
          <div className="bg-gray-100 p-6 rounded shadow-md">
            <h2 className="text-3xl font-bold mb-6 text-center">
              Discount Details
            </h2>
            <div className="grid grid-cols-2 gap-4">
              <div className="mb-4">
                <p className="text-lg">
                  <strong>Coupon Code:</strong> {selectedDiscount.couponCode}
                </p>
              </div>
              <div className="mb-4">
                <p className="text-lg">
                  <strong>Name:</strong> {selectedDiscount.name}
                </p>
              </div>
              <div className="mb-4">
                <p className="text-lg">
                  <strong>Usage Limit:</strong> {selectedDiscount.usageLimit}
                </p>
              </div>
              <div className="mb-4">
                <p className="text-lg">
                  <strong>Used:</strong> {selectedDiscount.used}
                </p>
              </div>
              <div className="mb-4">
                <p className="text-lg">
                  <strong>Status:</strong>{" "}
                  <span
                    className={`inline-block px-2 py-1 rounded text-sm font-bold ${
                      selectedDiscount.status === "active"
                        ? "bg-green-100 text-green-700"
                        : "bg-red-100 text-red-700"
                    }`}
                  >
                    {selectedDiscount.status}
                  </span>
                </p>
              </div>
              <div className="mb-4">
                <p className="text-lg">
                  <strong>Start Date:</strong>{" "}
                  {selectedDiscount.startDate
                    ? new Date(selectedDiscount.startDate).toLocaleDateString()
                    : "N/A"}
                </p>
              </div>
              <div className="mb-4">
                <p className="text-lg">
                  <strong>End Date:</strong>{" "}
                  {selectedDiscount.endDate
                    ? new Date(selectedDiscount.endDate).toLocaleDateString()
                    : "N/A"}
                </p>
              </div>
              <div className="mb-4">
                <p className="text-lg">
                  <strong>Discount Type:</strong>{" "}
                  {selectedDiscount.discountType}
                </p>
              </div>
              <div className="mb-4">
                <p className="text-lg">
                  <strong>Discount Value:</strong>{" "}
                  {selectedDiscount.discountValue}
                  {selectedDiscount.discountType === "percentage" ? "%" : ""}
                </p>
              </div>
              <div className="mb-4">
                <p className="text-lg">
                  <strong>Applicable Plans:</strong>{" "}
                  {selectedDiscount.applicablePlans || "No plans specified"}
                </p>
              </div>
            </div>
          </div>
        </div>
      ) : (
        <div className="container mx-auto p-4 bg-white rounded shadow-md">
          <div className="mb-4">
            <div className="flex gap-4 items-center justify-between">
              <div className="flex gap-4 items-center flex-1">
                {/* <select
                  value={searchField}
                  onChange={handleSearchFieldChange}
                  className="px-4 py-2 border rounded w-48"
                >
                  <option value="couponCode">Coupon Code</option>
                  <option value="name">Name</option>
                </select>
                <input
                  type="text"
                  placeholder="Search by..."
                  value={searchValue}
                  onChange={handleSearchValueChange}
                  className="px-4 py-2 border rounded w-64"
                />
                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  className="px-4 py-2 border rounded w-48"
                >
                  <option value="">All Status</option>
                  <option value="active">Active</option>
                  <option value="inactive">Inactive</option>
                  <option value="expired">Expired</option>
                </select> */}
              </div>
              <div className="flex space-x-2">
                <button
                  onClick={() => setFormOpen(!formOpen)}
                  className="px-4 py-2 text-white rounded flex items-center gap-2"
                  style={{ backgroundColor: "#439AB8" }}
                >
                  <FaPlus />
                  {formOpen ? "Hide Form" : "Add Discount"}
                </button>
              </div>
            </div>
          </div>

          {formOpen && (
            <div className="mb-6 bg-gray-100 p-6 rounded shadow-md">
              <h2 className="text-2xl font-bold mb-6 text-center">
                Create Discount
              </h2>
              <form className="grid grid-cols-2 gap-4" onSubmit={handleSubmit}>
                <div className="flex flex-col gap-1">
                  <label htmlFor="name" className="font-medium text-gray-700">
                    Discount Name
                  </label>
                  <input
                    id="name"
                    name="name"
                    className="border border-gray-300 rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-400"
                    placeholder="Discount Name"
                    value={form.name}
                    onChange={handleChange}
                    autoComplete="off"
                  />
                </div>
                <div className="flex flex-col gap-1">
                  <label
                    htmlFor="usageLimit"
                    className="font-medium text-gray-700"
                  >
                    Usage Limit
                  </label>
                  <input
                    id="usageLimit"
                    name="usageLimit"
                    type="number"
                    min="1"
                    className="border border-gray-300 rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-400"
                    placeholder="Usage Limit"
                    value={form.usageLimit}
                    onChange={handleChange}
                  />
                </div>
                <div className="flex flex-col gap-1">
                  <label
                    htmlFor="startDate"
                    className="font-medium text-gray-700"
                  >
                    Start Date
                  </label>
                  <input
                    id="startDate"
                    name="startDate"
                    type="date"
                    className="border border-gray-300 rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-400"
                    value={form.startDate}
                    onChange={handleChange}
                  />
                </div>
                <div className="flex flex-col gap-1">
                  <label
                    htmlFor="endDate"
                    className="font-medium text-gray-700"
                  >
                    End Date
                  </label>
                  <input
                    id="endDate"
                    name="endDate"
                    type="date"
                    className="border border-gray-300 rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-400"
                    value={form.endDate}
                    onChange={handleChange}
                  />
                </div>
                <div className="flex flex-col gap-1">
                  <label
                    htmlFor="discountType"
                    className="font-medium text-gray-700"
                  >
                    Discount Type
                  </label>
                  <select
                    id="discountType"
                    name="discountType"
                    className="border border-gray-300 rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-400"
                    value={form.discountType}
                    onChange={handleChange}
                  >
                    <option value="">Select Type</option>
                    <option value="percentage">Percentage</option>
                    <option value="fixed">Fixed Amount</option>
                  </select>
                </div>
                <div className="flex flex-col gap-1">
                  <label
                    htmlFor="discountValue"
                    className="font-medium text-gray-700"
                  >
                    Discount Value
                  </label>
                  <input
                    id="discountValue"
                    name="discountValue"
                    type="number"
                    min="0"
                    step="0.01"
                    className="border border-gray-300 rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-400"
                    placeholder="Discount Value"
                    value={form.discountValue}
                    onChange={handleChange}
                  />
                </div>
                <div className="col-span-2">
                  <label
                    htmlFor="applicablePlans"
                    className="font-medium text-gray-700"
                  >
                    Applicable Plans
                  </label>
                  <select
                    id="applicablePlans"
                    name="applicablePlans"
                    className="border border-gray-300 rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-400"
                    value={form.applicablePlans}
                    onChange={handleChange}
                  >
                    <option value="all">All</option>
                    <option value="monthly">Monthly</option>
                    <option value="annual">Annual</option>
                  </select>
                </div>
                <div className="col-span-2">
                  <button
                    type="submit"
                    disabled={loading}
                    className="w-full px-4 py-2 text-white rounded font-semibold disabled:opacity-60 disabled:cursor-not-allowed"
                    style={{ backgroundColor: "#439AB8" }}
                  >
                    {loading ? "Creating..." : "Create Discount"}
                  </button>
                </div>
                {error && (
                  <div className="col-span-2 text-red-500 mt-2 text-sm font-medium">
                    {error}
                  </div>
                )}
                {success && (
                  <div className="col-span-2 text-green-600 mt-2 text-sm font-medium">
                    {success}
                  </div>
                )}
              </form>
            </div>
          )}

          <div className="overflow-x-auto">
            <table className="min-w-full bg-white border border-gray-300 rounded-lg">
              <thead>
                <tr>
                  <th className="py-2 px-4 border-b border-gray-300 text-left bg-gray-100">
                    Coupon Code
                  </th>
                  <th className="py-2 px-4 border-b border-gray-300 text-left bg-gray-100">
                    Name
                  </th>
                  <th className="py-2 px-4 border-b border-gray-300 text-left bg-gray-100">
                    Usage Limit
                  </th>
                  <th className="py-2 px-4 border-b border-gray-300 text-left bg-gray-100">
                    Used
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
                  <th className="py-2 px-4 border-b border-gray-300 text-left bg-gray-100">
                    Applicable Plans
                  </th>
                  <th className="py-2 px-4 border-b border-gray-300 text-left bg-gray-100">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody>
                {fetching ? (
                  <tr>
                    <td colSpan={9} className="text-center py-4">
                      Loading discounts...
                    </td>
                  </tr>
                ) : fetchError ? (
                  <tr>
                    <td colSpan={9} className="text-center py-4 text-red-500">
                      {fetchError}
                    </td>
                  </tr>
                ) : currentPageData.length === 0 ? (
                  <tr>
                    <td colSpan={9} className="text-center py-4">
                      No discounts found.
                    </td>
                  </tr>
                ) : (
                  currentPageData.map((discount) => (
                    <tr
                      key={discount._id}
                      className="relative hover:bg-gray-50"
                    >
                      <td className="py-2 px-4 border-b border-gray-300 font-mono font-semibold text-blue-700">
                        {discount.couponCode}
                      </td>
                      <td className="py-2 px-4 border-b border-gray-300 capitalize">
                        {discount.name}
                      </td>
                      <td className="py-2 px-4 border-b border-gray-300">
                        {discount.usageLimit}
                      </td>
                      <td className="py-2 px-4 border-b border-gray-300">
                        {discount.usedCount}
                      </td>
                      <td className="py-2 px-4 border-b border-gray-300">
                        <span
                          className={`inline-block px-2 py-1 rounded text-xs font-bold ${
                            discount.isActive === true
                              ? "bg-green-100 text-green-700"
                              : discount.isActive === false
                              ? "bg-red-100 text-red-700"
                              : "bg-gray-100 text-gray-700"
                          }`}
                        >
                          {discount.isActive ? "Active" : "Inactive"}
                        </span>
                      </td>
                      <td className="py-2 px-4 border-b border-gray-300">
                        {discount.startDate
                          ? new Date(discount.startDate).toLocaleDateString()
                          : "N/A"}
                      </td>
                      <td className="py-2 px-4 border-b border-gray-300">
                        {discount.endDate
                          ? new Date(discount.endDate).toLocaleDateString()
                          : "N/A"}
                      </td>
                      <td className="py-2 px-4 border-b border-gray-300 capitalize">
                        {discount.applicablePlans || "No plans specified"}
                      </td>
                      <td className="py-2 px-4 border-b border-gray-300">
                        {/* relative dropdown-container */}
                        <div className="dropdown-container">
                          <button
                            onClick={(event) =>
                              handleDropdownToggle(discount._id, event)
                            }
                            className="px-3 py-1 rounded text-gray-600 hover:text-gray-800 hover:bg-gray-100"
                            title="Actions"
                          >
                            <FaEllipsisV />
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
              pageCount={pageCount}
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

      {/* Edit Form Overlay */}
      {showEditForm && editingDiscount && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto">
            <h3 className="text-lg font-semibold mb-4">Edit Discount</h3>
            <form
              onSubmit={handleEditSubmit}
              className="grid grid-cols-2 gap-4"
            >
              <div className="flex flex-col gap-1">
                <label
                  htmlFor="editCouponCode"
                  className="font-medium text-gray-700"
                >
                  Coupon Code
                </label>
                <input
                  id="editCouponCode"
                  name="couponCode"
                  className="border border-gray-300 rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-400"
                  placeholder="Coupon Code"
                  value={editForm.couponCode}
                  onChange={(e) =>
                    setEditForm({
                      ...editForm,
                      [e.target.name]: e.target.value,
                    })
                  }
                  autoComplete="off"
                />
              </div>
              <div className="flex flex-col gap-1">
                <label htmlFor="editName" className="font-medium text-gray-700">
                  Discount Name
                </label>
                <input
                  id="editName"
                  name="name"
                  className="border border-gray-300 rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-400"
                  placeholder="Discount Name"
                  value={editForm.name}
                  onChange={(e) =>
                    setEditForm({
                      ...editForm,
                      [e.target.name]: e.target.value,
                    })
                  }
                  autoComplete="off"
                />
              </div>
              <div className="flex flex-col gap-1">
                <label
                  htmlFor="editUsageLimit"
                  className="font-medium text-gray-700"
                >
                  Usage Limit
                </label>
                <input
                  id="editUsageLimit"
                  name="usageLimit"
                  type="number"
                  min="1"
                  className="border border-gray-300 rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-400"
                  placeholder="Usage Limit"
                  value={editForm.usageLimit}
                  onChange={(e) =>
                    setEditForm({
                      ...editForm,
                      [e.target.name]: e.target.value,
                    })
                  }
                />
              </div>
              <div className="flex flex-col gap-1">
                <label
                  htmlFor="editStartDate"
                  className="font-medium text-gray-700"
                >
                  Start Date
                </label>
                <input
                  id="editStartDate"
                  name="startDate"
                  type="date"
                  className="border border-gray-300 rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-400"
                  value={editForm.startDate}
                  onChange={(e) =>
                    setEditForm({
                      ...editForm,
                      [e.target.name]: e.target.value,
                    })
                  }
                />
              </div>
              <div className="flex flex-col gap-1">
                <label
                  htmlFor="editEndDate"
                  className="font-medium text-gray-700"
                >
                  End Date
                </label>
                <input
                  id="editEndDate"
                  name="endDate"
                  type="date"
                  className="border border-gray-300 rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-400"
                  value={editForm.endDate}
                  onChange={(e) =>
                    setEditForm({
                      ...editForm,
                      [e.target.name]: e.target.value,
                    })
                  }
                />
              </div>
              <div className="flex flex-col gap-1">
                <label
                  htmlFor="editDiscountType"
                  className="font-medium text-gray-700"
                >
                  Discount Type
                </label>
                <select
                  id="editDiscountType"
                  name="discountType"
                  className="border border-gray-300 rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-400"
                  value={editForm.discountType}
                  onChange={(e) =>
                    setEditForm({
                      ...editForm,
                      [e.target.name]: e.target.value,
                    })
                  }
                >
                  <option value="">Select Type</option>
                  <option value="percentage">Percentage</option>
                  <option value="fixed">Fixed Amount</option>
                </select>
              </div>
              <div className="flex flex-col gap-1">
                <label
                  htmlFor="editDiscountValue"
                  className="font-medium text-gray-700"
                >
                  Discount Value
                </label>
                <input
                  id="editDiscountValue"
                  name="discountValue"
                  type="number"
                  min="0"
                  step="0.01"
                  className="border border-gray-300 rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-400"
                  placeholder="Discount Value"
                  value={editForm.discountValue}
                  onChange={(e) =>
                    setEditForm({
                      ...editForm,
                      [e.target.name]: e.target.value,
                    })
                  }
                />
              </div>
              <div className="col-span-2">
                <label
                  htmlFor="editApplicablePlans"
                  className="font-medium text-gray-700"
                >
                  Applicable Plans
                </label>
                <select
                  id="editApplicablePlans"
                  name="applicablePlans"
                  className="border border-gray-300 rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-400"
                  value={editForm.applicablePlans}
                  onChange={(e) =>
                    setEditForm({
                      ...editForm,
                      [e.target.name]: e.target.value,
                    })
                  }
                >
                  <option value="All">All</option>
                  <option value="Monthly">Monthly</option>
                  <option value="Annual">Annual</option>
                </select>
              </div>
              <div className="col-span-2 flex gap-3 justify-end mt-4">
                <button
                  type="button"
                  onClick={handleEditCancel}
                  disabled={editLoading}
                  className="px-4 py-2 text-gray-600 border border-gray-300  rounded hover:bg-gray-50 disabled:opacity-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={editLoading}
                  className="px-4 py-2 text-white rounded hover:opacity-80 disabled:opacity-50 flex items-center gap-2"
                  style={{ backgroundColor: "#439AB8" }}
                >
                  {editLoading ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                      Updating...
                    </>
                  ) : (
                    "Update Discount"
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirmation Overlay */}
      {showDeleteConfirmation && discountToDelete && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
            <h3 className="text-lg font-semibold mb-4 text-red-600">
              Confirm Deletion
            </h3>
            <p className="text-gray-600 mb-6">
              Are you sure you want to delete the discount{" "}
              <span className="font-semibold font-mono">
                {discountToDelete.couponCode}
              </span>
              ?
            </p>
            <p className="text-sm text-gray-500 mb-6">
              This action cannot be undone and will permanently remove the
              discount.
            </p>
            <div className="flex gap-3 justify-end">
              <button
                onClick={handleCancelDelete}
                disabled={deleteLoading}
                className="px-4 py-2 text-gray-600 border border-gray-300 rounded hover:bg-gray-50 disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                onClick={handleConfirmDelete}
                disabled={deleteLoading}
                className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700 disabled:opacity-50 flex items-center gap-2"
              >
                {deleteLoading ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                    Deleting...
                  </>
                ) : (
                  "Delete Discount"
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Portal-based dropdown - renders outside table hierarchy */}
      {openDropdown && (
        <DropdownPortal
          discount={discounts.find((discount) => discount._id === openDropdown)}
          isOpen={true}
          onClose={() => setOpenDropdown(null)}
          position={dropdownPosition}
        />
      )}

      <ToastContainer />
    </div>
  );
};

export default DiscountManagement;
