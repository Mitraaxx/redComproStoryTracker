// Utility flow summary:
// 1) Format stored date values for display labels/cards.
// 2) Normalize date values into YYYY-MM-DD for input controls.
export const formatDate = dateString => {
  // Return empty string when no date exists so UI can show fallback text.
  if (!dateString) return "";

  // Display format used across story/sprint/release cards.
  const options = {
    day: "numeric",
    month: "short",
    year: "numeric"
  };

  // en-GB produces a predictable DD Mon YYYY style.
  return new Date(dateString).toLocaleDateString("en-GB", options);
};

export const formatDateForInput = dateString => {
  // HTML date inputs require YYYY-MM-DD values.
  return dateString ? new Date(dateString).toISOString().split("T")[0] : "";
};
