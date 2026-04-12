// Sprint list page.
//
// High-level flow:
// 1) Fetch all sprints on mount.
// 2) Apply search and sorting in memory.
// 3) Slice visible rows via pagination state.
// 4) Open modal to create sprint and append it locally after success.
// 5) Navigate to sprint stories page on card click.
import { useEffect, useState, useMemo } from "react";
import { fetchAllSprints, createSprint, clearAllCaches } from "../../Api/Api";
import { useNavigate } from "react-router-dom";
import "../Sprints/SprintList.css";
import { toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import SprintModal from "../Modals/SprintModal";
import { ITEMS_PER_PAGE } from "../../utils/AppConfig";
import { handleApiError, handleApiSuccess } from "../Common/ApiUtils";
import { formatDate } from "../Common/DateUtils";
import LoadingSpinner from "../Common/LoadingSpinner";
import usePaginationState from "../Common/UsePaginationState";
import useInfiniteScroll from "../Common/UseInfiniteScroll";
import PaginationControls from "../Common/PaginationControls";

const SprintList = () => {
  // ------------------------------
  // View State
  // ------------------------------
  // Raw sprint list from backend.
  const [sprints, setSprints] = useState([]);

  // Full-page loader for initial fetch.
  const [loading, setLoading] = useState(true);

  // Search text from input box.
  const [searchTerm, setSearchTerm] = useState("");

  // Router helper for page navigation.
  const navigate = useNavigate();

  // Create sprint modal visibility.
  const [isCreateSprintModalOpen, setIsCreateSprintModalOpen] = useState(false);

  // Save-in-progress state for create modal submit button.
  const [savingSprint, setSavingSprint] = useState(false);

  // Persist pagination count in session storage across route revisits.
  const [visibleCount, setVisibleCount] =
    usePaginationState(`sprintList_count`);

  // Used by pagination controls to fade/show Load More near page bottom.
  const isAtBottom = useInfiniteScroll([sprints, visibleCount, searchTerm]);

  // ------------------------------
  // Data Loader: Sprint List
  // ------------------------------
  // Runs once on mount and hydrates the page with all sprint cards.
  useEffect(() => {
    const getSprints = async () => {
      try {
        // Show loader while requesting data.
        setLoading(true);

        // Fetch sprint list from API cache/network.
        const data = await fetchAllSprints();

        // Ensure state always receives an array.
        setSprints(data || []);
      } catch (err) {
        console.error(err);
        toast.error(err.message || "Failed to fetch sprints");
      } finally {
        // Stop loader regardless of success/failure.
        setLoading(false);
      }
    };

    // Execute loader immediately after component mounts.
    getSprints();
  }, []);

  // ------------------------------
  // Action Handler: Create Sprint
  // ------------------------------
  // Creates sprint via API, closes modal, clears caches, and updates list instantly.
  const handleSprintSave = async (newSprintData) => {
    // Lock submit while request is in progress.
    setSavingSprint(true);

    try {
      // Create sprint in backend.
      const createdSprint = await createSprint(newSprintData);

      // Close modal after successful save.
      setIsCreateSprintModalOpen(false);

      // Invalidate related API caches used by other pages/components.
      clearAllCaches();

      // Optimistic local update to avoid re-fetch.
      setSprints((prevSprints) => [...prevSprints, createdSprint]);

      // User feedback toast.
      handleApiSuccess("Sprint created successfully");
    } catch (error) {
      // Unified API error handling with toast.
      handleApiError(error, "Failed to create Sprint");
    } finally {
      // Re-enable submit button.
      setSavingSprint(false);
    }
  };

  // Opens sprint stories page for selected sprint card.
  const handleSprintClick = (sprintId) => {
    navigate(`/sprints/${sprintId}/stories`);
  };

  // ------------------------------
  // Derived Data: Filter + Sort
  // ------------------------------
  // 1) Apply case-insensitive name search.
  // 2) Sort descending with numeric-aware locale compare.
  const filtered = useMemo(() => {
    const search = searchTerm.trim().toLowerCase();

    return (
      sprints
        ?.filter((item) => {
          // If search is empty, keep every sprint.
          if (!search) return true;

          // Compare normalized sprint name.
          const sprintName = item.name?.toLowerCase() || "";
          return sprintName.includes(search);
        })
        .sort((a, b) => {
          // Sort by sprint name in descending order.
          const nameA = a.name || "";
          const nameB = b.name || "";
          return nameB.localeCompare(nameA, undefined, {
            numeric: true,
            sensitivity: "base",
          });
        }) || []
    );
  }, [sprints, searchTerm]);

  // Apply pagination limit to filtered list.
  const visibleSprints = useMemo(() => {
    return filtered.slice(0, visibleCount);
  }, [filtered, visibleCount]);

  // Render spinner while first load is happening.
  if (loading) return <LoadingSpinner />;

  // ------------------------------
  // Render
  // ------------------------------
  return (
    <div className="sprint-container">
      {/* Header row: title + search + add sprint action. */}
      <div className="sprint-container2">
        <h3 className="sprint-title">Sprint List</h3>
        <div className="sprint-search-header">
          <input
            type="text"
            className="sprint-search-input"
            placeholder="Search"
            value={searchTerm}
            onChange={(e) => {
              setSearchTerm(e.target.value);
              setVisibleCount(ITEMS_PER_PAGE);
            }}
          />

          {/* Opens create sprint modal. */}
          <button
            onClick={() => setIsCreateSprintModalOpen(true)}
            className="create-sprint-button"
          >
            Add Sprint
          </button>
        </div>
      </div>

      {/* Sprint cards grid. */}
      <div className="sprint-grid">
        {/* Render cards when data exists; otherwise render empty-state text. */}
        {visibleSprints.length > 0 ? (
          visibleSprints.map((sprint) => (
            <a
              key={sprint._id}
              onClick={() => handleSprintClick(sprint._id)}
              className="sprint-card"
              style={{
                textDecoration: "none",
                color: "inherit",
              }}
            >
              {/* Sprint primary label. */}
              <span className="sprint-card-name">{sprint.name}</span>

              {/* Optional date range section when at least one date exists. */}
              {(sprint.startDate || sprint.endDate) && (
                <span className="sprint-card-dates">
                  {sprint.startDate ? formatDate(sprint.startDate) : "TBD"}
                  {" - "}
                  {sprint.endDate ? formatDate(sprint.endDate) : "TBD"}
                </span>
              )}
            </a>
          ))
        ) : (
          <p
            style={{
              color: "#64748b",
              marginTop: "20px",
              textAlign: "center",
              width: "100%",
            }}
          >
            No sprints found.
          </p>
        )}
      </div>

      {/* Shared load-more/back-to-top footer controls. */}
      <PaginationControls
        filteredItems={filtered}
        visibleCount={visibleCount}
        setVisibleCount={setVisibleCount}
        isAtBottom={isAtBottom}
      />

      {/* Create sprint modal wired to save handler and duplicate-name context. */}
      <SprintModal
        isOpen={isCreateSprintModalOpen}
        onClose={() => setIsCreateSprintModalOpen(false)}
        initialData={null}
        handleSave={handleSprintSave}
        saving={savingSprint}
        existingSprints={sprints}
      />
    </div>
  );
};
export default SprintList;
