import { useState, useEffect, useContext, useCallback, useMemo } from "react";
import ReactPaginate from "react-paginate";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import { createPortal } from "react-dom";
import PropTypes from "prop-types";
import {
  FaEye,
  FaPlus,
  FaTrash,
  FaDownload,
  FaUpload,
  FaCheck,
  FaEllipsisV,
  FaEdit,
  FaEnvelope,
} from "react-icons/fa";
import { AuthContext } from "../../../context/authContext";
import {
  createActivationCode,
  getActivationCodes,
  deleteActivationCode,
  importActivationCodes,
  redeemActivationCode,
  sendEMail,
  editActivationCode,
} from "../../../utils/API_SERVICE";

const initialState = {
  productName: "",
  orderNumber: "",
  customerName: "",
  customerEmail: "",
  platform: "",
  expiresIn: "",
};

const ActivationCodeManagement = () => {
  const { accessToken } = useContext(AuthContext);
  const [currentPage, setCurrentPage] = useState(0);
  const [searchField, setSearchField] = useState("code");
  const [searchValue, setSearchValue] = useState("");
  const [redeemStatusFilter, setRedeemStatusFilter] = useState("");
  const [platformFilter, setPlatformFilter] = useState("");
  const [form, setForm] = useState(initialState);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [loading, setLoading] = useState(false);
  const [codes, setCodes] = useState([]);
  const [fetchError, setFetchError] = useState("");
  const [fetching, setFetching] = useState(false);
  const [formOpen, setFormOpen] = useState(false);
  const [selectedCode, setSelectedCode] = useState(null);
  const [redeemedCodes, setRedeemedCodes] = useState(new Set());
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [importLoading, setImportLoading] = useState(false);
  const [exportLoading, setExportLoading] = useState(false);
  const [openDropdown, setOpenDropdown] = useState(null);
  const [dropdownPosition, setDropdownPosition] = useState({ x: 0, y: 0 });
  const [showEmailConfirmation, setShowEmailConfirmation] = useState(false);
  const [emailToSend, setEmailToSend] = useState(null);
  const [emailLoading, setEmailLoading] = useState(false);
  const [showEditForm, setShowEditForm] = useState(false);
  const [editingCode, setEditingCode] = useState(null);
  const [editForm, setEditForm] = useState(initialState);
  const [editLoading, setEditLoading] = useState(false);
  const [showDeleteConfirmation, setShowDeleteConfirmation] = useState(false);
  const [codeToDelete, setCodeToDelete] = useState(null);
  const itemsPerPage = 20;

  // Portal-based dropdown component
  const DropdownPortal = ({ code, isOpen, onClose, position }) => {
    if (!isOpen) return null;

    return createPortal(
      <div
        className="fixed w-48 bg-white rounded-lg shadow-xl z-[9999] border border-gray-200 overflow-hidden portal-dropdown"
        style={{
          left: position.x,
          top: position.y,
        }}
        onClick={handleDropdownClick}
      >
        {/* Dropdown header */}
        <div className="px-3 py-2 bg-gray-50 border-b border-gray-200">
          <p className="text-xs font-medium text-gray-600">
            Actions for {code.code}
          </p>
        </div>

        <div className="py-1">
          <button
            onClick={(e) => {
              e.stopPropagation();
              handleViewCode(code);
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
              handleEditCode(code);
              onClose();
            }}
            className="flex items-center w-full px-4 py-2 text-sm text-gray-700 hover:bg-green-50 hover:text-green-700 transition-colors duration-150"
          >
            <FaEdit className="mr-3 h-4 w-4 text-gray-500" />
            Edit Code
          </button>
          <button
            onClick={(e) => {
              e.stopPropagation();
              handleSendMail(code);
              onClose();
            }}
            className="flex items-center w-full px-4 py-2 text-sm text-gray-700 hover:bg-purple-50 hover:text-purple-700 transition-colors duration-150"
          >
            <FaEnvelope className="mr-3 h-4 w-4 text-gray-500" />
            Send Email
          </button>
          {!code.redeemed && !redeemedCodes.has(code.code) && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                handleRedeemCode(code);
                onClose();
              }}
              className="flex items-center w-full px-4 py-2 text-sm text-green-600 hover:bg-green-50 hover:text-green-700 transition-colors duration-150 border-t border-gray-100"
            >
              <FaCheck className="mr-3 h-4 w-4 text-green-500" />
              Redeem Code
            </button>
          )}
          {!code.redeemed && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                handleDeleteCode(code);
                onClose();
              }}
              disabled={deleteLoading}
              className="flex items-center w-full px-4 py-2 text-sm text-red-600 hover:bg-red-50 hover:text-red-700 transition-colors duration-150 border-t border-gray-100 disabled:opacity-50"
            >
              <FaTrash className="mr-3 h-4 w-4 text-red-500" />
              Delete Code
            </button>
          )}
        </div>
      </div>,
      document.body
    );
  };

  // Add PropTypes validation
  DropdownPortal.propTypes = {
    code: PropTypes.shape({
      code: PropTypes.string.isRequired,
      redeemed: PropTypes.bool.isRequired,
    }).isRequired,
    isOpen: PropTypes.bool.isRequired,
    onClose: PropTypes.func.isRequired,
    position: PropTypes.shape({
      x: PropTypes.number.isRequired,
      y: PropTypes.number.isRequired,
    }).isRequired,
  };

  useEffect(() => {
    if (accessToken) fetchCodes();
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
        fetchCodes();
      }, 300); // Reduced to 300ms for faster response

      return () => clearTimeout(timeoutId);
    }
  }, [accessToken, searchValue, redeemStatusFilter, platformFilter]);

  const fetchCodes = useCallback(async () => {
    setFetching(true);
    setFetchError("");

    try {
      const queryParams = {};

      if (searchValue.trim()) {
        queryParams[searchField] = searchValue.trim();
      }

      if (redeemStatusFilter) {
        queryParams.redeemed = redeemStatusFilter;
      }

      if (platformFilter) {
        queryParams.platform = platformFilter;
      }

      const data = await getActivationCodes(accessToken, queryParams);
      setCodes(data);
    } catch (err) {
      setFetchError(err.message);
      toast.error("Error fetching activation codes");
    } finally {
      setFetching(false);
    }
  }, [
    accessToken,
    searchValue,
    searchField,
    redeemStatusFilter,
    platformFilter,
  ]);

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
    setError("");
    setSuccess("");
  };

  const validate = () => {
    if (!form.productName.trim()) return "Product name is required.";
    if (!form.orderNumber.trim()) return "Order number is required.";
    if (!form.customerName.trim()) return "Customer name is required.";
    if (!form.customerEmail.trim()) return "Customer email is required.";
    if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(form.customerEmail))
      return "Invalid email format.";
    if (!form.platform.trim()) return "Platform is required.";
    if (!form.expiresIn) return "Expiry date is required.";
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
      await createActivationCode(
        { ...form, expiresIn: new Date(form.expiresIn) },
        accessToken
      );
      setSuccess("Activation code created successfully.");
      setForm(initialState);
      setFormOpen(false);
      fetchCodes();
      toast.success("Activation code created successfully");
    } catch (err) {
      setError(err.message);
      toast.error(err.message || "Error creating activation code");
    } finally {
      setLoading(false);
    }
  };

  const handlePageClick = (data) => {
    setCurrentPage(data.selected);
  };

  const handleSearchFieldChange = useCallback((e) => {
    setSearchField(e.target.value);
  }, []);

  const handleSearchValueChange = useCallback((e) => {
    setSearchValue(e.target.value);
  }, []);

  const handleCodePreview = useCallback((code) => {
    setSelectedCode(code);
  }, []);

  const handleBackToTable = useCallback(() => {
    setSelectedCode(null);
  }, []);

  const handleDeleteCode = useCallback((code) => {
    setCodeToDelete(code);
    setShowDeleteConfirmation(true);
    setOpenDropdown(null);
  }, []);

  const handleConfirmDelete = async () => {
    if (!codeToDelete) return;

    setDeleteLoading(true);
    try {
      await deleteActivationCode(codeToDelete._id, accessToken);
      toast.success("Activation code deleted successfully");
      setShowDeleteConfirmation(false);
      setCodeToDelete(null);
      fetchCodes();
    } catch (err) {
      toast.error(err.message || "Error deleting activation code");
      setShowDeleteConfirmation(false);
      setCodeToDelete(null);
    } finally {
      setDeleteLoading(false);
    }
  };

  const handleCancelDelete = () => {
    setShowDeleteConfirmation(false);
    setCodeToDelete(null);
  };

  const handleRedeemCode = useCallback(
    async (code) => {
      if (code.redeemed || redeemedCodes.has(code.code)) {
        toast.info("This code has already been redeemed");
        return;
      }

      if (
        window.confirm("Are you sure you want to redeem this activation code?")
      ) {
        try {
          await redeemActivationCode(code.code, accessToken);
          setRedeemedCodes((prev) => new Set([...prev, code.code]));
          toast.success("Activation code redeemed successfully");
          setSelectedCode(null); // Go back to table view
          fetchCodes(); // Refresh data to show updated status
        } catch (err) {
          toast.error(err.message || "Error redeeming activation code");
        }
      }
    },
    [accessToken, redeemedCodes, fetchCodes]
  );

  const handleDropdownToggle = (codeId, event) => {
    if (openDropdown === codeId) {
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

    setOpenDropdown(codeId);
  };

  // Prevent dropdown from closing when clicking inside it
  const handleDropdownClick = (e) => {
    e.stopPropagation();
    e.preventDefault();
  };

  const handleEditCode = (code) => {
    setEditingCode(code);
    setEditForm({
      productName: code.productName || "",
      orderNumber: code.orderNumber || "",
      customerName: code.customerName || "",
      customerEmail: code.customerEmail || "",
      platform: code.platform || "",
      expiresIn: code.expiresIn
        ? new Date(code.expiresIn).toISOString().split("T")[0]
        : "",
    });
    setShowEditForm(true);
    setOpenDropdown(null);
  };

  const handleEditSubmit = async (e) => {
    e.preventDefault();
    if (!editingCode) return;

    setEditLoading(true);
    try {
      const editData = {
        productName: editForm.productName,
        customerName: editForm.customerName,
        customerEmail: editForm.customerEmail,
        platform: editForm.platform,
        expiresIn: new Date(editForm.expiresIn),
      };

      await editActivationCode(editingCode._id, editData, accessToken);
      toast.success("Activation code updated successfully!");
      setShowEditForm(false);
      setEditingCode(null);
      setEditForm(initialState);
      fetchCodes(); // Refresh the data
    } catch (error) {
      toast.error(error.message || "Error updating activation code");
    } finally {
      setEditLoading(false);
    }
  };

  const handleEditCancel = () => {
    setShowEditForm(false);
    setEditingCode(null);
    setEditForm(initialState);
  };

  const handleSendMail = (code) => {
    setEmailToSend(code);
    setShowEmailConfirmation(true);
    setOpenDropdown(null);
  };

  const handleConfirmSendEmail = async () => {
    if (!emailToSend) return;

    setEmailLoading(true);
    try {
      const emailData = {
        customerEmail: emailToSend.customerEmail,
        productName: emailToSend.productName,
        platform: emailToSend.platform,
        expiresIn: emailToSend.expiresIn,
      };

      await sendEMail(emailData, accessToken);
      toast.success("Email sent successfully!");
      setShowEmailConfirmation(false);
      setEmailToSend(null);
    } catch (error) {
      toast.error(error.message || "Error sending email");
      setShowEmailConfirmation(false);
      setEmailToSend(null);
    } finally {
      setEmailLoading(false);
    }
  };

  const handleCancelSendEmail = () => {
    setShowEmailConfirmation(false);
    setEmailToSend(null);
  };

  const handleViewCode = (code) => {
    handleCodePreview(code);
    setOpenDropdown(null);
  };

  const handleExportData = async () => {
    setExportLoading(true);
    try {
      const csvContent = [
        "Code,Product Name,Order Number,Customer Name,Customer Email,Platform,Expiry Date,Redeemed",
        ...codes.map((code) =>
          [
            code.code,
            `"${code.productName}"`,
            code.orderNumber,
            `"${code.customerName}"`,
            code.customerEmail,
            `"${code.platform}"`,
            code.expiresIn
              ? new Date(code.expiresIn).toLocaleDateString()
              : "N/A",
            code.redeemed ? "Yes" : "No",
          ].join(",")
        ),
      ].join("\n");

      const blob = new Blob([csvContent], { type: "text/csv" });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `activation-codes-${
        new Date().toISOString().split("T")[0]
      }.csv`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(url);
      toast.success("Data exported successfully");
    } catch {
      toast.error("Error exporting data");
    } finally {
      setExportLoading(false);
    }
  };

  const parseCSVLine = (line, headers) => {
    const values = line.split(",");

    const rowData = {};
    headers.forEach((header, index) => {
      rowData[header] = values[index]?.replace(/"/g, "").trim() || "";
    });

    const expiryDateValue = (date) => {
      const [day, month, year] = date.split("/");
      return new Date(year, month - 1, day);
    };

    const expiresInValue =
      rowData["expiry date"] ||
      rowData["expiry_date"] ||
      rowData.expirydate ||
      rowData["expires in"] ||
      rowData["expires_in"] ||
      rowData.expiresin;
    const redeemedValue = rowData.redeemed || rowData.status;

    return {
      code:
        rowData.code ||
        rowData["activation code"] ||
        rowData["activation_code"],
      productName:
        rowData["product name"] ||
        rowData["product_name"] ||
        rowData.productname,
      orderNumber:
        rowData["order number"] ||
        rowData["order_number"] ||
        rowData.ordernumber,
      customerName:
        rowData["customer name"] ||
        rowData["customer_name"] ||
        rowData.customername,
      customerEmail:
        rowData["customer email"] ||
        rowData["customer_email"] ||
        rowData.customeremail,
      platform: rowData.platform,
      expiresIn:
        expiresInValue !== "N/A" && expiresInValue
          ? expiryDateValue(expiresInValue)
          : null,
      redeemed:
        redeemedValue === "Yes" ||
        redeemedValue === "yes" ||
        redeemedValue === true,
    };
  };

  const handleImportData = (event) => {
    const file = event.target.files[0];
    if (!file) return;

    setImportLoading(true);
    const reader = new FileReader();
    reader.onload = async (e) => {
      try {
        const csv = e.target.result;
        const lines = csv.split("\n");

        const headers = lines[0]
          .split(",")
          .map((header) => header.replace(/"/g, "").trim().toLowerCase());

        const importData = lines
          .slice(1)
          .filter((line) => line.trim())
          .map((line) => parseCSVLine(line, headers));

        const jsonData = JSON.stringify(importData, null, 2);
        console.log("CSV converted to JSON:", jsonData);
        console.log("CSV converted to JSON:", importData);

        const result = await importActivationCodes(importData, accessToken);
        console.log("Import API response:", result);

        toast.success(result.message);
        fetchCodes();
      } catch (error) {
        console.error("Error importing data:", error);
        toast.error("Error importing data");
      } finally {
        setImportLoading(false);
        event.target.value = null;
      }
    };
    reader.readAsText(file);
  };

  const filteredData = useMemo(() => codes, [codes]);

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
          Activation Code Management
        </h1>
      </div>

      {selectedCode ? (
        <div className="container mx-auto p-4 bg-white rounded shadow-md">
          <button
            onClick={handleBackToTable}
            className="mb-4 px-4 py-2 bg-gray-400 text-white rounded"
          >
            Back
          </button>
          <div className="bg-gray-100 p-6 rounded shadow-md">
            <h2 className="text-3xl font-bold mb-6 text-center">
              Activation Code Details
            </h2>
            <div className="grid grid-cols-2 gap-4">
              <div className="mb-4">
                <p className="text-lg">
                  <strong>Code:</strong> {selectedCode.code}
                </p>
              </div>
              <div className="mb-4">
                <p className="text-lg">
                  <strong>Product Name:</strong> {selectedCode.productName}
                </p>
              </div>
              <div className="mb-4">
                <p className="text-lg">
                  <strong>Order Number:</strong> {selectedCode.orderNumber}
                </p>
              </div>
              <div className="mb-4">
                <p className="text-lg">
                  <strong>Customer Name:</strong> {selectedCode.customerName}
                </p>
              </div>
              <div className="mb-4">
                <p className="text-lg">
                  <strong>Customer Email:</strong> {selectedCode.customerEmail}
                </p>
              </div>
              <div className="mb-4">
                <p className="text-lg">
                  <strong>Platform:</strong> {selectedCode.platform}
                </p>
              </div>
              <div className="mb-4">
                <p className="text-lg">
                  <strong>Expiry Date:</strong>{" "}
                  {selectedCode.expiresIn
                    ? new Date(selectedCode.expiresIn).toLocaleDateString()
                    : "N/A"}
                </p>
              </div>
              <div className="mb-4">
                <p className="text-lg">
                  <strong>Redeemed:</strong>{" "}
                  <span
                    className={`inline-block px-2 py-1 rounded text-sm font-bold ${
                      selectedCode.redeemed
                        ? "bg-green-100 text-green-700"
                        : "bg-yellow-100 text-yellow-700"
                    }`}
                  >
                    {selectedCode.redeemed ? "Yes" : "No"}
                  </span>
                </p>
              </div>
            </div>
            {!selectedCode.redeemed &&
              !redeemedCodes.has(selectedCode.code) && (
                <div className="mt-6 text-center">
                  <button
                    onClick={() => handleRedeemCode(selectedCode)}
                    className="px-6 py-3 rounded-lg font-semibold text-white flex items-center gap-2 mx-auto bg-green-600 hover:bg-green-700"
                  >
                    <FaCheck />
                    Redeem Code
                  </button>
                </div>
              )}
          </div>
        </div>
      ) : (
        <div className="container  mx-auto p-4 bg-white rounded shadow-md">
          <div className="mb-4">
            <div className="flex gap-4 items-center justify-between">
              <div className="flex gap-4 items-center flex-1">
                <select
                  value={searchField}
                  onChange={handleSearchFieldChange}
                  className="px-4 py-2 border rounded w-48"
                >
                  <option value="code">Code</option>
                  <option value="productName">Product Name</option>
                  <option value="orderNumber">Order Number</option>
                  <option value="customerName">Customer Name</option>
                  <option value="customerEmail">Customer Email</option>
                </select>
                <input
                  type="text"
                  placeholder="Search by..."
                  value={searchValue}
                  onChange={handleSearchValueChange}
                  className="px-4 py-2 border rounded w-64"
                />
                <select
                  value={redeemStatusFilter}
                  onChange={(e) => setRedeemStatusFilter(e.target.value)}
                  className="px-4 py-2 border rounded w-48"
                >
                  <option value="">All Status</option>
                  <option value="true">Redeemed</option>
                  <option value="false">Not Redeemed</option>
                </select>
                <select
                  value={platformFilter}
                  onChange={(e) => setPlatformFilter(e.target.value)}
                  className="px-4 py-2 border rounded w-48"
                >
                  <option value="">All Platforms</option>
                  <option value="Shopify">Shopify</option>
                  <option value="Amazon">Amazon</option>
                </select>
              </div>
              <div className="flex space-x-2">
                <label
                  className="px-4 py-2 text-white rounded flex items-center gap-2 cursor-pointer"
                  style={{ backgroundColor: "#439AB8" }}
                >
                  <FaUpload />
                  {importLoading ? "Importing..." : "Import CSV"}
                  <input
                    type="file"
                    accept=".csv"
                    onChange={handleImportData}
                    className="hidden"
                  />
                </label>
                <button
                  onClick={handleExportData}
                  disabled={exportLoading}
                  className="px-4 py-2 text-white rounded flex items-center gap-2 disabled:opacity-60"
                  style={{ backgroundColor: "#439AB8" }}
                >
                  <FaDownload />
                  {exportLoading ? "Exporting..." : "Export CSV"}
                </button>
                <button
                  onClick={() => setFormOpen(!formOpen)}
                  className="px-4 py-2 text-white rounded flex items-center gap-2"
                  style={{ backgroundColor: "#439AB8" }}
                >
                  <FaPlus />
                  {formOpen ? "Hide Form" : "Add Code"}
                </button>
              </div>
            </div>
          </div>

          {formOpen && (
            <div className="mb-6 bg-gray-100 p-6 rounded shadow-md">
              <h2 className="text-2xl font-bold mb-6 text-center">
                Create Activation Code
              </h2>
              <form className="grid grid-cols-2 gap-4" onSubmit={handleSubmit}>
                <div className="flex flex-col gap-1">
                  <label
                    htmlFor="productName"
                    className="font-medium text-gray-700"
                  >
                    Product Name
                  </label>
                  <input
                    id="productName"
                    name="productName"
                    className="border border-gray-300 rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-400"
                    placeholder="Product Name"
                    value={form.productName}
                    onChange={handleChange}
                    autoComplete="off"
                  />
                </div>
                <div className="flex flex-col gap-1">
                  <label
                    htmlFor="orderNumber"
                    className="font-medium text-gray-700"
                  >
                    Order Number
                  </label>
                  <input
                    id="orderNumber"
                    name="orderNumber"
                    className="border border-gray-300 rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-400"
                    placeholder="Order Number"
                    value={form.orderNumber}
                    onChange={handleChange}
                    autoComplete="off"
                  />
                </div>
                <div className="flex flex-col gap-1">
                  <label
                    htmlFor="customerName"
                    className="font-medium text-gray-700"
                  >
                    Customer Name
                  </label>
                  <input
                    id="customerName"
                    name="customerName"
                    className="border border-gray-300 rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-400"
                    placeholder="Customer Name"
                    value={form.customerName}
                    onChange={handleChange}
                    autoComplete="off"
                  />
                </div>
                <div className="flex flex-col gap-1">
                  <label
                    htmlFor="customerEmail"
                    className="font-medium text-gray-700"
                  >
                    Customer Email
                  </label>
                  <input
                    id="customerEmail"
                    name="customerEmail"
                    className="border border-gray-300 rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-400"
                    placeholder="Customer Email"
                    value={form.customerEmail}
                    onChange={handleChange}
                    autoComplete="off"
                    type="email"
                  />
                </div>
                <div className="flex flex-col gap-1">
                  <label
                    htmlFor="platform"
                    className="font-medium text-gray-700"
                  >
                    Platform
                  </label>
                  <select
                    id="platform"
                    name="platform"
                    className="border border-gray-300 rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-400"
                    value={form.platform}
                    onChange={handleChange}
                  >
                    <option value="">Select Platform</option>
                    <option value="Shopify">Shopify</option>
                    <option value="Amazon">Amazon</option>
                  </select>
                </div>
                <div className="flex flex-col gap-1">
                  <label
                    htmlFor="expiresIn"
                    className="font-medium text-gray-700"
                  >
                    Expiry Date
                  </label>
                  <input
                    id="expiresIn"
                    name="expiresIn"
                    type="date"
                    className="border border-gray-300 rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-400"
                    value={form.expiresIn}
                    onChange={handleChange}
                  />
                </div>
                <div className="col-span-2">
                  <button
                    type="submit"
                    disabled={loading}
                    className="w-full px-4 py-2 text-white rounded font-semibold disabled:opacity-60 disabled:cursor-not-allowed"
                    style={{ backgroundColor: "#439AB8" }}
                  >
                    {loading ? "Creating..." : "Create Code"}
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
                    Code
                  </th>
                  <th className="py-2 px-4 border-b border-gray-300 text-left bg-gray-100">
                    Product Name
                  </th>
                  <th className="py-2 px-4 border-b border-gray-300 text-left bg-gray-100">
                    Order Number
                  </th>
                  <th className="py-2 px-4 border-b border-gray-300 text-left bg-gray-100">
                    Customer Name
                  </th>
                  <th className="py-2 px-4 border-b border-gray-300 text-left bg-gray-100">
                    Customer Email
                  </th>
                  <th className="py-2 px-4 border-b border-gray-300 text-left bg-gray-100">
                    Platform
                  </th>
                  <th className="py-2 px-4 border-b border-gray-300 text-left bg-gray-100">
                    Expiry Date
                  </th>
                  <th className="py-2 px-4 border-b border-gray-300 text-left bg-gray-100">
                    Redeemed
                  </th>
                  <th className="py-2 px-4 border-b border-gray-300 text-left bg-gray-100">
                    Access Code Sent
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
                      Loading codes...
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
                      No activation codes found.
                    </td>
                  </tr>
                ) : (
                  currentPageData.map((code) => (
                    <tr key={code._id} className="relative hover:bg-gray-50">
                      <td className="py-2 px-4 border-b border-gray-300 font-mono font-semibold text-blue-700">
                        {code.code}
                      </td>
                      <td className="py-2 px-4 border-b border-gray-300">
                        {code.productName}
                      </td>
                      <td className="py-2 px-4 border-b border-gray-300">
                        {code.orderNumber}
                      </td>
                      <td className="py-2 px-4 border-b border-gray-300">
                        {code.customerName}
                      </td>
                      <td className="py-2 px-4 border-b border-gray-300">
                        {code.customerEmail}
                      </td>
                      <td className="py-2 px-4 border-b border-gray-300">
                        {code.platform}
                      </td>
                      <td className="py-2 px-4 border-b border-gray-300">
                        {code.expiresIn
                          ? new Date(code.expiresIn).toLocaleDateString()
                          : "N/A"}
                      </td>
                      <td className="py-2 px-4 border-b border-gray-300">
                        <span
                          className={`inline-block px-2 py-1 rounded text-xs font-bold ${
                            code.redeemed
                              ? "bg-green-100 text-green-700"
                              : "bg-yellow-100 text-yellow-700"
                          }`}
                        >
                          {code.redeemed ? "Yes" : "No"}
                        </span>
                      </td>
                      <td className="py-2 px-4 border-b border-gray-300">
                        <span
                          className={`inline-block px-2 py-1 rounded text-xs font-bold ${
                            code.accessCodeSentAt
                              ? "bg-blue-100 text-blue-700"
                              : "bg-gray-100 text-gray-700"
                          }`}
                        >
                          {code.accessCodeSentAt ? "Yes" : "No"}
                        </span>
                      </td>
                      <td className="py-2 px-4 border-b border-gray-300">
                        {/* relative dropdown-container */}
                        <div className="dropdown-container">
                          <button
                            onClick={(event) =>
                              handleDropdownToggle(code._id, event)
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
      {showEditForm && editingCode && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto">
            <h3 className="text-lg font-semibold mb-4">Edit Activation Code</h3>
            <form
              onSubmit={handleEditSubmit}
              className="grid grid-cols-2 gap-4"
            >
              <div className="flex flex-col gap-1">
                <label
                  htmlFor="editProductName"
                  className="font-medium text-gray-700"
                >
                  Product Name
                </label>
                <input
                  id="editProductName"
                  name="productName"
                  className="border border-gray-300 rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-400"
                  placeholder="Product Name"
                  value={editForm.productName}
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
                  htmlFor="editOrderNumber"
                  className="font-medium text-gray-700"
                >
                  Order Number
                </label>
                <input
                  id="editOrderNumber"
                  name="orderNumber"
                  className="border border-gray-300 rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-400"
                  placeholder="Order Number"
                  value={editForm.orderNumber}
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
                  htmlFor="editCustomerName"
                  className="font-medium text-gray-700"
                >
                  Customer Name
                </label>
                <input
                  id="editCustomerName"
                  name="customerName"
                  className="border border-gray-300 rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-400"
                  placeholder="Customer Name"
                  value={editForm.customerName}
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
                  htmlFor="editCustomerEmail"
                  className="font-medium text-gray-700"
                >
                  Customer Email
                </label>
                <input
                  id="editCustomerEmail"
                  name="customerEmail"
                  className="border border-gray-300 rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-400"
                  placeholder="Customer Email"
                  value={editForm.customerEmail}
                  onChange={(e) =>
                    setEditForm({
                      ...editForm,
                      [e.target.name]: e.target.value,
                    })
                  }
                  autoComplete="off"
                  type="email"
                />
              </div>
              <div className="flex flex-col gap-1">
                <label
                  htmlFor="editPlatform"
                  className="font-medium text-gray-700"
                >
                  Platform
                </label>
                <select
                  id="editPlatform"
                  name="platform"
                  className="border border-gray-300 rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-400"
                  value={editForm.platform}
                  onChange={(e) =>
                    setEditForm({
                      ...editForm,
                      [e.target.name]: e.target.value,
                    })
                  }
                >
                  <option value="">Select Platform</option>
                  <option value="Shopify">Shopify</option>
                  <option value="Amazon">Amazon</option>
                </select>
              </div>
              <div className="flex flex-col gap-1">
                <label
                  htmlFor="editExpiresIn"
                  className="font-medium text-gray-700"
                >
                  Expiry Date
                </label>
                <input
                  id="editExpiresIn"
                  name="expiresIn"
                  type="date"
                  className="border border-gray-300 rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-400"
                  value={editForm.expiresIn}
                  onChange={(e) =>
                    setEditForm({
                      ...editForm,
                      [e.target.name]: e.target.value,
                    })
                  }
                />
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
                    "Update Code"
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirmation Overlay */}
      {showDeleteConfirmation && codeToDelete && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
            <h3 className="text-lg font-semibold mb-4 text-red-600">
              Confirm Deletion
            </h3>
            <p className="text-gray-600 mb-6">
              Are you sure you want to delete the activation code{" "}
              <span className="font-semibold font-mono">
                {codeToDelete.code}
              </span>
              ?
            </p>
            <p className="text-sm text-gray-500 mb-6">
              This action cannot be undone and will permanently remove the
              activation code.
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
                  "Delete Code"
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Email Confirmation Overlay */}
      {showEmailConfirmation && emailToSend && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
            <h3 className="text-lg font-semibold mb-4">Confirm Email Send</h3>
            <p className="text-gray-600 mb-6">
              Are you sure you want to send an email to{" "}
              <span className="font-semibold">{emailToSend.customerEmail}</span>
              ?
            </p>
            <div className="flex gap-3 justify-end">
              <button
                onClick={handleCancelSendEmail}
                disabled={emailLoading}
                className="px-4 py-2 text-gray-600 border border-gray-300 rounded hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Cancel
              </button>
              <button
                onClick={handleConfirmSendEmail}
                disabled={emailLoading}
                className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                style={{ backgroundColor: "#439AB8" }}
              >
                {emailLoading ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                    Sending...
                  </>
                ) : (
                  "Send Email"
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Portal-based dropdown - renders outside table hierarchy */}
      {openDropdown && (
        <DropdownPortal
          code={codes.find((code) => code._id === openDropdown)}
          isOpen={true}
          onClose={() => setOpenDropdown(null)}
          position={dropdownPosition}
        />
      )}

      <ToastContainer />
    </div>
  );
};
export default ActivationCodeManagement;
