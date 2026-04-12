// Sprint stories page.
//
// High-level flow:
// 1) Read sprintId from route.
// 2) Fetch sprint details and its stories.
// 3) Support search + dropdown filtering + pagination.
// 4) Support editing sprint, creating story, and adding existing story.
// 5) Keep UI in sync with local state updates after successful actions.
import { useEffect, useState, useMemo } from "react";
import {
  fetchSprintStories,
  clearAllCaches,
  updateSprint,
  createStory,
  updateStory,
  fetchAllReleases,
  fetchAllSprints,
  fetchAllStories,
} from "../../Api/api";
import { MdArrowBack, MdEdit } from "react-icons/md";
import { useParams, useNavigate } from "react-router-dom";
import "../Sprints/SprintStories.css";
import { toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import AddExistingStoryModal from "../Modals/AddExistingStoryModal";
import StoryFilter from "../Tools/StoryFilter";
import StoryModal from "../Modals/StoryModal";
import SprintModal from "../Modals/SprintModal";
import { ITEMS_PER_PAGE } from "../../utils/AppConfig";
import { handleApiError, handleApiSuccess } from "../Common/apiUtils";
import { formatDate } from "../Common/dateUtils";
import LoadingSpinner from "../Common/LoadingSpinner";
import usePaginationState from "../Common/usePaginationState";
import useInfiniteScroll from "../Common/useInfiniteScroll";
import PaginationControls from "../Common/PaginationControls";
import StoryGrid from "../Common/StoryGrid";
import { applyDropdownFilters, applySearchAndSort } from "../Common/searchBar";

const SprintStories = () => {
  // ------------------------------
  // View State
  // ------------------------------
  // Stories currently linked to the selected sprint.
  const [stories, setStories] = useState([]);

  // Full-page loader for initial fetch and some move operations.
  const [loading, setLoading] = useState(true);

  // Sprint header object containing name, dates, notes.
  const [sprint, setSprint] = useState("");

  // Search text for quick filtering by story fields.
  const [searchTerm, setSearchTerm] = useState("");

  // Route parameter identifying current sprint context.
  const { sprintId } = useParams();

  // Navigation helper for detail/back routes.
  const navigate = useNavigate();

  // Sprint edit modal states.
  const [isSprintModalOpen, setIsSprintModalOpen] = useState(false);
  const [savingSprint, setSavingSprint] = useState(false);

  // New story modal states.
  const [isCreateStoryModalOpen, setIsCreateStoryModalOpen] = useState(false);
  const [creatingStory, setCreatingStory] = useState(false);

  // Add existing story modal visibility.
  const [isAddExistingModalOpen, setIsAddExistingModalOpen] = useState(false);

  // Reference datasets for modal dropdowns/validation.
  const [releasesList, setReleasesList] = useState([]);
  const [allSprints, setAllSprints] = useState([]);
  const [allStories, setAllStories] = useState([]);

  // Dropdown filter state consumed by StoryFilter.
  const [activeFilters, setActiveFilters] = useState({
    assignee: "",
    status: "",
    qaRelDate: "",
    apps: "",
  });

  // Persist visible count with sprint-specific key.
  const [visibleCount, setVisibleCount] = usePaginationState(
    `sprint_${sprintId}_count`,
  );

  // Used by pagination controls to animate Load More visibility.
  const isAtBottom = useInfiniteScroll([
    stories,
    visibleCount,
    searchTerm,
    activeFilters,
  ]);

  // ------------------------------
  // Handler: Apply Filters
  // ------------------------------
  // Receives filter object from StoryFilter and resets page size.
  const handleApplyFilter = (newFilters) => {
    setActiveFilters(newFilters);
    setVisibleCount(ITEMS_PER_PAGE);
  };

  // ------------------------------
  // Modal Prep: Edit Sprint
  // ------------------------------
  // Preloads all sprint names to support duplicate validation in modal.
  const openEditSprintModal = async () => {
    setIsSprintModalOpen(true);
    try {
      const data = await fetchAllSprints();
      if (data) setAllSprints(data);
    } catch (err) {
      console.error("Failed to fetch all sprints for validation", err);
    }
  };

  // ------------------------------
  // Data Loader: Sprint + Stories
  // ------------------------------
  // Fetches sprint summary and linked stories when sprintId changes.
  useEffect(() => {
    const getStories = async () => {
      try {
        setLoading(true);

        // API returns object containing sprint metadata + stories array.
        const data = await fetchSprintStories(sprintId);
        setStories(data.stories);
        setSprint(data.sprint);
      } catch (err) {
        console.error(err);
        toast.error(err);
      } finally {
        setLoading(false);
      }
    };

    // Guard and execute for valid route id.
    if (sprintId) getStories();
  }, [sprintId]);

  // Navigate to a specific story detail under current sprint route.
  const handleStoryClick = (storyDbId) => {
    navigate(`/sprints/${sprintId}/stories/${storyDbId}`);
  };

  // ------------------------------
  // Handler: Save Sprint Changes
  // ------------------------------
  // Accepts modal payload and updates sprint details when in edit mode.
  const handleSprintSave = async (payload) => {
    // Lock modal save action during request.
    setSavingSprint(true);

    try {
      const { isEditMode, changedFields } = payload;

      // Only call update endpoint for edit mode payloads.
      if (isEditMode) {
        await updateSprint(sprintId, changedFields);

        // Reflect updated fields in local sprint header without refetch.
        setSprint((prev) => ({
          ...prev,
          ...changedFields,
        }));
      }

      // Close modal and invalidate shared caches after success.
      setIsSprintModalOpen(false);
      clearAllCaches();

      handleApiSuccess("Sprint Updated Successfully");
    } catch (error) {
      handleApiError(error, "Sprint Name already exists or failed to update");
    } finally {
      // Re-enable save controls.
      setSavingSprint(false);
    }
  };

  // ------------------------------
  // Handler: Create New Story
  // ------------------------------
  // Creates story in backend and appends it to current list.
  const handleCreateNewStory = async (storyDataWithApps) => {
    // Lock modal submit while creating.
    setCreatingStory(true);

    try {
      // Persist story.
      const createdStory = await createStory(storyDataWithApps);

      // Append locally for immediate UI update.
      setStories((prev) => [...prev, createdStory]);

      // Close create modal and clear cross-page caches.
      setIsCreateStoryModalOpen(false);
      clearAllCaches();

      handleApiSuccess("Story created successfully");
    } catch (error) {
      handleApiError(error, "Failed to create story");
    } finally {
      setCreatingStory(false);
    }
  };

  // ------------------------------
  // Handler: Add Existing Story
  // ------------------------------
  // Reassigns selected story to this sprint and updates list state.
  const handleSelectExistingStory = async (selectedStory) => {
    setIsAddExistingModalOpen(false);
    setLoading(true);

    try {
      // Update story sprint linkage in backend.
      await updateStory(selectedStory.storyId, {
        sprintId,
        sprint: sprintId,
        sprintName: sprint?.name,
      });

      // Clear shared caches used elsewhere.
      clearAllCaches();

      // Reflect moved story in current grid.
      setStories((prev) => [
        ...prev,
        {
          ...selectedStory,
          sprintId,
          sprint: sprintId,
          sprintName: sprint?.name,
        },
      ]);


      handleApiSuccess("Story successfully moved to this Sprint");
    } catch (err) {
      handleApiError(err, "Failed to move story to this sprint");
    } finally {
      setLoading(false);
    }
  };

  // ------------------------------
  // Modal Prep: Create Story
  // ------------------------------
  // Preloads releases and all stories required by StoryModal.
  const openCreateStoryModal = async () => {
    // Open modal first for quick perceived response.
    setIsCreateStoryModalOpen(true);

    try {
      // Load reference datasets in parallel.
      const [releasesData, storiesData] = await Promise.all([
        fetchAllReleases(),
        fetchAllStories(),
      ]);

      // Store datasets when available.
      if (releasesData) setReleasesList(releasesData);
      if (storiesData) setAllStories(storiesData);
    } catch (err) {
      console.error("Failed to fetch modal data", err);
    }
  };

  // ------------------------------
  // Derived Data: Filtering + Search + Sort
  // ------------------------------
  // Step 1: apply dropdown filters (assignee/status/date/apps).
  const dropdownFilteredStories = useMemo(() => {
    return applyDropdownFilters(stories, activeFilters);
  }, [stories, activeFilters]);

  // Step 2: apply text search and standard sort order.
  const filtered = useMemo(() => {
    return applySearchAndSort(dropdownFilteredStories, searchTerm);
  }, [dropdownFilteredStories, searchTerm]);

  // Step 3: apply pagination limit.
  const visibleStories = filtered.slice(0, visibleCount);

  // Initial loading guard.
  if (loading) return <LoadingSpinner />;

  // ------------------------------
  // Render
  // ------------------------------
  return (
    <div className="sprint-story-container">
      {/* Top bar with back button to sprint list. */}
      <div
        className="extra-box"
        style={{
          justifyContent: "flex-start",
        }}
      >
        {/* Navigate back to sprint list root. */}
        <button
          onClick={() => navigate("/sprints")}
          className="back-button"
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <MdArrowBack />
        </button>
      </div>

      {/* Sprint header section showing sprint metadata and actions. */}
      <div className="sprint-story-container2">
        <section>
          <div className="sprint-title-group">
            <h3 className="sprint-story-title">{sprint?.name}</h3>

            {/* Opens sprint edit modal. */}
            <button
              onClick={openEditSprintModal}
              className="sprint-edit-btn"
              title="Edit Sprint"
            >
              <MdEdit />
            </button>
          </div>

          {/* Sprint timeline and notes fields. */}
          <p className="sprint-date-badge">
            <strong>Start Date: </strong>
            {sprint?.startDate ? formatDate(sprint.startDate) : "TBD"}
          </p>
          <p className="sprint-date-badge">
            <strong>End Date: </strong>
            {sprint?.endDate ? formatDate(sprint.endDate) : "TBD"}
          </p>
          <p>
            <strong>Notes: </strong>
            {sprint?.sprintNotes}
          </p>
        </section>

        {/* Search + story actions section. */}
        <section className="sprint-story-container3">
          <div className="story-search-header">
            <input
              type="text"
              className="story-search-input"
              placeholder="Search"
              value={searchTerm}
              onChange={(e) => {
                // Update search and reset pagination to first page window.
                setSearchTerm(e.target.value);
                setVisibleCount(ITEMS_PER_PAGE);
              }}
            />

            {/* Open modal to attach an existing story to this sprint. */}
            <button
              className="btn-add-existing"
              onClick={() => setIsAddExistingModalOpen(true)}
            >
              Add Existing
            </button>

            {/* Open modal to create a new story directly in this sprint. */}
            <button className="create-story-btn" onClick={openCreateStoryModal}>
              New Story
            </button>
          </div>
        </section>
      </div>

      {/* Filter row for advanced dropdown-based filtering. */}
      <div className="extra-box">
        <StoryFilter onApplyFilter={handleApplyFilter} />
      </div>

      {/* Story cards grid for currently visible subset. */}
      <StoryGrid
        stories={visibleStories}
        onCardClick={handleStoryClick}
        gridClassName="story-grid"
        cardClassName="story-card"
        emptyMessage="No stories found for this sprint."
      />

      {/* Shared pagination footer controls. */}
      <PaginationControls
        filteredItems={filtered}
        visibleCount={visibleCount}
        setVisibleCount={setVisibleCount}
        isAtBottom={isAtBottom}
      />

      {/* Sprint edit modal. */}
      <SprintModal
        isOpen={isSprintModalOpen}
        onClose={() => setIsSprintModalOpen(false)}
        initialData={sprint}
        handleSave={handleSprintSave}
        saving={savingSprint}
        existingSprints={allSprints}
      />

      {/* New story creation modal scoped to this sprint. */}
      <StoryModal
        isOpen={isCreateStoryModalOpen}
        onClose={() => setIsCreateStoryModalOpen(false)}
        handleSave={handleCreateNewStory}
        releasesList={releasesList}
        saving={creatingStory}
        sprintId={sprintId}
        hideSprintField={true}
        existingStories={allStories}
      />

      {/* Existing story picker modal for linking a story into this sprint. */}
      <AddExistingStoryModal
        isOpen={isAddExistingModalOpen}
        onClose={() => setIsAddExistingModalOpen(false)}
        onSelectStory={handleSelectExistingStory}
        currentSprintStories={stories}
      />
    </div>
  );
};
export default SprintStories;
