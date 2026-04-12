// Utility flow summary:
// 1) Centralize API error handling with toast + rethrow.
// 2) Centralize success notifications for consistent UX.
import { toast } from "react-toastify";

export const handleApiError = (error, defaultMessage = "An error occurred") => {
  // Keep error visible in dev tools for debugging context.
  console.error("API Error:", error);

  // Show message from API when available, otherwise fallback text.
  toast.error(error.message || defaultMessage);

  // Rethrow so caller can keep its control-flow handling (retry, rollback, etc.).
  throw error;
};

export const handleApiSuccess = message => {
  // Single helper for success feedback after API actions.
  toast.success(message);
};
