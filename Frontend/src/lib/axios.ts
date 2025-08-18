import axios from "axios";

const API_URL = process.env.NEXT_PUBLIC_BACKEND_URL;

const axiosInstance = axios.create({
  baseURL: API_URL,
  headers: {
    "Content-Type": "application/json",
  },
  withCredentials: true,
});

// Request interceptor to add token if available
axiosInstance.interceptors.request.use(
  (config) => {
    // The backend primarily uses HTTP-only cookies for authentication
    // This interceptor ensures withCredentials is always true
    config.withCredentials = true;

    // Optional: Add Authorization header if token exists in localStorage
    // (This is mainly for development/testing, production uses cookies)
    if (typeof window !== "undefined") {
      const token = localStorage.getItem("token");
      if (token && !config.headers.Authorization) {
        config.headers.Authorization = `Bearer ${token}`;
      }
    }

    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);
// Enhanced error handling utility
const getErrorMessage = (error: unknown): string => {
  // Type guard for axios errors
  const axiosError = error as {
    code?: string;
    response?: {
      data?: unknown;
      status?: number;
    };
    message?: string;
  };

  // Check for network errors first
  if (
    axiosError.code === "ERR_NETWORK" ||
    axiosError.code === "ERR_CONNECTION_REFUSED"
  ) {
    return "Unable to connect to server. Please check your internet connection and try again.";
  }

  // Check for timeout errors
  if (axiosError.code === "ECONNABORTED") {
    return "Request timed out. Please try again.";
  }

  // Extract error message from response
  const response = axiosError.response;
  if (response?.data) {
    // Handle different response formats
    if (typeof response.data === "string") {
      return response.data;
    }

    const data = response.data as Record<string, unknown>;

    if (data.message && typeof data.message === "string") {
      return data.message;
    }

    if (data.error && typeof data.error === "string") {
      return data.error;
    }

    // Handle validation errors
    if (data.errors && Array.isArray(data.errors)) {
      const firstError = data.errors[0] as Record<string, unknown>;
      return (
        (firstError?.msg as string) ||
        (firstError?.message as string) ||
        "Validation error occurred"
      );
    }
  }

  // Fallback to HTTP status messages
  switch (response?.status) {
    case 400:
      return "Invalid request. Please check your input and try again.";
    case 401:
      return "Authentication required. Please log in again.";
    case 403:
      return "You don't have permission to perform this action.";
    case 404:
      return "The requested resource was not found.";
    case 429:
      return "Too many requests. Please wait a moment and try again.";
    case 500:
      return "Server error occurred. Please try again later.";
    case 503:
      return "Service is temporarily unavailable. Please try again later.";
    default:
      return (
        axiosError.message || "An unexpected error occurred. Please try again."
      );
  }
};

axiosInstance.interceptors.response.use(
  (response) => response,
  async (error) => {
    // Log connection errors for debugging
    if (
      error.code === "ERR_NETWORK" ||
      error.code === "ERR_CONNECTION_REFUSED"
    ) {
      console.error("Backend connection error:", error.message);
      console.error("Trying to connect to:", API_URL);
    }

    // Enhance error with user-friendly message
    error.userMessage = getErrorMessage(error);

    return Promise.reject(error);
  }
);
export default axiosInstance;
