import { useState, useEffect, useContext, useCallback, useMemo } from "react";
import ReactPaginate from "react-paginate";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import PropTypes from "prop-types";
import {
  FaPlus,
  FaTrash,
  FaEdit,
  FaEllipsisV,
  FaToggleOff,
} from "react-icons/fa";
import { AuthContext } from "../../../context/authContext";
import { createPortal } from "react-dom";
import {
  createDiscount,
  getDiscounts,
  deleteDiscount,
  getAllAssignments,
  getPrices,
  assignDiscountToPrice,
  removeDiscountFromPrice,
  updateDiscount,
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
  const [prices, setPrices] = useState([]);
  const [discounts, setDiscounts] = useState([]);
  const [fetchError, setFetchError] = useState("");
  const [fetching, setFetching] = useState(false);
  const [formOpen, setFormOpen] = useState(false);
  const [selectedDiscount, setSelectedDiscount] = useState(null);
  const [assignDiscount, setAssignDiscount] = useState([]);
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
  const [discountToAdd, setDiscountToAdd] = useState(null);
  const [discountToRemove, setDiscountToRemove] = useState(null);
  const [showAddToPrice, setShowAddToPrice] = useState(false);
  const [showRemoveFromPrice, setShowRemoveFromPrice] = useState(false);
  const [selectedPrice, setSelectedPrice] = useState("");
  const [priceOperationLoading, setPriceOperationLoading] = useState(false);
  const itemsPerPage = 20;

  // Portal-based dropdown component
  const DropdownPortal = ({ discount, isOpen, onClose, position }) => {
    if (!isOpen) return null;

    return createPortal(
      <div
        className="fixed w-64 bg-white rounded-lg shadow-xl border border-gray-200 overflow-hidden portal-dropdown"
        style={{
          left: position.x,
          top: position.y,
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Dropdown header */}
        <div className="dropdown-header">
          <p className="text-xs font-medium text-gray-600">
            Actions for {discount.couponCode}
          </p>
          <button
            onClick={(e) => {
              e.stopPropagation();
              onClose();
            }}
            className="text-gray-400 hover:text-gray-600 transition-colors p-1 rounded hover:bg-gray-100"
            title="Close dropdown"
          >
            <svg
              className="w-4 h-4"
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

        <div className="py-1">
          {assignDiscount.some(
            (assignment) =>
              assignment?.availableDiscounts[0]?.couponCode ===
              discount?.couponCode
          ) ? (
            <button
              onClick={(e) => {
                e.stopPropagation();
                handleRemoveFromPrice(discount);
                onClose();
              }}
              className="flex items-center w-full px-4 py-2 text-sm text-gray-700 hover:bg-blue-50 text-[12px] hover:text-blue-700 transition-colors duration-150"
            >
              <FaToggleOff className="mr-3 h-4 w-4 text-gray-500" />
              Remove from Price
            </button>
          ) : (
            <button
              onClick={(e) => {
                e.stopPropagation();
                handleAddToPrice(discount);
                onClose();
              }}
              className="dropdown-item"
            >
              <FaPlus className="mr-3 h-4 w-4 text-gray-500" />
              Add to Price
            </button>
          )}

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
      _id: PropTypes.string.isRequired,
      couponCode: PropTypes.string.isRequired,
    }).isRequired,
    isOpen: PropTypes.bool.isRequired,
    onClose: PropTypes.func.isRequired,
    position: PropTypes.shape({
      x: PropTypes.number.isRequired,
      y: PropTypes.number.isRequired,
    }).isRequired,
  };

  const fetchPrices = async () => {
    setFetching(true);
    setError("");
    try {
      const response = await getPrices(accessToken);
      // console.log(response);
      setPrices(response.prices || []);
    } catch (err) {
      setError(err.message);
      toast.error("Error fetching prices");
    } finally {
      setFetching(false);
    }
  };

  useEffect(() => {
    if (accessToken) {
      fetchAssignments();
      fetchDiscounts();
      fetchPrices();
    }
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

  const fetchAssignments = useCallback(async () => {
    const response = await getAllAssignments(accessToken);
    // console.log("assignments", response.prices);
    setAssignDiscount(response.prices || []);
  }, [accessToken]);

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
      // console.log(response.discounts);
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
      // console.log(form);
      const response = await createDiscount(form, accessToken);
      // console.log(response);
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

  const handleAddToPrice = useCallback((discount) => {
    // console.log("discount", discount);
    setDiscountToAdd(discount);
    setShowAddToPrice(true);
  }, []);

  const handleRemoveFromPrice = useCallback((discount) => {
    // console.log("discount", discount);
    setDiscountToRemove(discount);
    setShowRemoveFromPrice(true);
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

  const handleAddToPriceSubmit = async (price) => {
    if (!price || price === "") {
      toast.error("Please select a price plan");
      return;
    }

    setPriceOperationLoading(true);
    try {
      const response = await assignDiscountToPrice(
        {
          priceId: price,
          discountId: discountToAdd._id,
        },
        accessToken
      );

      toast.success(response.message);
      setShowAddToPrice(false);
      setDiscountToAdd(null);
      setSelectedPrice("");
      await fetchAssignments(); // Refresh assignments
      await fetchDiscounts(); // Refresh discounts
      await fetchPrices(); // Refresh prices
    } catch (error) {
      // console.log(error);
      toast.error(error.message);
    } finally {
      setPriceOperationLoading(false);
    }
  };

  const handleRemoveFromPriceSubmit = async (priceId) => {
    setPriceOperationLoading(true);
    try {
      const response = await removeDiscountFromPrice(
        priceId,
        discountToRemove._id,
        accessToken
      );
      toast.success(response.message);
      setShowRemoveFromPrice(false);
      setDiscountToRemove(null);
      await fetchAssignments(); // Refresh assignments
      await fetchDiscounts(); // Refresh discounts
      await fetchPrices(); // Refresh prices
    } catch (error) {
      toast.error(error.message);
    } finally {
      setPriceOperationLoading(false);
    }
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
      await updateDiscount(editingDiscount._id, editForm, accessToken);
      toast.success("Discount updated successfully!");
      setShowEditForm(false);
      setEditingDiscount(null);
      setEditForm(initialState);
      // Refresh the discounts list
      await fetchDiscounts();
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

  //   const handleViewDiscount = (discount) => {
  //     handleDiscountPreview(discount);
  //     setOpenDropdown(null);
  //   };

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
    <div className="page">
      <div className="mb-10">
        <h1 className="page-title">
          Discount Management
        </h1>
      </div>

      {selectedDiscount ? (
        <div className="card is-padded">
          <button
            onClick={handleBackToTable}
            className="btn btn-secondary mb-4"
          >
            Back
          </button>
          <div className="bg-gray-100 p-6 rounded shadow-md">
            <h2 className="page-title">
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
        <div className="card is-padded">
          <div className="mb-4">
            <div className="flex gap-4 items-center justify-between">
              <div className="flex gap-4 items-center flex-1">
                {/* <select
                  value={searchField}
                  onChange={handleSearchFieldChange}
                  className="select"
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
                  className="select"
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
                  className="btn btn-primary"
                >
                  <FaPlus />
                  {formOpen ? "Hide Form" : "Add Discount"}
                </button>
              </div>
            </div>
          </div>

          {formOpen && (
            <div className="mb-6 bg-gray-100 p-6 rounded shadow-md">
              <h2 className="page-title">
                Create Discount
              </h2>
              <form className="grid grid-cols-2 gap-4" onSubmit={handleSubmit}>
                <div className="field">
                  <label htmlFor="name" className="field-label">
                    Discount Name
                  </label>
                  <input
                    id="name"
                    name="name"
                    className="input"
                    placeholder="Discount Name"
                    value={form.name}
                    onChange={handleChange}
                    autoComplete="off"
                  />
                </div>
                <div className="field">
                  <label
                    htmlFor="usageLimit"
                    className="field-label"
                  >
                    Usage Limit
                  </label>
                  <input
                    id="usageLimit"
                    name="usageLimit"
                    type="number"
                    min="1"
                    className="input"
                    placeholder="Usage Limit"
                    value={form.usageLimit}
                    onChange={handleChange}
                  />
                </div>
                <div className="field">
                  <label
                    htmlFor="startDate"
                    className="field-label"
                  >
                    Start Date
                  </label>
                  <input
                    id="startDate"
                    name="startDate"
                    min={new Date().toISOString().split("T")[0]}
                    type="date"
                    className="input"
                    value={form.startDate}
                    onChange={handleChange}
                  />
                </div>
                <div className="field">
                  <label
                    htmlFor="endDate"
                    className="field-label"
                  >
                    End Date
                  </label>
                  <input
                    id="endDate"
                    name="endDate"
                    min={new Date().toISOString().split("T")[0]}
                    type="date"
                    className="input"
                    value={form.endDate}
                    onChange={handleChange}
                  />
                </div>
                <div className="field">
                  <label
                    htmlFor="discountType"
                    className="field-label"
                  >
                    Discount Type
                  </label>
                  <select
                    id="discountType"
                    name="discountType"
                    className="select"
                    value={form.discountType}
                    onChange={handleChange}
                  >
                    <option value="">Select Type</option>
                    <option value="percentage">Percentage</option>
                    <option value="fixed">Fixed Amount</option>
                  </select>
                </div>
                <div className="field">
                  <label
                    htmlFor="discountValue"
                    className="field-label"
                  >
                    Discount Value
                  </label>
                  <input
                    id="discountValue"
                    name="discountValue"
                    type="number"
                    min="0"
                    step="0.01"
                    className="input"
                    placeholder="Discount Value"
                    value={form.discountValue}
                    onChange={handleChange}
                  />
                </div>
                <div className="col-span-2">
                  <label
                    htmlFor="applicablePlans"
                    className="field-label"
                  >
                    Applicable Plans
                  </label>
                  <select
                    id="applicablePlans"
                    name="applicablePlans"
                    className="select"
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
                    className="btn btn-primary w-full"
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

          <div className="table-wrap">
            <table className="data-table">
              <thead>
                <tr>
                  <th>
                    Coupon Code
                  </th>
                  <th>
                    Name
                  </th>
                  <th>
                    Usage Limit
                  </th>
                  <th>
                    Used
                  </th>
                  <th>
                    Discount Type
                  </th>
                  <th>
                    Discount Value
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
                  <th>
                    Applicable Plans
                  </th>
                  <th>
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody>
                {fetching ? (
                  <tr>
                    <td colSpan={9} className="empty-state">
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
                    <td colSpan={9} className="empty-state">
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
                      <td>
                        {discount.usageLimit}
                      </td>
                      <td>
                        {discount.usedCount}
                      </td>
                      <td>
                        {discount.discountType}
                      </td>
                      <td>
                        {discount.discountValue}
                      </td>
                      <td>
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
                      <td>
                        {discount.startDate
                          ? new Date(discount.startDate).toLocaleDateString()
                          : "N/A"}
                      </td>
                      <td>
                        {discount.endDate
                          ? new Date(discount.endDate).toLocaleDateString()
                          : "N/A"}
                      </td>
                      <td className="py-2 px-4 border-b border-gray-300 capitalize">
                        {discount.applicablePlans || "No plans specified"}
                      </td>
                      <td>
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
        <div className="modal-overlay">
          <div className="bg-white rounded-lg p-6 max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto">
            <h3 className="card-title">Edit Discount</h3>
            <form
              onSubmit={handleEditSubmit}
              className="grid grid-cols-2 gap-4"
            >
              <div className="field">
                <label
                  htmlFor="editCouponCode"
                  className="field-label"
                >
                  Coupon Code
                </label>
                <input
                  id="editCouponCode"
                  name="couponCode"
                  className="input"
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
              <div className="field">
                <label htmlFor="editName" className="field-label">
                  Discount Name
                </label>
                <input
                  id="editName"
                  name="name"
                  className="input"
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
              <div className="field">
                <label
                  htmlFor="editUsageLimit"
                  className="field-label"
                >
                  Usage Limit
                </label>
                <input
                  id="editUsageLimit"
                  name="usageLimit"
                  type="number"
                  min="1"
                  className="input"
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
              <div className="field">
                <label
                  htmlFor="editStartDate"
                  className="field-label"
                >
                  Start Date
                </label>
                <input
                  id="editStartDate"
                  name="startDate"
                  type="date"
                  className="input"
                  value={editForm.startDate}
                  onChange={(e) =>
                    setEditForm({
                      ...editForm,
                      [e.target.name]: e.target.value,
                    })
                  }
                />
              </div>
              <div className="field">
                <label
                  htmlFor="editEndDate"
                  className="field-label"
                >
                  End Date
                </label>
                <input
                  id="editEndDate"
                  name="endDate"
                  type="date"
                  className="input"
                  value={editForm.endDate}
                  onChange={(e) =>
                    setEditForm({
                      ...editForm,
                      [e.target.name]: e.target.value,
                    })
                  }
                />
              </div>
              <div className="field">
                <label
                  htmlFor="editDiscountType"
                  className="field-label"
                >
                  Discount Type
                </label>
                <select
                  id="editDiscountType"
                  name="discountType"
                  className="select"
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
              <div className="field">
                <label
                  htmlFor="editDiscountValue"
                  className="field-label"
                >
                  Discount Value
                </label>
                <input
                  id="editDiscountValue"
                  name="discountValue"
                  type="number"
                  min="0"
                  step="0.01"
                  className="input"
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
                  className="field-label"
                >
                  Applicable Plans
                </label>
                <select
                  id="editApplicablePlans"
                  name="applicablePlans"
                  className="select"
                  value={editForm.applicablePlans}
                  onChange={(e) =>
                    setEditForm({
                      ...editForm,
                      [e.target.name]: e.target.value,
                    })
                  }
                >
                  <option value="all">All</option>
                  <option value="monthly">Monthly</option>
                  <option value="annual">Annual</option>
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
                  className="btn btn-primary"
                >
                  {editLoading ? (
                    <>
                      <div className="spinner"></div>
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
        <div className="modal-overlay">
          <div className="modal is-padded">
            <h3 className="card-title">
              Confirm Deletion
            </h3>
            <p className="card-description mb-6">
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
            <div className="modal-footer">
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
                className="btn btn-danger"
              >
                {deleteLoading ? (
                  <>
                    <div className="spinner"></div>
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
      {showRemoveFromPrice && discountToRemove && (
        <div className="modal-overlay">
          <div className="modal is-padded">
            <h3 className="card-title">
              Remove Discount from Price
            </h3>
            <p className="card-description mb-6">
              Are you sure you want to remove discount{" "}
              <span className="font-semibold font-mono text-blue-600">
                {discountToRemove.couponCode}
              </span>{" "}
              from price plan{" "}
              <span className="font-semibold capitalize">
                {assignDiscount.find(
                  (assignment) =>
                    assignment?.discountId?._id === discountToRemove?._id
                )?.priceId?.planType || "Unknown"}
              </span>
              ?
            </p>
            <div className="modal-footer">
              <button
                onClick={() => {
                  setShowRemoveFromPrice(false);
                  setDiscountToRemove(null);
                }}
                className="px-4 py-2 text-gray-600 border border-gray-300 rounded hover:bg-gray-50 transition-colors"
              >
                Cancel
              </button>
              <button
                disabled={priceOperationLoading}
                className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700 transition-colors flex items-center gap-2 disabled:opacity-50"
                onClick={() => {
                  const assignment = prices.find(
                    (assignment) =>
                      assignment?.discountId === discountToRemove?._id
                  );
                  // console.log("assignment", assignment);
                  // console.log("discountToRemove", discountToRemove);
                  // console.log("prices", prices);
                  if (assignment?._id) {
                    handleRemoveFromPriceSubmit(assignment._id);
                  } else {
                    toast.error("Price assignment not found");
                  }
                }}
              >
                {priceOperationLoading ? (
                  <>
                    <div className="spinner"></div>
                    Removing...
                  </>
                ) : (
                  "Remove Discount"
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {showAddToPrice && discountToAdd && (
        <div className="modal-overlay">
          <div className="modal is-padded">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-800">
                Add Discount to Price
              </h3>
              <button
                onClick={() => {
                  setShowAddToPrice(false);
                  setDiscountToAdd(null);
                  setSelectedPrice("");
                }}
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

            <div className="mb-4">
              <p className="text-gray-600 mb-4">
                Adding discount{" "}
                <span className="font-semibold font-mono text-blue-600">
                  {discountToAdd.couponCode}
                </span>{" "}
                to a price plan
              </p>
            </div>

            <div className="flex flex-col gap-4">
              <div className="flex flex-col gap-2">
                <label
                  htmlFor="addToPrice"
                  className="field-label"
                >
                  Select Price Plan <span className="text-red-500">*</span>
                </label>
                <select
                  id="addToPrice"
                  className="select"
                  value={selectedPrice}
                  onChange={(e) => setSelectedPrice(e.target.value)}
                >
                  <option value="">Select a price plan</option>
                  {prices.map((price) => (
                    <option key={price._id} value={price._id}>
                      {price.planType.charAt(0).toUpperCase() +
                        price.planType.slice(1)}{" "}
                      Plan
                    </option>
                  ))}
                </select>
                {prices.filter(
                  (price) =>
                    !assignDiscount.some(
                      (assignment) => assignment.planType === price.planType
                    )
                ).length === 0 && <p></p>}
              </div>

              <div className="flex gap-3 justify-end pt-4 border-t border-gray-200">
                <button
                  type="button"
                  onClick={() => {
                    setShowAddToPrice(false);
                    setDiscountToAdd(null);
                    setSelectedPrice("");
                  }}
                  className="px-4 py-2 text-gray-600 border border-gray-300 rounded hover:bg-gray-50 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  disabled={!selectedPrice || priceOperationLoading}
                  className="btn btn-primary"
                  
                  onClick={() => handleAddToPriceSubmit(selectedPrice)}
                >
                  {priceOperationLoading ? (
                    <>
                      <div className="spinner"></div>
                      Adding...
                    </>
                  ) : (
                    "Add to Price"
                  )}
                </button>
              </div>
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
