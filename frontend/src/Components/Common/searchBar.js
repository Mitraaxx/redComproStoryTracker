// Utility flow summary:
// 1) Apply structured dropdown filters (assignee/status/date/apps).
// 2) Apply free-text search on story fields.
// 3) Keep results sorted by descending numeric story identifier.
import { formatDateForInput } from "./DateUtils";

export const applyDropdownFilters = (stories, activeFilters) => {
  // Filter dataset based on active filter values; no-op when a filter is empty.
  return (
    stories?.filter((item) => {
      // Exact-match assignee filter.
      if (
        activeFilters.assignee &&
        item.responsibility !== activeFilters.assignee
      )
        return false;

      // Exact-match status filter.
      if (activeFilters.status && item.status !== activeFilters.status)
        return false;

      // Date filter compares normalized YYYY-MM-DD values.
      if (activeFilters.qaRelDate) {
        if (!item.qaEnvRelDate) return false;
        const storyDate = formatDateForInput(item.qaEnvRelDate);
        if (storyDate !== activeFilters.qaRelDate) return false;
      }

      // App filter matches only linked appName values.
      if (activeFilters.apps) {
        const selectedApp = activeFilters.apps;
        const hasLinkedApp = Array.isArray(item.linkedApps)
          ? item.linkedApps.some((app) => app?.appName === selectedApp)
          : false;
        if (!hasLinkedApp) return false;
      }

      // Story passes all active filters.
      return true;
    }) || []
  );
};

export const applySearchAndSort = (filteredStories, searchTerm) => {
  // Apply text search, then sort by story number in descending order.
  return (
    filteredStories
      ?.filter((item) => {
        // Normalize search term once per item check.
        const search = searchTerm.trim().toLowerCase();
        if (!search) return true;

        // Search by story name and story ID.
        const storyName = item.storyName?.toLowerCase() || "";
        const storyId = item.storyId?.toLowerCase() || "";
        return storyName.includes(search) || storyId.includes(search);
      })
      .sort((a, b) => {
        // Extract numeric component from IDs like ABC-123 for consistent sorting.
        const numA = parseInt(a.storyId?.match(/\d+/)?.[0] || "0", 10);
        const numB = parseInt(b.storyId?.match(/\d+/)?.[0] || "0", 10);
        return numB - numA;
      }) || []
  );
};
