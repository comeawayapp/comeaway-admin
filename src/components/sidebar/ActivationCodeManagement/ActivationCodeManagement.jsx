import { useState, useEffect, useContext } from "react";
import ReactPaginate from "react-paginate";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import {
  FaEye,
  FaPlus,
  FaEdit,
  FaTrash,
  FaDownload,
  FaUpload,
} from "react-icons/fa";
import { AuthContext } from "../../../context/authContext";
import {
  createActivationCode,
  getActivationCodes,
  updateActivationCode,
  deleteActivationCode,
} from "../../../utils/API_SERVICE";

const initialState = {
  code: "",
  productName: "",
  orderNumber: "",
  customerName: "",
  customerEmail: "",
  phoneNumber: "",
  platform: "",
  expiresIn: "",
};

const ActivationCodeManagement = () => {
  const { accessToken } = useContext(AuthContext);
  const [currentPage, setCurrentPage] = useState(0);
  const [codeSearch, setCodeSearch] = useState("");
  const [productSearch, setProductSearch] = useState("");
  const [customerSearch, setCustomerSearch] = useState("");
  const [orderSearch, setOrderSearch] = useState("");
  const [form, setForm] = useState(initialState);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [loading, setLoading] = useState(false);
  const [codes, setCodes] = useState([]);
  const [fetchError, setFetchError] = useState("");
  const [fetching, setFetching] = useState(false);
  const [formOpen, setFormOpen] = useState(false);
  const [selectedCode, setSelectedCode] = useState(null);
  const [editingCode, setEditingCode] = useState(null);
  const [editForm, setEditForm] = useState(initialState);
  const [editLoading, setEditLoading] = useState(false);
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [importLoading, setImportLoading] = useState(false);
  const [exportLoading, setExportLoading] = useState(false);
  const itemsPerPage = 5;

  useEffect(() => {
    if (accessToken) fetchCodes();
  }, [accessToken]);

  const fetchCodes = async () => {
    setFetching(true);
    setFetchError("");
    try {
      const data = await getActivationCodes(accessToken);
      setCodes(data);
      toast.success("Activation codes fetched successfully");
    } catch (err) {
      setFetchError(err.message);
      toast.error("Error fetching activation codes");
    } finally {
      setFetching(false);
    }
  };

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
    setError("");
    setSuccess("");
  };

  const validate = () => {
    if (!/^\d{6}$/.test(form.code)) return "Code must be 6 digits.";
    if (!form.productName.trim()) return "Product name is required.";
    if (!form.orderNumber.trim()) return "Order number is required.";
    if (!form.customerName.trim()) return "Customer name is required.";
    if (!form.customerEmail.trim()) return "Customer email is required.";
    if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(form.customerEmail))
      return "Invalid email format.";
    if (!form.phoneNumber.trim()) return "Phone number is required.";
    if (!/^\+?\d{7,15}$/.test(form.phoneNumber)) return "Invalid phone number.";
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

  const handleCodeSearchChange = (e) => {
    setCodeSearch(e.target.value);
  };

  const handleProductSearchChange = (e) => {
    setProductSearch(e.target.value);
  };

  const handleCustomerSearchChange = (e) => {
    setCustomerSearch(e.target.value);
  };

  const handleOrderSearchChange = (e) => {
    setOrderSearch(e.target.value);
  };

  const handleCodePreview = (code) => {
    setSelectedCode(code);
  };

  const handleBackToTable = () => {
    setSelectedCode(null);
  };

  const handleEditCode = (code) => {
    setEditingCode(code);
    setEditForm({
      code: code.code,
      productName: code.productName,
      orderNumber: code.orderNumber,
      customerName: code.customerName,
      customerEmail: code.customerEmail,
      phoneNumber: code.phoneNumber,
      platform: code.platform,
      expiresIn: code.expiresIn
        ? new Date(code.expiresIn).toISOString().split("T")[0]
        : "",
    });
  };

  const handleEditChange = (e) => {
    setEditForm({ ...editForm, [e.target.name]: e.target.value });
  };

  const handleEditSubmit = async (e) => {
    e.preventDefault();
    setEditLoading(true);
    try {
      await updateActivationCode(editingCode._id, editForm, accessToken);
      toast.success("Activation code updated successfully");
      setEditingCode(null);
      setEditForm(initialState);
      fetchCodes();
    } catch (err) {
      toast.error(err.message || "Error updating activation code");
    } finally {
      setEditLoading(false);
    }
  };

  const handleDeleteCode = async (code) => {
    if (
      window.confirm("Are you sure you want to delete this activation code?")
    ) {
      setDeleteLoading(true);
      try {
        await deleteActivationCode(code._id, accessToken);
        toast.success("Activation code deleted successfully");
        fetchCodes();
      } catch (err) {
        toast.error(err.message || "Error deleting activation code");
      } finally {
        setDeleteLoading(false);
      }
    }
  };

  const handleExportData = async () => {
    setExportLoading(true);
    try {
      const csvContent = [
        "Code,Product Name,Order Number,Customer Name,Customer Email,Phone Number,Platform,Expiry Date,Redeemed",
        ...codes.map((code) =>
          [
            code.code,
            `"${code.productName}"`,
            code.orderNumber,
            `"${code.customerName}"`,
            code.customerEmail,
            code.phoneNumber,
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
    } catch (err) {
      toast.error("Error exporting data");
    } finally {
      setExportLoading(false);
    }
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
        const headers = lines[0].split(",");

        // Skip header row and process data
        const importData = lines
          .slice(1)
          .filter((line) => line.trim())
          .map((line) => {
            const values = line.split(",");
            return {
              code: values[0],
              productName: values[1].replace(/"/g, ""),
              orderNumber: values[2],
              customerName: values[3].replace(/"/g, ""),
              customerEmail: values[4],
              phoneNumber: values[5],
              platform: values[6].replace(/"/g, ""),
              expiresIn: values[7] !== "N/A" ? new Date(values[7]) : null,
            };
          });

        // Create activation codes in batches
        for (const data of importData) {
          try {
            await createActivationCode(data, accessToken);
          } catch (err) {
            console.error("Error importing code:", data.code, err);
          }
        }

        toast.success("Data imported successfully");
        fetchCodes();
      } catch (err) {
        toast.error("Error importing data");
      } finally {
        setImportLoading(false);
        event.target.value = null; // Reset file input
      }
    };
    reader.readAsText(file);
  };

  const filteredData = codes.filter(
    (code) =>
      code.code.toString().includes(codeSearch) &&
      code.productName.toLowerCase().includes(productSearch.toLowerCase()) &&
      code.customerName.toLowerCase().includes(customerSearch.toLowerCase()) &&
      code.orderNumber.toString().includes(orderSearch)
  );

  const offset = currentPage * itemsPerPage;
  const currentPageData = filteredData.slice(offset, offset + itemsPerPage);

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
                  <strong>Phone Number:</strong> {selectedCode.phoneNumber}
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
          </div>
        </div>
      ) : (
        <div className="container mx-auto p-4 bg-white rounded shadow-md">
          <div className="mb-4 flex justify-between items-center">
            <div className="flex space-x-4 flex-1">
              <input
                type="text"
                placeholder="Search by Code"
                value={codeSearch}
                onChange={handleCodeSearchChange}
                className="px-4 py-2 border rounded w-full"
              />
              <input
                type="text"
                placeholder="Search by Product"
                value={productSearch}
                onChange={handleProductSearchChange}
                className="px-4 py-2 border rounded w-full"
              />
              <input
                type="text"
                placeholder="Search by Customer"
                value={customerSearch}
                onChange={handleCustomerSearchChange}
                className="px-4 py-2 border rounded w-full"
              />
              <input
                type="text"
                placeholder="Search by Order"
                value={orderSearch}
                onChange={handleOrderSearchChange}
                className="px-4 py-2 border rounded w-full"
              />
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

          {formOpen && (
            <div className="mb-6 bg-gray-100 p-6 rounded shadow-md">
              <h2 className="text-2xl font-bold mb-6 text-center">
                Create Activation Code
              </h2>
              <form className="grid grid-cols-2 gap-4" onSubmit={handleSubmit}>
                <div className="flex flex-col gap-1">
                  <label htmlFor="code" className="font-medium text-gray-700">
                    6-digit Code
                  </label>
                  <input
                    id="code"
                    name="code"
                    className="border border-gray-300 rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-400"
                    placeholder="e.g. 123456"
                    value={form.code}
                    onChange={handleChange}
                    maxLength={6}
                    autoComplete="off"
                  />
                </div>
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
                    htmlFor="phoneNumber"
                    className="font-medium text-gray-700"
                  >
                    Phone Number
                  </label>
                  <input
                    id="phoneNumber"
                    name="phoneNumber"
                    className="border border-gray-300 rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-400"
                    placeholder="e.g. +1234567890"
                    value={form.phoneNumber}
                    onChange={handleChange}
                    autoComplete="off"
                  />
                </div>
                <div className="flex flex-col gap-1">
                  <label
                    htmlFor="platform"
                    className="font-medium text-gray-700"
                  >
                    Platform
                  </label>
                  <input
                    id="platform"
                    name="platform"
                    className="border border-gray-300 rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-400"
                    placeholder="Platform"
                    value={form.platform}
                    onChange={handleChange}
                    autoComplete="off"
                  />
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

          {editingCode && (
            <div className="mb-6 bg-gray-100 p-6 rounded shadow-md">
              <h2 className="text-2xl font-bold mb-6 text-center">
                Edit Activation Code
              </h2>
              <form
                className="grid grid-cols-2 gap-4"
                onSubmit={handleEditSubmit}
              >
                <div className="flex flex-col gap-1">
                  <label
                    htmlFor="edit-code"
                    className="font-medium text-gray-700"
                  >
                    6-digit Code
                  </label>
                  <input
                    id="edit-code"
                    name="code"
                    className="border border-gray-300 rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-400"
                    placeholder="e.g. 123456"
                    value={editForm.code}
                    onChange={handleEditChange}
                    maxLength={6}
                    autoComplete="off"
                  />
                </div>
                <div className="flex flex-col gap-1">
                  <label
                    htmlFor="edit-productName"
                    className="font-medium text-gray-700"
                  >
                    Product Name
                  </label>
                  <input
                    id="edit-productName"
                    name="productName"
                    className="border border-gray-300 rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-400"
                    placeholder="Product Name"
                    value={editForm.productName}
                    onChange={handleEditChange}
                    autoComplete="off"
                  />
                </div>
                <div className="flex flex-col gap-1">
                  <label
                    htmlFor="edit-orderNumber"
                    className="font-medium text-gray-700"
                  >
                    Order Number
                  </label>
                  <input
                    id="edit-orderNumber"
                    name="orderNumber"
                    className="border border-gray-300 rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-400"
                    placeholder="Order Number"
                    value={editForm.orderNumber}
                    onChange={handleEditChange}
                    autoComplete="off"
                  />
                </div>
                <div className="flex flex-col gap-1">
                  <label
                    htmlFor="edit-customerName"
                    className="font-medium text-gray-700"
                  >
                    Customer Name
                  </label>
                  <input
                    id="edit-customerName"
                    name="customerName"
                    className="border border-gray-300 rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-400"
                    placeholder="Customer Name"
                    value={editForm.customerName}
                    onChange={handleEditChange}
                    autoComplete="off"
                  />
                </div>
                <div className="flex flex-col gap-1">
                  <label
                    htmlFor="edit-customerEmail"
                    className="font-medium text-gray-700"
                  >
                    Customer Email
                  </label>
                  <input
                    id="edit-customerEmail"
                    name="customerEmail"
                    className="border border-gray-300 rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-400"
                    placeholder="Customer Email"
                    value={editForm.customerEmail}
                    onChange={handleEditChange}
                    autoComplete="off"
                    type="email"
                  />
                </div>
                <div className="flex flex-col gap-1">
                  <label
                    htmlFor="edit-phoneNumber"
                    className="font-medium text-gray-700"
                  >
                    Phone Number
                  </label>
                  <input
                    id="edit-phoneNumber"
                    name="phoneNumber"
                    className="border border-gray-300 rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-400"
                    placeholder="e.g. +1234567890"
                    value={editForm.phoneNumber}
                    onChange={handleEditChange}
                    autoComplete="off"
                  />
                </div>
                <div className="flex flex-col gap-1">
                  <label
                    htmlFor="edit-platform"
                    className="font-medium text-gray-700"
                  >
                    Platform
                  </label>
                  <input
                    id="edit-platform"
                    name="platform"
                    className="border border-gray-300 rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-400"
                    placeholder="Platform"
                    value={editForm.platform}
                    onChange={handleEditChange}
                    autoComplete="off"
                  />
                </div>
                <div className="flex flex-col gap-1">
                  <label
                    htmlFor="edit-expiresIn"
                    className="font-medium text-gray-700"
                  >
                    Expiry Date
                  </label>
                  <input
                    id="edit-expiresIn"
                    name="expiresIn"
                    type="date"
                    className="border border-gray-300 rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-400"
                    value={editForm.expiresIn}
                    onChange={handleEditChange}
                  />
                </div>
                <div className="col-span-2 flex gap-2">
                  <button
                    type="submit"
                    disabled={editLoading}
                    className="flex-1 px-4 py-2 text-white rounded font-semibold disabled:opacity-60 disabled:cursor-not-allowed"
                    style={{ backgroundColor: "#28a745" }}
                  >
                    {editLoading ? "Updating..." : "Update Code"}
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setEditingCode(null);
                      setEditForm(initialState);
                    }}
                    className="flex-1 px-4 py-2 bg-gray-500 text-white rounded font-semibold"
                  >
                    Cancel
                  </button>
                </div>
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
                    <tr key={code._id} className="hover:bg-gray-50">
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
                        <div className="flex gap-2">
                          <button
                            onClick={() => handleCodePreview(code)}
                            className="px-3 py-1 rounded text-white"
                            style={{ backgroundColor: "#439AB8" }}
                            title="View"
                          >
                            <FaEye />
                          </button>
                          <button
                            onClick={() => handleEditCode(code)}
                            className="px-3 py-1 rounded text-white"
                            style={{ backgroundColor: "#28a745" }}
                            title="Edit"
                          >
                            <FaEdit />
                          </button>
                          <button
                            onClick={() => handleDeleteCode(code)}
                            disabled={deleteLoading}
                            className="px-3 py-1 rounded text-white disabled:opacity-60"
                            style={{ backgroundColor: "#dc3545" }}
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
export default ActivationCodeManagement;
