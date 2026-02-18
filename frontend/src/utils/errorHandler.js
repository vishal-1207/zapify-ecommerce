/**
 * Parses an API error and returns a user-friendly error message or object.
 * @param {Error} error - The error object caught from the try-catch block.
 * @param {string} defaultMessage - A fallback message if no specific error message is found.
 * @returns {string} - A user-friendly error message.
 */
export const getErrorMessage = (error, defaultMessage = "Something went wrong") => {
  if (!error) return defaultMessage;

  // Axios error with response
  if (error.response) {
    // Server responded with a status code outside of 2xx
    const data = error.response.data;

    // Handle Token Expiration specifically
    if (error.response.status === 401) {
      if (data?.message === "jwt expired" || data?.error === "jwt expired") {
        return "Session expired. Please log in again.";
      }
      return "Unauthorized access. Please log in.";
    }

    if (data && data.message) {
      return data.message;
    }
    if (data && data.error) {
        return data.error;
    }
    return `Server Error: ${error.response.statusText || defaultMessage}`;
  }

  // Axios error without response (e.g., network error)
  if (error.request) {
    return "Network error. Please check your internet connection.";
  }

  // Standard JS Error object
  if (error.message) {
    return error.message;
  }

  return defaultMessage;
};

/**
 * Handles API errors by logging them and returning a standardized message.
 * @param {Error} error - The error object.
 * @param {string} context - Context where the error occurred (e.g., "Fetching products").
 * @returns {string} - The processed error message.
 */
export const handleApiError = (error, context = "Operation failed") => {
    console.error(`[${context}]`, error);
    return getErrorMessage(error, `${context}. Please try again.`);
};
