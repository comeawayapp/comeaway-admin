import axios from "axios";

// Use environment variable or fallback to proxy URL
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "/api";

// console.log(API_BASE_URL);

// Check if we're in production mode
const isProduction = import.meta.env.PROD;

// Create an Axios instance with the access token
const createAxiosInstance = (accessToken) => {
  if (!accessToken) {
    throw new Error("Access token is required to create an Axios instance.");
  }

  const instance = axios.create({
    baseURL: API_BASE_URL,
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${accessToken}`,
    },
    // timeout:1000000, // 10 minutes for large file uploads 
    withCredentials: false, // Important for CORS
  });

  // Add request interceptor for debugging
  instance.interceptors.request.use(
    (config) => {
      if (!isProduction) {
        console.log("Making request to:", config.baseURL + config.url);
      }
      return config;
    },
    (error) => {
      return Promise.reject(error);
    }
  );

  // Add response interceptor for error handling
  instance.interceptors.response.use(
    (response) => response,
    (error) => {
      if (error.response?.status === 0 || error.code === "ERR_NETWORK") {
        if (!isProduction) {
          console.error("CORS or Network error detected");
        }
      }
      return Promise.reject(error);
    }
  );

  return instance;
};
const createAxiosInstances = (accessToken) => {
  if (!accessToken) {
    throw new Error("Access token is required to create an Axios instance.");
  }

  const instance = axios.create({
    baseURL: API_BASE_URL,
    headers: {
      Authorization: `Bearer ${accessToken}`,
    },
    // timeout:1000000,
    withCredentials: false, // Important for CORS
  });

  // Add request interceptor for debugging
  instance.interceptors.request.use(
    (config) => {
      if (!isProduction) {
        console.log(
          "Making multipart request to:",
          config.baseURL + config.url
        );
      }
      return config;
    },
    (error) => {
      return Promise.reject(error);
    }
  );

  // Add response interceptor for error handling
  instance.interceptors.response.use(
    (response) => response,
    (error) => {
      if (error.response?.status === 0 || error.code === "ERR_NETWORK") {
        if (!isProduction) {
          console.error("CORS or Network error detected in multipart request");
        }
      }
      return Promise.reject(error);
    }
  );

  return instance;
};
export const login = async (email, password) => {
  const endpoint = "/auth/login";

  try {
    const response = await axios.post(`${API_BASE_URL}${endpoint}`, {
      email,
      password,
    });
    return response.data;
  } catch (error) {
    console.error("Error during login:", {
      message: error.message,
      config: error.config,
      response: error.response
        ? {
            status: error.response.status,
            data: error.response.data,
            headers: error.response.headers,
          }
        : null,
    });

    throw error;
  }
};
export const signup = async (firstname, lastname, email, password) => {
  const endpoint = "/auth/signup";

  try {
    const response = await axios.post(`${API_BASE_URL}${endpoint}`, {
      firstname,
      lastname,
      email,
      password,
    });
    return response.data;
  } catch (error) {
    console.error("Error during signup:", {
      message: error.message,
      config: error.config,
      response: error.response
        ? {
            status: error.response.status,
            data: error.response.data,
            headers: error.response.headers,
          }
        : null,
    });

    throw error;
  }
};
export const forgotPassword = async (email, accessToken) => {
  const axiosInstance = createAxiosInstance(accessToken);
  const endpoint = "/auth/forgetPassword";

  try {
    const response = await axiosInstance.post(endpoint, { email });
    return response.data;
  } catch (error) {
    console.error("Error during forgot password:", {
      message: error.message,
      config: error.config,
      response: error.response
        ? {
            status: error.response.status,
            data: error.response.data,
            headers: error.response.headers,
          }
        : null,
    });

    throw error;
  }
};
export const resetPassword = async (resetToken, newPassword, accessToken) => {
  const axiosInstance = createAxiosInstance(accessToken);
  const endpoint = "/users/resetPassword";

  try {
    const response = await axiosInstance.post(endpoint, {
      resetToken,
      newPassword,
    });
    return response.data;
  } catch (error) {
    console.error("Error during reset password:", {
      message: error.message,
      config: error.config,
      response: error.response
        ? {
            status: error.response.status,
            data: error.response.data,
            headers: error.response.headers,
          }
        : null,
    });

    throw error;
  }
};
export const updateUserStatus = async (id, status, accessToken) => {
  const axiosInstance = createAxiosInstance(accessToken);
  const endpoint = `/auth/updateStatus/${id}`;

  try {
    const response = await axiosInstance.put(endpoint, { status });
    return response.data;
  } catch (error) {
    console.error("Error updating user status:", {
      message: error.message,
      config: error.config,
      response: error.response
        ? {
            status: error.response.status,
            data: error.response.data,
            headers: error.response.headers,
          }
        : null,
    });

    throw error;
  }
};

export const updateUserType = async (id, userType, accessToken) => {
  const axiosInstance = createAxiosInstance(accessToken);
  const endpoint = `/auth/updateUserType/${id}`;

  try {
    const response = await axiosInstance.put(endpoint, { userType });
    return response.data;
  } catch (error) {
    console.error("Error updating user type:", {
      message: error.message,
      config: error.config,
      response: error.response
        ? {
            status: error.response.status,
            data: error.response.data,
            headers: error.response.headers,
          }
        : null,
    });

    throw error;
  }
};
export const getUserById = async (id, accessToken) => {
  const axiosInstance = createAxiosInstance(accessToken);
  const endpoint = `/auth/getSingleUser/${id}`;

  try {
    const response = await axiosInstance.get(endpoint);
    return response.data;
  } catch (error) {
    console.error("Error fetching user by ID:", {
      message: error.message,
      config: error.config,
      response: error.response
        ? {
            status: error.response.status,
            data: error.response.data,
            headers: error.response.headers,
          }
        : null,
    });

    throw error;
  }
};
export const updateAdminDetails = async (
  id,
  firstname,
  lastname,
  email,
  password,
  accessToken
) => {
  const axiosInstance = createAxiosInstance(accessToken);
  const endpoint = `/auth/admin/update/${id}`;

  try {
    const response = await axiosInstance.put(endpoint, {
      firstname,
      lastname,
      email,
      password,
    });
    return response.data;
  } catch (error) {
    console.error("Error updating admin details:", {
      message: error.message,
      config: error.config,
      response: error.response
        ? {
            status: error.response.status,
            data: error.response.data,
            headers: error.response.headers,
          }
        : null,
    });

    throw error;
  }
};

export const updateUserPlanStatus = async (id, planStatus, accessToken) => {
  const axiosInstance = createAxiosInstance(accessToken);
  const endpoint = `/auth/admin/update-plan-status/${id}`;

  try {
    const response = await axiosInstance.put(endpoint, { planStatus });
    return response.data;
  } catch (error) {
    console.error("Error updating user plan status:", {
      message: error.message,
      config: error.config,
      response: error.response
        ? {
            status: error.response.status,
            data: error.response.data,
            headers: error.response.headers,
          }
        : null,
    });

    throw error;
  }
};
export const createCategory = async (name, slug, accessToken) => {
  const axiosInstance = createAxiosInstance(accessToken);
  const endpoint = "/categories/create-catagory";

  try {
    const response = await axiosInstance.post(endpoint, { name, slug });
    return response.data;
  } catch (error) {
    console.error("Error creating category:", {
      message: error.message,
      config: error.config,
      response: error.response
        ? {
            status: error.response.status,
            data: error.response.data,
            headers: error.response.headers,
          }
        : null,
    });

    throw error;
  }
};
export const getCategories = async (accessToken) => {
  const axiosInstance = createAxiosInstance(accessToken);
  const endpoint = "/categories/getCatagories";

  try {
    const response = await axiosInstance.get(endpoint);
    return response.data;
  } catch (error) {
    console.error("Error fetching categories:", {
      message: error.message,
      config: error.config,
      response: error.response
        ? {
            status: error.response.status,
            data: error.response.data,
            headers: error.response.headers,
          }
        : null,
    });

    throw error;
  }
};
export const getCategoryById = async (id, accessToken) => {
  const axiosInstance = createAxiosInstance(accessToken);
  const endpoint = `/categories/getCatagory/${id}`;

  try {
    const response = await axiosInstance.get(endpoint);
    return response.data;
  } catch (error) {
    console.error("Error fetching category by ID:", {
      message: error.message,
      config: error.config,
      response: error.response
        ? {
            status: error.response.status,
            data: error.response.data,
            headers: error.response.headers,
          }
        : null,
    });

    throw error;
  }
};
export const updateCategory = async (id, name, slug, accessToken) => {
  const axiosInstance = createAxiosInstance(accessToken);
  const endpoint = `/categories/updateCatagory/${id}`;

  try {
    const response = await axiosInstance.put(endpoint, { name, slug });
    return response.data;
  } catch (error) {
    console.error("Error updating category:", {
      message: error.message,
      config: error.config,
      response: error.response
        ? {
            status: error.response.status,
            data: error.response.data,
            headers: error.response.headers,
          }
        : null,
    });

    throw error;
  }
};
export const deleteCategory = async (id, accessToken) => {
  const axiosInstance = createAxiosInstance(accessToken);
  const endpoint = `/categories/deleteCatagory/${id}`;

  try {
    const response = await axiosInstance.delete(endpoint);
    return response.data;
  } catch (error) {
    console.error("Error deleting category:", {
      message: error.message,
      config: error.config,
      response: error.response
        ? {
            status: error.response.status,
            data: error.response.data,
            headers: error.response.headers,
          }
        : null,
    });

    throw error;
  }
};
export const createSound = async (formData, accessToken) => {
  const axiosInstance = createAxiosInstances(accessToken);
  const endpoint = "/sounds/add-sounds";

  try {
    const response = await axiosInstance.post(endpoint, formData, {
      headers: {
        "Content-Type": "multipart/form-data",
      },
      timeout: 300000, // 5 minutes for large file uploads
      maxContentLength: Infinity,
      maxBodyLength: Infinity,
    });
    return response.data;
  } catch (error) {
    console.error("Error creating sound:", {
      message: error.message,
      config: error.config,
      response: error.response
        ? {
            status: error.response.status,
            data: error.response.data,
            headers: error.response.headers,
          }
        : null,
    });

    throw error;
  }
};
export const getSounds = async (accessToken) => {
  const axiosInstance = createAxiosInstance(accessToken);
  const endpoint = "/sounds/getSounds";

  try {
    const response = await axiosInstance.get(endpoint);
    return response.data;
  } catch (error) {
    console.error("Error fetching sounds:", {
      message: error.message,
      config: error.config,
      response: error.response
        ? {
            status: error.response.status,
            data: error.response.data,
            headers: error.response.headers,
          }
        : null,
    });

    throw error;
  }
};
export const getSoundById = async (id, accessToken) => {
  const axiosInstance = createAxiosInstance(accessToken);
  const endpoint = `/sounds/getSingleSound/${id}`;

  try {
    const response = await axiosInstance.get(endpoint);
    return response.data;
  } catch (error) {
    console.error("Error fetching sound by ID:", {
      message: error.message,
      config: error.config,
      response: error.response
        ? {
            status: error.response.status,
            data: error.response.data,
            headers: error.response.headers,
          }
        : null,
    });

    throw error;
  }
};
export const updateSound = async (id, formData, accessToken) => {
  const axiosInstance = createAxiosInstances(accessToken);
  const endpoint = `/sounds/updateSound/${id}`;

  try {
    const response = await axiosInstance.put(endpoint, formData, {
      headers: {
        "Content-Type": "multipart/form-data",
      },
      timeout: 300000, // 5 minutes for large file uploads
      maxContentLength: Infinity,
      maxBodyLength: Infinity,
    });
    return response.data;
  } catch (error) {
    console.error("Error updating sound:", {
      message: error.message,
      config: error.config,
      response: error.response
        ? {
            status: error.response.status,
            data: error.response.data,
            headers: error.response.headers,
          }
        : null,
    });

    throw error;
  }
};
export const deleteSound = async (id, accessToken) => {
  const axiosInstance = createAxiosInstance(accessToken);
  const endpoint = `/sounds/deleteSound/${id}`;

  try {
    const response = await axiosInstance.delete(endpoint);
    return response.data;
  } catch (error) {
    console.error("Error deleting sound:", {
      message: error.message,
      config: error.config,
      response: error.response
        ? {
            status: error.response.status,
            data: error.response.data,
            headers: error.response.headers,
          }
        : null,
    });

    throw error;
  }
};
export const getUserSubscriptionDetails = async (userId, accessToken) => {
  const axiosInstance = createAxiosInstance(accessToken);
  const endpoint = `/subscription/subscription-details/${userId}`;

  try {
    const response = await axiosInstance.get(endpoint);
    return response.data;
  } catch (error) {
    console.error("Error fetching subscription by user ID:", {
      message: error.message,
      config: error.config,
      response: error.response
        ? {
            status: error.response.status,
            data: error.response.data,
            headers: error.response.headers,
          }
        : null,
    });

    throw error;
  }
};
export const getAllUsersSubscription = async (accessToken) => {
  const axiosInstance = createAxiosInstance(accessToken);
  const endpoint = `/subscription/admin/all-subscriptions`;

  try {
    const response = await axiosInstance.get(endpoint);
    return response.data;
  } catch (error) {
    console.error("Error fetching All User Subscription Detail :", {
      message: error.message,
      config: error.config,
      response: error.response
        ? {
            status: error.response.status,
            data: error.response.data,
            headers: error.response.headers,
          }
        : null,
    });

    throw error;
  }
};
export const getAllUsers = async (accessToken, query = {}) => {
  const axiosInstance = createAxiosInstance(accessToken);
  const endpoint = "/auth/all-user";

  try {
    const response = await axiosInstance.get(endpoint, { params: query });
    return response.data;
  } catch (error) {
    console.error("Error fetching all users:", {
      message: error.message,
      config: error.config,
      response: error.response
        ? {
            status: error.response.status,
            data: error.response.data,
            headers: error.response.headers,
          }
        : null,
    });

    throw error;
  }
};
export const createActivationCode = async (data, accessToken) => {
  const axiosInstance = createAxiosInstance(accessToken);
  const endpoint = "/activation-codes/admin/activation-codes";
  try {
    const response = await axiosInstance.post(endpoint, data);
    return response.data;
  } catch (error) {
    // Handle backend error messages
    const errorMsg = error.response?.data?.error || error.message;
    throw new Error(errorMsg);
  }
};

export const getActivationCodes = async (accessToken, query = {}) => {
  const axiosInstance = createAxiosInstance(accessToken);
  const endpoint = "/activation-codes/admin/activation-codes";
  try {
    const response = await axiosInstance.get(endpoint, { params: query });
    return response.data;
  } catch (error) {
    const errorMsg = error.response?.data?.error || error.message;
    throw new Error(errorMsg);
  }
};

export const updateActivationCode = async (id, data, accessToken) => {
  const axiosInstance = createAxiosInstance(accessToken);
  const endpoint = `/activation-codes/admin/activation-codes/${id}`;
  try {
    const response = await axiosInstance.put(endpoint, data);
    return response.data;
  } catch (error) {
    const errorMsg = error.response?.data?.error || error.message;
    throw new Error(errorMsg);
  }
};

export const deleteActivationCode = async (id, accessToken) => {
  const axiosInstance = createAxiosInstance(accessToken);
  const endpoint = `/activation-codes/admin/activation-codes/${id}`;
  try {
    const response = await axiosInstance.delete(endpoint);
    return response.data;
  } catch (error) {
    const errorMsg = error.response?.data?.error || error.message;
    throw new Error(errorMsg);
  }
};

export const editActivationCode = async (id, data, accessToken) => {
  const axiosInstance = createAxiosInstance(accessToken);
  const endpoint = `/activation-codes/admin/activation-codes/${id}`;
  try {
    const response = await axiosInstance.put(endpoint, data);
    return response.data;
  } catch (error) {
    const errorMsg = error.response?.data?.error || error.message;
    throw new Error(errorMsg);
  }
};

export const importActivationCodes = async (data, accessToken) => {
  const axiosInstance = createAxiosInstance(accessToken);
  const endpoint = "/activation-codes/admin/activation-codes/import";
  try {
    const response = await axiosInstance.post(endpoint, { codes: data });
    return response.data;
  } catch (error) {
    const errorMsg = error.response?.data?.error || error.message;
    throw new Error(errorMsg);
  }
};
export const sendEMail = async (data, accessToken) => {
  const axiosInstance = createAxiosInstance(accessToken);
  const endpoint = "/activation-codes/admin/activation-codes/send-to-user";
  try {
    const response = await axiosInstance.post(endpoint, data);
    return response.data;
  } catch (error) {
    const errorMsg = error.response?.data?.error || error.message;
    throw new Error(errorMsg);
  }
};

export const redeemActivationCode = async (code, accessToken) => {
  const axiosInstance = createAxiosInstance(accessToken);
  const endpoint = "/activation-codes/activation-codes/redeem";
  try {
    const response = await axiosInstance.post(endpoint, { code });
    return response.data;
  } catch (error) {
    const errorMsg = error.response?.data?.error || error.message;
    throw new Error(errorMsg);
  }
};

// Delete user by ID (Admin only)
export const deleteUserById = async (userId, accessToken) => {
  try {
    const axiosInstance = createAxiosInstance(accessToken);
    const response = await axiosInstance.delete(`/auth/admin/delete/${userId}`);
    return response.data;
  } catch (error) {
    if (error.response && error.response.data && error.response.data.message) {
      throw new Error(error.response.data.message);
    }
    throw new Error(error.message || "Failed to delete user");
  }
};

export const createDiscount = async (data, accessToken) => {
  const axiosInstance = createAxiosInstance(accessToken);
  const endpoint = "/discounts/create";
  try {
    const response = await axiosInstance.post(endpoint, data);
    return response.data;
  } catch (error) {
    const errorMsg = error.response?.data?.error || error.message;
    throw new Error(errorMsg);
  }
};

export const getDiscounts = async (accessToken) => {
  const axiosInstance = createAxiosInstance(accessToken);
  const endpoint = "/discounts/all";
  try {
    const response = await axiosInstance.get(endpoint);
    return response.data;
  } catch (error) {
    const errorMsg = error.response?.data?.error || error.message;
    throw new Error(errorMsg);
  }
};

export const deleteDiscount = async (id, accessToken) => {
  const axiosInstance = createAxiosInstance(accessToken);
  const endpoint = `/discounts/${id}`;
  try {
    const response = await axiosInstance.delete(endpoint);
    return response.data;
  } catch (error) {
    const errorMsg = error.response?.data?.error || error.message;
    throw new Error(errorMsg);
  }
};
export const updateDiscount = async (id, data, accessToken) => {
  const axiosInstance = createAxiosInstance(accessToken);
  const endpoint = `/discounts/${id}`;
  try {
    const response = await axiosInstance.put(endpoint, data);
    return response.data;
  } catch (error) {
    const errorMsg = error.response?.data?.error || error.message;
    throw new Error(errorMsg);
  }
};

export const getPrices = async (accessToken) => {
  const axiosInstance = createAxiosInstance(accessToken);
  const endpoint = "/prices/all";
  try {
    const response = await axiosInstance.get(endpoint);
    console.log(response.data);
    return response.data;
  } catch (error) {
    const errorMsg = error.response?.data?.error || error.message;
    throw new Error(errorMsg);
  }
};

export const updatePrices = async (planType, data, accessToken) => {
  const axiosInstance = createAxiosInstance(accessToken);
  const endpoint = `/prices/plan/${planType}`;
  try {
    const response = await axiosInstance.put(endpoint, data);
    return response.data;
  } catch (error) {
    const errorMsg = error.response?.data?.error || error.message;
    throw new Error(errorMsg);
  }
};

export const getAllAssignments = async (accessToken) => {
  const axiosInstance = createAxiosInstance(accessToken);
  const endpoint = "/prices/plan/monthly/with-available-discounts";
  try {
    const response = await axiosInstance.get(endpoint);
    return response.data;
  } catch (error) {
    const errorMsg = error.response?.data?.error || error.message;
    throw new Error(errorMsg);
  }
};

export const assignDiscountToPrice = async (data, accessToken) => {
  const axiosInstance = createAxiosInstance(accessToken);
  const endpoint = "/prices/assign-discount";
  try {
    const response = await axiosInstance.post(endpoint, data);
    return response.data;
  } catch (error) {
    console.log(error);
    const errorMsg = error.response?.data?.message || error.message;
    throw new Error(errorMsg);
  }
};

export const removeDiscountFromPrice = async (
  priceId,
  discountId,
  accessToken
) => {
  const axiosInstance = createAxiosInstance(accessToken);
  const endpoint = `/prices/remove-discount/${priceId}`;
  try {
    const response = await axiosInstance.delete(endpoint);
    return response.data;
  } catch (error) {
    const errorMsg = error.response?.data?.error || error.message;
    throw new Error(errorMsg);
  }
};

// Export the createAxiosInstance function
export { createAxiosInstance };
