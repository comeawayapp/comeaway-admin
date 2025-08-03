"use client";

import { useState, useEffect, useContext } from "react";
import { ArrowLeft } from "lucide-react";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import {
  createSound,
  updateSound,
  getCategories,
} from "../../../../utils/API_SERVICE";
import { AuthContext } from "../../../../context/authContext";
import {
  compressImage,
  formatFileSize,
  validateFileSize,
  validateFileType,
} from "../../../../utils/fileUtils";

export default function AddOrUpdateSound({
  setCurrentView,
  selectedSound = null,
  onSave,
  buttonText,
}) {
  const { accessToken } = useContext(AuthContext);
  const [categories, setCategories] = useState([]);
  const [soundFile, setSoundFile] = useState(null);
  const [thumbnailFile, setThumbnailFile] = useState(null);
  const [soundPreview, setSoundPreview] = useState(null);
  const [thumbnailPreview, setThumbnailPreview] = useState(null);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const MAX_SOUND_FILE_SIZE = 10 * 1024 * 1024; // 10 MB for sound files
  const MAX_THUMBNAIL_SIZE = 5 * 1024 * 1024; // 5 MB for thumbnails

  useEffect(() => {
    async function fetchCategories() {
      try {
        const categoriesData = await getCategories(accessToken);
        setCategories(categoriesData);
      } catch (error) {
        toast.error("Error fetching categories");
      }
    }
    fetchCategories();
  }, [accessToken]);

  // Load existing sound and thumbnail when editing
  useEffect(() => {
    if (selectedSound) {
      // Set existing thumbnail preview if available
      if (selectedSound.thumbnail) {
        setThumbnailPreview(
          "https://api.comeaway.com/" + selectedSound.thumbnail
        );
      }

      // Set existing sound preview if available
      if (selectedSound.soundFile) {
        setSoundPreview("https://api.comeaway.com/" + selectedSound.soundFile);
      }
    }
  }, [selectedSound]);

  console.log("selectedSound", selectedSound);

  const handleSoundUpload = (event) => {
    const file = event.target.files[0];
    if (file) {
      // Check file type
      const allowedAudioTypes = [
        "audio/mp3",
        "audio/mpeg",
        "audio/wav",
        "audio/ogg",
        "audio/m4a",
      ];
      if (!validateFileType(file, allowedAudioTypes)) {
        toast.error("Please upload a valid audio file (MP3, WAV, OGG, M4A).");
        return;
      }

      if (!validateFileSize(file, 20)) {
        toast.error(
          `Sound file is too large. Maximum size is 10 MB. Current size: ${formatFileSize(
            file.size
          )}`
        );
        return;
      }
      setSoundFile(file);
      const reader = new FileReader();
      reader.onload = (e) => {
        setSoundPreview(e.target.result);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleThumbnailUpload = async (event) => {
    const file = event.target.files[0];
    if (file) {
      // Check file type
      const allowedImageTypes = [
        "image/jpeg",
        "image/jpg",
        "image/png",
        "image/webp",
      ];
      if (!validateFileType(file, allowedImageTypes)) {
        toast.error("Please upload a valid image file (JPEG, PNG, WebP).");
        return;
      }

      let processedFile = file;

      // If file is too large, try to compress it
      if (!validateFileSize(file, 5)) {
        toast.info("Compressing large image...");
        try {
          processedFile = await compressImage(file, 20 * 1024, 0.8); // 20MB max, 80% quality
          if (!validateFileSize(processedFile, 5)) {
            toast.error(
              `Image is still too large after compression. Please use a smaller image.`
            );
            return;
          }
          toast.success(
            `Image compressed from ${formatFileSize(
              file.size
            )} to ${formatFileSize(processedFile.size)}`
          );
        } catch (error) {
          toast.error("Failed to compress image. Please try a smaller file.");
          return;
        }
      }

      setThumbnailFile(processedFile);
      const reader = new FileReader();
      reader.onload = (e) => {
        setThumbnailPreview(e.target.result);
      };
      reader.readAsDataURL(processedFile);
    }
  };

  const handleSubmit = async (event) => {
    event.preventDefault();

    // Validate files are selected
    if (!selectedSound && !soundFile) {
      toast.error("Please select a sound file");
      return;
    }

    if (!selectedSound && !thumbnailFile) {
      toast.error("Please select a thumbnail image");
      return;
    }

    setIsUploading(true);
    setUploadProgress(0);

    const formData = new FormData();
    formData.append("title", event.target.title.value);
    formData.append("description", event.target.description.value);
    formData.append("status", event.target.status.value);

    if (soundFile) {
      formData.append("soundFile", soundFile);
    }
    if (thumbnailFile) {
      formData.append("thumbnail", thumbnailFile);
    }

    // Get selected categories
    const selectedCategories = Array.from(event.target.category)
      .filter((input) => input.checked)
      .map((input) => input.value);
    formData.append("categories", JSON.stringify(selectedCategories));

    // Log formData contents and total size
    let totalSize = 0;
    for (let [key, value] of formData.entries()) {
      if (value instanceof File) {
        totalSize += value.size;
        console.log(`${key}: ${value.name} (${formatFileSize(value.size)})`);
      } else {
        console.log(`${key}: ${value}`);
      }
    }
    console.log(`Total upload size: ${formatFileSize(totalSize)}`);

    try {
      let result;
      if (selectedSound) {
        result = await updateSound(selectedSound._id, formData, accessToken);
        console.log("Update result:", result);
        toast.success("Sound updated successfully");
      } else {
        result = await createSound(formData, accessToken);
        console.log("Create result:", result);
        toast.success("Sound created successfully");
      }

      // Pass the result to onSave if available, otherwise call with no params to trigger refetch
      console.log("Calling onSave with:", result?.data || null);
      onSave(result?.data || null);
      setCurrentView("main");
    } catch (error) {
      console.error("Error details:", error);

      if (error.response?.status === 413) {
        toast.error(
          "File too large! Please reduce the file size and try again. Max: 10MB for audio, 5MB for images."
        );
      } else if (error.response?.status === 400) {
        toast.error(
          `Validation error: ${error.response.data?.message || "Invalid data"}`
        );
      } else if (error.response?.status === 401) {
        toast.error("Authentication failed. Please login again.");
      } else if (error.response?.status === 500) {
        toast.error("Server error. Please try again later.");
      } else {
        toast.error(
          `Error ${selectedSound ? "updating" : "creating"} sound: ${
            error.response?.data?.message || error.message
          }`
        );
      }
    } finally {
      setIsUploading(false);
      setUploadProgress(0);
    }
  };

  return (
    <div className="bg-white rounded-lg border border-gray-200 shadow-md">
      <div className="p-6 bg-gray-50 border-b border-gray-200 rounded-t-lg">
        <div className="flex items-center">
          <button
            className="mr-2 p-2 rounded-full hover:bg-gray-200 focus:outline-none focus:ring-2 focus:ring-gray-300"
            onClick={() => setCurrentView("main")}
          >
            <ArrowLeft className="h-5 w-5" />
          </button>
          <div>
            <h3 className="text-xl font-bold">
              {selectedSound ? "Update Sound" : "Add New Sound"}
            </h3>
            <p className="text-gray-500 mt-1">Fill in the details below</p>
          </div>
        </div>
      </div>
      <div className="p-6">
        <form
          className="space-y-6"
          onSubmit={handleSubmit}
        >
          <div className="space-y-2">
            <label
              htmlFor="title"
              className="block text-sm font-medium text-gray-700"
            >
              Sound Title
            </label>
            <input
              id="title"
              name="title"
              type="text"
              className="mt-1 block w-full px-3 py-2 bg-white border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
              placeholder="Enter sound title"
              defaultValue={selectedSound?.title || ""}
            />
          </div>

          <div className="space-y-2">
            <label
              htmlFor="description"
              className="block text-sm font-medium text-gray-700"
            >
              Sound Description
            </label>
            <textarea
              id="description"
              name="description"
              className="mt-1 block w-full px-3 py-2 bg-white border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
              placeholder="Enter sound description"
              rows={3}
              defaultValue={selectedSound?.description || ""}
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <label
                htmlFor="sound-file"
                className="block text-sm font-medium text-gray-700"
              >
                Upload Sound{" "}
                <span className="text-gray-500 text-xs">(Max: 20MB)</span>
              </label>
              <div className="flex items-center justify-center w-full">
                <label
                  htmlFor="sound-file"
                  className="flex flex-col items-center justify-center w-full h-32 border-2 border-dashed rounded-lg cursor-pointer bg-gray-50 hover:bg-gray-100 dark:border-gray-600"
                >
                  <div className="flex flex-col items-center justify-center pt-5 pb-6">
                    <svg
                      className="w-8 h-8 mb-4 text-gray-500"
                      aria-hidden="true"
                      xmlns="http://www.w3.org/2000/svg"
                      fill="none"
                      viewBox="0 0 20 16"
                    >
                      <path
                        stroke="currentColor"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth="2"
                        d="M13 13h3a3 3 0 0 0 0-6h-.025A5.56 5.56 0 0 0 16 6.5 5.5 5.5 0 0 0 5.207 5.021C5.137 5.017 5.071 5 5 5a4 4 0 0 0 0 8h2.167M10 15V6m0 0L8 8m2-2 2 2"
                      />
                    </svg>
                    <p className="mb-2 text-sm text-gray-500">
                      <span className="font-semibold">Click to upload</span> or
                      drag and drop
                    </p>
                    <p className="text-xs text-gray-500">
                      MP3, WAV, OGG, M4A (Max 20MB)
                    </p>
                  </div>
                  <input
                    id="sound-file"
                    name="soundFile"
                    type="file"
                    className="hidden"
                    accept=".mp3,.wav,.ogg,.m4a,audio/*"
                    onChange={handleSoundUpload}
                  />
                </label>
              </div>
              {soundFile && (
                <div className="mt-2 text-sm text-gray-600">
                  Selected: {soundFile.name} ({formatFileSize(soundFile.size)})
                </div>
              )}
              {!soundFile && selectedSound?.soundFile && (
                <div className="mt-2 text-sm text-gray-600">
                  Current file: {selectedSound.title || "Existing sound file"}
                </div>
              )}
              {soundPreview && (
                <div className="mt-2">
                  <audio
                    controls
                    src={soundPreview}
                    className="w-full"
                  >
                    Your browser does not support the audio element.
                  </audio>
                </div>
              )}
            </div>

            <div className="space-y-2">
              <label
                htmlFor="thumbnail"
                className="block text-sm font-medium text-gray-700"
              >
                Upload Thumbnail{" "}
                <span className="text-gray-500 text-xs">(Max: 5MB)</span>
              </label>
              <div className="flex items-center justify-center w-full">
                <label
                  htmlFor="thumbnail"
                  className="flex flex-col items-center justify-center w-full h-32 border-2 border-dashed rounded-lg cursor-pointer bg-gray-50 hover:bg-gray-100 dark:border-gray-600"
                >
                  <div className="flex flex-col items-center justify-center pt-5 pb-6">
                    <svg
                      className="w-8 h-8 mb-4 text-gray-500"
                      aria-hidden="true"
                      xmlns="http://www.w3.org/2000/svg"
                      fill="none"
                      viewBox="0 0 20 16"
                    >
                      <path
                        stroke="currentColor"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth="2"
                        d="M13 13h3a3 3 0 0 0 0-6h-.025A5.56 5.56 0 0 0 16 6.5 5.5 5.5 0 0 0 5.207 5.021C5.137 5.017 5.071 5 5 5a4 4 0 0 0 0 8h2.167M10 15V6m0 0L8 8m2-2 2 2"
                      />
                    </svg>
                    <p className="mb-2 text-sm text-gray-500">
                      <span className="font-semibold">Click to upload</span> or
                      drag and drop
                    </p>
                    <p className="text-xs text-gray-500">
                      JPEG, PNG, WebP (Max 5MB)
                    </p>
                  </div>
                  <input
                    id="thumbnail"
                    name="thumbnail"
                    type="file"
                    className="hidden"
                    accept="image/jpeg,image/jpg,image/png,image/webp"
                    onChange={handleThumbnailUpload}
                  />
                </label>
              </div>
              {thumbnailFile && (
                <div className="mt-2 text-sm text-gray-600">
                  Selected: {thumbnailFile.name} (
                  {formatFileSize(thumbnailFile.size)})
                </div>
              )}
              {!thumbnailFile && selectedSound?.thumbnail && (
                <div className="mt-2 text-sm text-gray-600">
                  Current thumbnail:{" "}
                  {selectedSound.title || "Existing thumbnail"}
                </div>
              )}
              {thumbnailPreview && (
                <div className="mt-2">
                  <img
                    src={thumbnailPreview || "/placeholder.svg"}
                    alt="Thumbnail preview"
                    className="max-w-full h-auto rounded-lg"
                  />
                </div>
              )}
            </div>
          </div>

          <div className="space-y-2">
            <label className="block text-sm font-medium text-gray-700">
              Assign Categories
            </label>
            <div className="border border-gray-300 rounded-md p-4 space-y-2">
              {categories.map((category) => (
                <div
                  key={category._id}
                  className="flex items-center space-x-2"
                >
                  <div className="relative flex items-start">
                    <div className="flex h-5 items-center">
                      <input
                        id={`category-${category._id}`}
                        name="category"
                        value={category._id}
                        type="checkbox"
                        defaultChecked={
                          selectedSound?.categories?.includes(category._id) ||
                          false
                        }
                        className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                      />
                    </div>
                    <div className="ml-3 text-sm">
                      <label
                        htmlFor={`category-${category._id}`}
                        className="font-medium text-gray-700"
                      >
                        {category.name}
                      </label>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="space-y-2">
            <label className="block text-sm font-medium text-gray-700">
              Set Status
            </label>
            <div className="space-y-2">
              <div className="flex items-center">
                <input
                  id="standard"
                  name="status"
                  type="radio"
                  value="Standard"
                  defaultChecked={
                    !selectedSound || selectedSound?.status === "Standard"
                  }
                  className="h-4 w-4 border-gray-300 text-blue-600 focus:ring-blue-500"
                />
                <label
                  htmlFor="standard"
                  className="ml-3 block text-sm font-medium text-gray-700"
                >
                  Standard User
                </label>
              </div>
              <div className="flex items-center">
                <input
                  id="premium"
                  name="status"
                  type="radio"
                  value="Premium"
                  defaultChecked={selectedSound?.status === "Premium"}
                  className="h-4 w-4 border-gray-300 text-blue-600 focus:ring-blue-500"
                />
                <label
                  htmlFor="premium"
                  className="ml-3 block text-sm font-medium text-gray-700"
                >
                  Premium User
                </label>
              </div>
            </div>
          </div>

          <div className="p-6 bg-gray-50 border-t border-gray-200 rounded-b-lg flex justify-end gap-2">
            <button
              type="button"
              className="py-2 px-4 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
              onClick={() => setCurrentView("main")}
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isUploading}
              className={`py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 ${
                isUploading ? "opacity-50 cursor-not-allowed" : ""
              }`}
              style={{ backgroundColor: "#439AB8" }}
            >
              {isUploading ? (
                <div className="flex items-center">
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  Uploading...
                </div>
              ) : (
                buttonText || (selectedSound ? "Update Sound" : "Create Sound")
              )}
            </button>
          </div>
        </form>
      </div>
      <ToastContainer />
    </div>
  );
}
