"use client";

import { useState, useRef, useEffect, useContext } from "react";
import {
  Search,
  Plus,
  Edit,
  Trash2,
  CheckCircle,
  Clock,
  AlertCircle,
  Upload,
} from "lucide-react";
import AddOrUpdateSound from "./component/AddUpdateForm";
import {
  deleteSound,
  getCategories,
  getSounds,
} from "../../../utils/API_SERVICE";
import { AuthContext } from "../../../context/authContext";
import { toast, ToastContainer } from "react-toastify";

export default function SoundManagement() {
  const [currentView, setCurrentView] = useState("main");
  const { accessToken } = useContext(AuthContext);
  const [selectedSound, setSelectedSound] = useState(null);
  const [sounds, setSounds] = useState([]);
  const [categories, setCategories] = useState([]);
  const [searchFilters, setSearchFilters] = useState({
    serial: "",
    title: "",
    category: "",
    status: "",
  });
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [itemToDelete, setItemToDelete] = useState(null);
  const [isSelectOpen, setIsSelectOpen] = useState(false);
  const [selectedCategoryFilter, setSelectedCategoryFilter] = useState("All");
  const [filteredSounds, setFilteredSounds] = useState([]);
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 5;
  const selectRef = useRef(null);

  useEffect(() => {
    async function fetchSounds() {
      try {
        const soundsData = await getSounds(accessToken);
        // const reversedSounds = soundsDat;
        setSounds(soundsData);
        setFilteredSounds(soundsData);
        // console.log(reversedSounds);
      } catch (error) {
        toast.error("Error fetching sounds");
      }
    }

    async function fetchCategories() {
      try {
        const categoriesData = await getCategories(accessToken);
        setCategories(categoriesData);
      } catch (error) {
        toast.error("Error fetching categories");
      }
    }

    fetchSounds();
    fetchCategories();
  }, [accessToken, currentView]);
  // console.log(categories, "categories");

  useEffect(() => {
    function handleClickOutside(event) {
      if (selectRef.current && !selectRef.current.contains(event.target)) {
        setIsSelectOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  // Filter sounds based on search term
  useEffect(() => {
    const filtered =
      Array.isArray(sounds) &&
      sounds.filter(
        (sound, index) =>
          (index + 1).toString().includes(searchFilters.serial) &&
          sound.title
            .toLowerCase()
            .includes(searchFilters.title.toLowerCase()) &&
          (selectedCategoryFilter === "All" ||
            getCategoryNames(sound.categories)
              .toLowerCase()
              .includes(selectedCategoryFilter.toLowerCase())) &&
          getCategoryNames(sound.categories)
            .toLowerCase()
            .includes(searchFilters.category.toLowerCase()) &&
          sound.status
            .toLowerCase()
            .includes(searchFilters.status.toLowerCase())
      );
    setFilteredSounds(filtered);
    setCurrentPage(1); // Reset to first page on filter change
  }, [searchFilters, selectedCategoryFilter, sounds]);

  const handleDeleteConfirm = async () => {
    if (itemToDelete) {
      // console.log(itemToDelete);
      try {
        await deleteSound(itemToDelete._id, accessToken);
        toast.success("Sound deleted successfully");
        const updatedSounds = sounds.filter(
          (sound) => sound._id !== itemToDelete._id
        );
        setSounds(updatedSounds);
        setFilteredSounds(updatedSounds);
      } catch (error) {
        toast.error("Error deleting sound");
      }
    }
    setShowDeleteConfirm(false);
    setItemToDelete(null);
  };

  const handleSoundSave = async (newSound) => {
    // console.log("handleSoundSave called with:", newSound);
    try {
      // If no sound data is passed, refetch the sounds list
      if (!newSound) {
        // console.log("No sound data provided, refetching sounds list...");
        const soundsData = await getSounds(accessToken);
        // const reversedSounds = soundsData.reverse();
        setSounds(soundsData);
        setFilteredSounds(soundsData);
      } else {
        // Handle the case where sound data is passed (legacy behavior)
        if (selectedSound) {
          // console.log("Updating existing sound...");
          const updatedSounds = sounds.map((sound) =>
            sound.id === newSound.id || sound._id === newSound._id
              ? newSound
              : sound
          );
          setSounds(updatedSounds);
          setFilteredSounds(updatedSounds);
        } else {
          // console.log("Adding new sound...");
          // For new sounds, add to the list
          const updatedSounds = [...sounds, newSound];
          setSounds(updatedSounds);
          setFilteredSounds(updatedSounds);
        }
      }
    } catch (error) {
      console.error("Error in handleSoundSave:", error);
      toast.error("Error updating sounds list");
    }
    setCurrentView("main");
  };

  const getCategoryNames = (categoryIds) => {
    if (!Array.isArray(categoryIds)) {
      return "Unknown";
    }
    const names = categoryIds.map((categoryId) => {
      const category = categories.find((cat) => cat._id === categoryId);
      return category ? category.name : "Unknown";
    });
    return names.join(", ");
  };

  const getUploadStatusBadge = (uploadStatus) => {
    if (!uploadStatus) {
      return {
        icon: AlertCircle,
        text: "Unknown",
        className: "bg-gray-100 text-gray-800",
      };
    }

    const status = uploadStatus.toLowerCase();

    if (
      status.includes("completed") ||
      status.includes("success") ||
      status.includes("uploaded")
    ) {
      return {
        icon: CheckCircle,
        text: "Completed",
        className: "bg-green-100 text-green-800",
      };
    } else if (
      status.includes("pending") ||
      status.includes("processing") ||
      status.includes("uploading")
    ) {
      return {
        icon: Clock,
        text: "Processing",
        className: "bg-yellow-100 text-yellow-800",
      };
    } else if (status.includes("failed") || status.includes("error")) {
      return {
        icon: AlertCircle,
        text: "Failed",
        className: "bg-red-100 text-red-800",
      };
    } else if (status.includes("upload")) {
      return {
        icon: Upload,
        text: "Uploading",
        className: "bg-blue-100 text-blue-800",
      };
    } else {
      return {
        icon: Clock,
        text: uploadStatus,
        className: "bg-gray-100 text-gray-800",
      };
    }
  };

  const renderMainView = () => {
    const startIndex = (currentPage - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;
    const paginatedSounds = filteredSounds.slice(startIndex, endIndex);
    const totalPages = Math.ceil(filteredSounds.length / itemsPerPage);

    return (
      <div className="grid grid-cols-1 gap-6">
        <div className="flex justify-end">
          <button
            className="btn btn-primary"
            onClick={() => setCurrentView("addSound")}
          >
            <Plus className="h-5 w-5" />
            Add New Sound
          </button>
        </div>

        <div className="card">
          <div className="card-header">
            <div>
              <h3 className="card-title">Sounds</h3>
              <p className="card-description">List of sounds</p>
            </div>
          </div>
          <div className="card-body">
            <div className="relative mb-6 grid grid-cols-4 gap-4 min-w-full">
              <div className="relative">
                <Search className="input-icon" />
                <input
                  type="text"
                  placeholder="Search by serial no..."
                  className="input input-with-icon"
                  value={searchFilters.serial}
                  onChange={(e) =>
                    setSearchFilters({
                      ...searchFilters,
                      serial: e.target.value,
                    })
                  }
                />
              </div>
              <div className="relative">
                <Search className="input-icon" />
                <input
                  type="text"
                  placeholder="Search by title..."
                  className="input input-with-icon"
                  value={searchFilters.title}
                  onChange={(e) =>
                    setSearchFilters({
                      ...searchFilters,
                      title: e.target.value,
                    })
                  }
                />
              </div>
              <div className="relative">
                <Search className="input-icon" />
                <input
                  type="text"
                  placeholder="Search by category..."
                  className="input input-with-icon"
                  value={searchFilters.category}
                  onChange={(e) =>
                    setSearchFilters({
                      ...searchFilters,
                      category: e.target.value,
                    })
                  }
                />
              </div>
              <div className="relative">
                <Search className="input-icon" />
                <input
                  type="text"
                  placeholder="Search by status..."
                  className="input input-with-icon"
                  value={searchFilters.status}
                  onChange={(e) =>
                    setSearchFilters({
                      ...searchFilters,
                      status: e.target.value,
                    })
                  }
                />
              </div>
            </div>

            <div className="table-wrap">
              <table className="data-table">
                <thead>
                  <tr>
                    <th
                      scope="col"
                    >
                      Sr No.
                    </th>
                    <th
                      scope="col"
                    >
                      Title
                    </th>
                    <th
                      scope="col"
                    >
                      Category
                    </th>
                    <th
                      scope="col"
                    >
                      Status
                    </th>
                    <th
                      scope="col"
                    >
                      Upload Status
                    </th>
                    <th
                      scope="col"
                      className="cell-actions"
                    >
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {paginatedSounds.length === 0 ? (
                    <tr>
                      <td
                        colSpan={5}
                        className="empty-state"
                      >
                        No sounds found matching your search
                      </td>
                    </tr>
                  ) : (
                    paginatedSounds.map((sound, index) => (
                      <tr key={sound._id}>
                        <td className="px-6 py-4 whitespace-nowrap">
                          {index + 1 + (currentPage - 1) * itemsPerPage}
                        </td>
                        <td className="cell-strong">
                          {sound.title}
                        </td>
                        <td>
                          {getCategoryNames(sound.categories)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span
                            className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${
                              sound.status === "Premium"
                                ? "bg-yellow-100 text-yellow-800"
                                : "bg-green-100 text-green-800"
                            }`}
                          >
                            {sound.status}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          {(() => {
                            const statusBadge = getUploadStatusBadge(
                              sound.uploadStatus
                            );
                            const IconComponent = statusBadge.icon;
                            return (
                              <span
                                className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${statusBadge.className}`}
                              >
                                <IconComponent className="h-3 w-3 mr-1" />
                                {statusBadge.text}
                              </span>
                            );
                          })()}
                        </td>
                        <td className="cell-actions">
                          <div className="flex justify-end gap-2">
                            <button
                              className="btn btn-icon btn-secondary"
                              onClick={() => {
                                setSelectedSound(sound);
                                setCurrentView("updateSound");
                              }}
                            >
                              <Edit className="h-4 w-4" />
                            </button>
                            <button
                              className="btn btn-icon btn-danger-soft"
                              onClick={() => {
                                setItemToDelete(sound);
                                setShowDeleteConfirm(true);
                              }}
                            >
                              <Trash2 className="h-4 w-4" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
              <div className="flex justify-end mt-4">
                <nav
                  className="relative z-0 inline-flex rounded-md shadow-sm -space-x-px"
                  aria-label="Pagination"
                >
                  <button
                    disabled={currentPage === 1}
                    onClick={() => setCurrentPage(currentPage - 1)}
                    className={`relative inline-flex items-center px-2 py-2 rounded-l-md border border-gray-300 bg-white text-sm font-medium ${
                      currentPage === 1
                        ? "text-gray-300"
                        : "text-gray-500 hover:bg-gray-50"
                    }`}
                  >
                    Previous
                  </button>
                  {[...Array(totalPages).keys()].map((page) => (
                    <button
                      key={page + 1}
                      onClick={() => setCurrentPage(page + 1)}
                      className={`relative inline-flex items-center px-4 py-2 border border-gray-300 bg-white text-sm font-medium ${
                        currentPage === page + 1
                          ? "bg-gray-100 text-gray-700"
                          : "text-gray-700 hover:bg-gray-50"
                      }`}
                    >
                      {page + 1}
                    </button>
                  ))}
                  <button
                    disabled={currentPage === totalPages}
                    onClick={() => setCurrentPage(currentPage + 1)}
                    className={`relative inline-flex items-center px-2 py-2 rounded-r-md border border-gray-300 bg-white text-sm font-medium ${
                      currentPage === totalPages
                        ? "text-gray-300"
                        : "text-gray-500 hover:bg-gray-50"
                    }`}
                  >
                    Next
                  </button>
                </nav>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  };

  const DeleteConfirmModal = () => {
    if (!showDeleteConfirm) return null;

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
                    Confirm Deletion
                  </h3>
                  <div className="mt-2">
                    <p className="text-sm text-gray-500">
                      Are you sure you want to delete &quot;
                      {itemToDelete?.title}"? This action cannot be undone.
                    </p>
                  </div>
                </div>
              </div>
            </div>
            <div className="bg-gray-50 px-4 py-3 sm:px-6 sm:flex sm:flex-row-reverse">
              <button
                type="button"
                className="btn btn-danger"
                onClick={handleDeleteConfirm}
              >
                Delete
              </button>
              <button
                type="button"
                className="btn btn-secondary"
                onClick={() => setShowDeleteConfirm(false)}
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
    <div className="page">
      <h1 className="page-title">Sounds Management</h1>

      {currentView === "main" && renderMainView()}
      {currentView === "addSound" && (
        <AddOrUpdateSound
          setCurrentView={setCurrentView}
          onSave={handleSoundSave}
          buttonText="Add Sound"
        />
      )}
      {currentView === "updateSound" && (
        <AddOrUpdateSound
          setCurrentView={setCurrentView}
          selectedSound={selectedSound}
          onSave={handleSoundSave}
          buttonText="Save Sound"
        />
      )}

      <DeleteConfirmModal />
      <ToastContainer />
    </div>
  );
}
