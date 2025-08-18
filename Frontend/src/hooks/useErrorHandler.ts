import { useCallback } from "react";
import { toast } from "sonner";
import { AxiosError } from "axios";

interface ErrorResponse {
  message?: string;
  error?: string;
  errors?: Array<{
    msg?: string;
    message?: string;
    param?: string;
    path?: string;
  }>;
  statusCode?: number;
  success?: boolean;
}

interface ExtendedAxiosError extends AxiosError {
  userMessage?: string;
}

/**
 * Enhanced error handling hook that extracts user-friendly messages from API errors
 * and displays them in toast notifications
 */
export const useErrorHandler = () => {
  const handleError = useCallback(
    (error: unknown, fallbackMessage?: string) => {
      let errorMessage = fallbackMessage || "An unexpected error occurred";

      // Handle AxiosError with enhanced error message
      if (error && typeof error === "object" && "isAxiosError" in error) {
        const axiosError = error as ExtendedAxiosError;

        // Use enhanced error message from interceptor if available
        if (axiosError.userMessage) {
          errorMessage = axiosError.userMessage;
        } else {
          // Fallback to manual extraction
          const response = axiosError.response;
          if (response?.data) {
            const errorData = response.data as ErrorResponse;

            if (errorData.message) {
              errorMessage = errorData.message;
            } else if (errorData.error) {
              errorMessage = errorData.error;
            } else if (
              errorData.errors &&
              Array.isArray(errorData.errors) &&
              errorData.errors.length > 0
            ) {
              const firstError = errorData.errors[0];
              errorMessage =
                firstError.msg ||
                firstError.message ||
                "Validation error occurred";
            }
          }
        }
      }
      // Handle regular Error objects
      else if (error instanceof Error) {
        errorMessage = error.message;
      }
      // Handle string errors
      else if (typeof error === "string") {
        errorMessage = error;
      }

      // Display error in toast
      toast.error(errorMessage);

      // Log for debugging
      console.error("Error handled:", { error, message: errorMessage });

      return errorMessage;
    },
    []
  );

  const handleSuccess = useCallback((message: string) => {
    toast.success(message);
  }, []);

  const handleInfo = useCallback((message: string) => {
    toast.info(message);
  }, []);

  const handleWarning = useCallback((message: string) => {
    toast.warning(message);
  }, []);

  return {
    handleError,
    handleSuccess,
    handleInfo,
    handleWarning,
  };
};

/**
 * Utility function to extract error message without showing toast
 */
export const extractErrorMessage = (
  error: unknown,
  fallbackMessage?: string
): string => {
  let errorMessage = fallbackMessage || "An unexpected error occurred";

  if (error && typeof error === "object" && "isAxiosError" in error) {
    const axiosError = error as ExtendedAxiosError;

    if (axiosError.userMessage) {
      return axiosError.userMessage;
    }

    const response = axiosError.response;
    if (response?.data) {
      const errorData = response.data as ErrorResponse;

      if (errorData.message) {
        errorMessage = errorData.message;
      } else if (errorData.error) {
        errorMessage = errorData.error;
      } else if (
        errorData.errors &&
        Array.isArray(errorData.errors) &&
        errorData.errors.length > 0
      ) {
        const firstError = errorData.errors[0];
        errorMessage =
          firstError.msg || firstError.message || "Validation error occurred";
      }
    }
  } else if (error instanceof Error) {
    errorMessage = error.message;
  } else if (typeof error === "string") {
    errorMessage = error;
  }

  return errorMessage;
};
