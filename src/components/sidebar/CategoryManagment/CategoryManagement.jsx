"use client"

import { useState, useRef, useEffect, useContext } from "react";
import { Search, Plus, Edit, Trash2, ArrowLeft } from "lucide-react";
import { createCategory, deleteCategory, getCategories, getSounds, updateCategory } from '../../../utils/API_SERVICE';
import { AuthContext } from '../../../context/authContext';
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

export default function CategoryManagement() {
  const { accessToken } = useContext(AuthContext);
  const [currentView, setCurrentView] = useState("main");
  const [selectedCategory, setSelectedCategory] = useState(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [itemToDelete, setItemToDelete] = useState(null);
  const [filteredCategories, setFilteredCategories] = useState([]);
  const [categories, setCategories] = useState([]);
  const [sounds, setSounds] = useState([]);
  const [searchFilters, setSearchFilters] = useState({ serial: "", name: "", slug: "", count: "" });
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 5;
  const selectRef = useRef(null);

  useEffect(() => {
    async function fetchCategoriesAndSounds() {
      try {
        const categoriesData = await getCategories(accessToken);
        const soundsData = await getSounds(accessToken);
        setCategories(categoriesData);
        setFilteredCategories(categoriesData);
        setSounds(soundsData);
      } catch (error) {
        toast.error('Error fetching categories or sounds');
      }
    }
    fetchCategoriesAndSounds();
  }, [accessToken]);

  useEffect(() => {
    const filtered = categories.filter((category, index) =>
      (index + 1).toString().includes(searchFilters.serial) &&
      category.name.toLowerCase().includes(searchFilters.name.toLowerCase()) &&
      category.slug.toLowerCase().includes(searchFilters.slug.toLowerCase())
    );
    setFilteredCategories(filtered);
    setCurrentPage(1); // Reset to first page on filter change
  }, [searchFilters, categories]);

  const handleDeleteConfirm = async () => {
    if (itemToDelete) {
      try {
        await deleteCategory(itemToDelete._id, accessToken);
        toast.success(`Deleted category with ID: ${itemToDelete.name}`);
        const updatedCategories = categories.filter((category) => category._id !== itemToDelete._id);
        setCategories(updatedCategories);
        setFilteredCategories(updatedCategories);
      } catch (error) {
        toast.error('Error deleting category');
      }
    }
    setShowDeleteConfirm(false);
    setItemToDelete(null);
  };

  const handleCategorySave = (category) => {
    const updatedCategories = selectedCategory
      ? categories.map(cat => cat._id === category._id ? category : cat)
      : [...categories, { ...category, id: categories.length + 1, count: 0 }];
    setCategories(updatedCategories);
    setFilteredCategories(updatedCategories);
  };

  const renderMainView = () => {
    const startIndex = (currentPage - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;
    const paginatedCategories = filteredCategories.slice(startIndex, endIndex);
    const totalPages = Math.ceil(filteredCategories.length / itemsPerPage);

    return (
      <div className="grid grid-cols-1 gap-6">
        <div className="flex justify-end">
          <button
            className="btn btn-primary"
            onClick={() => {
              setSelectedCategory(null);
              setCurrentView("updateCategory");
            }}
          >
            <Plus className="h-5 w-5" />
            Add New Category
          </button>
        </div>

        <div className="card">
          <div className="card-header">
            <div>
              <h3 className="card-title">Categories</h3>
              <p className="card-description">List of categories</p>
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
                  onChange={(e) => setSearchFilters({ ...searchFilters, serial: e.target.value })}
                />
              </div>
              <div className="relative">
                <Search className="input-icon" />
                <input
                  type="text"
                  placeholder="Search by category name..."
                  className="input input-with-icon"
                  value={searchFilters.name}
                  onChange={(e) => setSearchFilters({ ...searchFilters, name: e.target.value })}
                />
              </div>
              <div className="relative">
                <Search className="input-icon" />
                <input
                  type="text"
                  placeholder="Search by category slug..."
                  className="input input-with-icon"
                  value={searchFilters.slug}
                  onChange={(e) => setSearchFilters({ ...searchFilters, slug: e.target.value })}
                />
              </div>
              {/* <div className="relative">
                <Search className="input-icon" />
                <input
                  type="text"
                  placeholder="Search by assigned sound..."
                  className="input input-with-icon"
                  value={searchFilters.count}
                  onChange={(e) => setSearchFilters({ ...searchFilters, count: e.target.value })}
                />
              </div> */}
            </div>

            <div className="table-wrap">
              <table className="data-table">
                <thead>
                  <tr>
                    <th
                      scope="col"
                    >
                      Serial No.
                    </th>
                    <th
                      scope="col"
                    >
                      Category Name
                    </th>
                    <th
                      scope="col"
                    >
                      Category Slug
                    </th>
                    <th
                      scope="col"
                    >
                      Assigned Sound
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
                  {paginatedCategories.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="empty-state">
                        No categories found matching your search
                      </td>
                    </tr>
                  ) : ( 
                    paginatedCategories.map((category) => {
                      const assignedSounds = sounds.filter(sound => sound.categories.includes(category._id)).length;
                      return (
                        <tr key={category._id}>
                          <td className="cell-strong">{categories.findIndex(cat => cat._id === category._id) + 1}</td>
                          <td className="cell-strong">{category.name}</td>
                          <td>{category.slug}</td>
                          <td>{assignedSounds}</td>
                          <td className="cell-actions">
                            <div className="flex justify-end gap-2">
                              <button
                                className="btn btn-icon btn-secondary"
                                onClick={() => {
                                  setSelectedCategory(category);
                                  setCurrentView("updateCategory");
                                }}
                              >
                                <Edit className="h-4 w-4" />
                              </button>
                              <button
                                className="btn btn-icon btn-danger-soft"
                                onClick={() => {
                                  setItemToDelete(category);
                                  setShowDeleteConfirm(true);
                                }}
                              >
                                <Trash2 className="h-4 w-4" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
              <div className="flex justify-end mt-4">
                <nav className="relative z-0 inline-flex rounded-md shadow-sm -space-x-px" aria-label="Pagination">
                  <button
                    disabled={currentPage === 1}
                    onClick={() => setCurrentPage(currentPage - 1)}
                    className={`relative inline-flex items-center px-2 py-2 rounded-l-md border border-gray-300 bg-white text-sm font-medium ${currentPage === 1 ? 'text-gray-300' : 'text-gray-500 hover:bg-gray-50'}`}
                  >
                    Previous
                  </button>
                  {[...Array(totalPages).keys()].map(page => (
                    <button
                      key={page + 1}
                      onClick={() => setCurrentPage(page + 1)}
                      className={`relative inline-flex items-center px-4 py-2 border border-gray-300 bg-white text-sm font-medium ${currentPage === page + 1 ? 'bg-gray-100 text-gray-700' : 'text-gray-700 hover:bg-gray-50'}`}
                    >
                      {page + 1}
                    </button>
                  ))}
                  <button
                    disabled={currentPage === totalPages}
                    onClick={() => setCurrentPage(currentPage + 1)}
                    className={`relative inline-flex items-center px-2 py-2 rounded-r-md border border-gray-300 bg-white text-sm font-medium ${currentPage === totalPages ? 'text-gray-300' : 'text-gray-500 hover:bg-gray-50'}`}
                  >
                    Next
                  </button>
                </nav>
              </div>
            </div>
          </div>
        </div>
      </div>
    )
  }

  const renderUpdateCategory = () => {
    const handleSubmit = async (e) => {
      e.preventDefault();
      const form = e.target;
      const name = form.categoryName.value;
      const slug = form.categorySlug.value;

      try {
        if (selectedCategory) {
          await updateCategory(selectedCategory._id, name, slug, accessToken);
          toast.success('Category updated successfully');
          const updatedCategory = {
            ...selectedCategory,
            name,
            slug,
          };
          handleCategorySave(updatedCategory);
        } else {
          await createCategory(name, slug, accessToken);
          toast.success('Category created successfully');
          const newCategory = {
            id: categories.length + 1,
            name,
            slug,
            count: 0,
          };
          handleCategorySave(newCategory);
        }
        setCurrentView("main");
      } catch (error) {
        toast.error(`Error ${selectedCategory ? 'updating' : 'creating'} category`);
      }
    };

    return (
      <div className="card">
        <div className="card-header">
          <div className="flex items-center">
            <button
              className="mr-2 p-2 rounded-full hover:bg-gray-200 focus:outline-none focus:ring-2 focus:ring-gray-300"
              onClick={() => setCurrentView("main")}
            >
              <ArrowLeft className="h-5 w-5" />
            </button>
            <div>
              <h3 className="card-title">{selectedCategory ? "Update Category" : "Add New Category"}</h3>
              <p className="card-description">Fill in the details below</p>
            </div>
          </div>
        </div>
        <div className="card-body">
          <form className="space-y-6" onSubmit={handleSubmit}>
            <div className="space-y-2">
              <label htmlFor="category-name" className="field-label">
                Category Name
              </label>
              <input
                id="category-name"
                name="categoryName"
                type="text"
                className="input"
                placeholder="Enter category name"
                defaultValue={selectedCategory?.name || ""}
                required
              />
            </div>

            <div className="space-y-2">
              <label htmlFor="category-slug" className="field-label">
                Category Slug
              </label>
              <input
                id="category-slug"
                name="categorySlug"
                type="text"
                className="input"
                placeholder="Enter category slug"
                defaultValue={selectedCategory?.slug || ""}
                required
              />
            </div>

            <div className="flex justify-end gap-2">
              <button
                type="button"
                className="btn btn-secondary"
                onClick={() => setCurrentView("main")}
              >
                Cancel
              </button>
              <button
                type="submit"
                className="btn btn-primary"
              >
                {selectedCategory ? "Save Category" : "Add Category"}
              </button>
            </div>
          </form>
        </div>
      </div>
    )
  }

  const DeleteConfirmModal = () => {
    if (!showDeleteConfirm) return null

    return (
      <div className="fixed inset-0 z-50 overflow-y-auto">
        <div className="flex items-end justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
          <div className="fixed inset-0 transition-opacity" aria-hidden="true">
            <div className="absolute inset-0 bg-gray-500 opacity-75"></div>
          </div>

          <span className="hidden sm:inline-block sm:align-middle sm:h-screen" aria-hidden="true">
            &#8203;
          </span>

          <div className="inline-block align-bottom bg-white rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-lg sm:w-full">
            <div className="bg-white px-4 pt-5 pb-4 sm:p-6 sm:pb-4">
              <div className="sm:flex sm:items-start">
                <div className="mx-auto flex-shrink-0 flex items-center justify-center h-12 w-12 rounded-full bg-red-100 sm:mx-0 sm:h-10 sm:w-10">
                  <Trash2 className="h-6 w-6 text-red-600" aria-hidden="true" />
                </div>
                <div className="mt-3 text-center sm:mt-0 sm:ml-4 sm:text-left">
                  <h3 className="text-lg leading-6 font-medium text-gray-900">Confirm Deletion</h3>
                  <div className="mt-2">
                    <p className="text-sm text-gray-500">
                      Are you sure you want to delete "{itemToDelete?.name}"? This action cannot be undone.
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
     
    )
  }

  return (
    <div className="page">
      <h1 className="page-title">Categories Management</h1>

      {currentView === "main" && renderMainView()}
      {currentView === "updateCategory" && renderUpdateCategory()}

      <DeleteConfirmModal />
      <ToastContainer />
    </div>
  )
}