// Story list page.
//
// High-level flow:
// 1) Fetch all stories on mount.
// 2) Apply dropdown filters + search text in memory.
// 3) Paginate visible cards with persisted session state.
// 4) Create new stories via modal and prepend them to list.
// 5) Navigate to story details on card click.
import { useEffect, useState, useMemo } from "react";
import {
  fetchAllStories,
  fetchAllSprints,
  createStory,
  clearAllCaches,
  fetchAllReleases,
} from "../../Api/api";
import { MdArrowBack } from "react-icons/md";
import { useNavigate } from "react-router-dom";
import "../Stories/StoryList.css";
import { toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import { ITEMS_PER_PAGE } from "../../utils/AppConfig";
import StoryFilter from "../Tools/StoryFilter";
import StoryModal from "../Modals/StoryModal";
import StoryGrid from "../Common/StoryGrid";
import LoadingSpinner from "../Common/LoadingSpinner";
import usePaginationState from "../Common/usePaginationState";
import useInfiniteScroll from "../Common/useInfiniteScroll";
import PaginationControls from "../Common/PaginationControls";
import { applyDropdownFilters, applySearchAndSort } from "../Common/searchBar";

const StoryList = () => {
  // ------------------------------
  // View State
  // ------------------------------
  // Master story array used for filter/search/pagination.
  const [stories, setStories] = useState([]);

  // Full-page loader for initial fetch.
  const [loading, setLoading] = useState(true);

  // Search text from header input.
  const [searchTerm, setSearchTerm] = useState("");

  // Advanced filter values managed by StoryFilter.
  const [activeFilters, setActiveFilters] = useState({
    assignee: "",
    status: "",
    qaRelDate: "",
    apps: "",
  });

  // Reference datasets used by create modal dropdowns.
  const [sprintsList, setSprintsList] = useState([]);
  const [releasesList, setReleasesList] = useState([]);

  // Create story modal state.
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [creatingStory, setCreatingStory] = useState(false);

  // Router helper for back/detail navigation.
  const navigate = useNavigate();

  // Persist number of visible cards across navigations.
  const [visibleCount, setVisibleCount] = usePaginationState(`storyList_count`);

  // Used by pagination controls to manage load-more visibility near bottom.
  // These all inputs are dependency according to which the isAtBottom re-renders
  const isAtBottom = useInfiniteScroll([
    stories,
    visibleCount,
    searchTerm,
    activeFilters,
  ]);

  // ------------------------------
  // Handler: Apply Dropdown Filters
  // ------------------------------
  // Called by StoryFilter; resets pagination after filter change.
  const handleApplyFilter = (newFilters) => {
    setActiveFilters(newFilters);
    setVisibleCount(ITEMS_PER_PAGE);
  };

  // ------------------------------
  // Data Loader: Stories
  // ------------------------------
  // Fetches full story list for this page.
  const getStories = async () => {
    try {
      setLoading(true);
      const data = await fetchAllStories();
      setStories(data || []);
    } catch (err) {
      console.error(err);
      toast.error(err.message || "Failed to fetch stories");
    } finally {
      setLoading(false);
    }
  };

  // Initial page load.
  useEffect(() => {
    getStories();
  }, []);

  // ------------------------------
  // Handler: Create Story
  // ------------------------------
  // Persists new story, updates UI, and closes modal.
  const handleCreateNewStory = async (storyDataWithApps) => {
    setCreatingStory(true);
    try {
      const createdStory = await createStory(storyDataWithApps);
      setStories((prev) => [createdStory, ...prev]);
      setIsCreateModalOpen(false);
      clearAllCaches();
      toast.success("Story created successfully");
    } catch (error) {
      console.error(error);
      toast.error(error.message || "Failed to create story");
    } finally {
      setCreatingStory(false);
    }
  };

  // ------------------------------
  // Modal Prep: Open Create Story
  // ------------------------------
  // Preloads sprints and releases for dropdowns inside create modal.
  const openNewStoryModal = async () => {
    setIsCreateModalOpen(true);
    try {
      const [sprintsData, releasesData] = await Promise.all([
        fetchAllSprints(),
        fetchAllReleases(),
      ]);
      if (sprintsData) setSprintsList(sprintsData);
      if (releasesData) setReleasesList(releasesData);
    } catch (err) {
      console.error(err);
      toast.error(err.message || "Failed to fetch required data");
    }
  };

  // Navigate to details page for selected story card.
  const handleStoryClick = (storyDbId) => {
    navigate(`/stories/${storyDbId}`);
  };

  // ------------------------------
  // Derived Data Pipeline
  // ------------------------------
  // Step 1: apply dropdown filters.
  const dropdownFilteredStories = useMemo(
    () => applyDropdownFilters(stories, activeFilters),
    [stories, activeFilters],
  );

  // Step 2: apply search and default sorting.
  const filtered = useMemo(
    () => applySearchAndSort(dropdownFilteredStories, searchTerm),
    [dropdownFilteredStories, searchTerm],
  );

  // Step 3: apply pagination limit.
  const visibleStories = filtered.slice(0, visibleCount);

  // Show full-page loader during initial fetch.
  if (loading) return <LoadingSpinner />;

  // ------------------------------
  // Render
  // ------------------------------
  return (
    <div className="story-container">
      {/* Header section: title, filters, search, and create action. */}
      <div className="story-container2">
        <h3 className="story-title">Story List</h3>
        <div className="story-search-header">
          {/* Dropdown filter panel for assignee/status/date/apps. */}
          <StoryFilter onApplyFilter={handleApplyFilter} />

          {/* Search input also resets pagination to first chunk. */}
          <input
            type="text"
            className="story-search-input"
            placeholder="Search"
            value={searchTerm}
            onChange={(e) => {
              setSearchTerm(e.target.value);
              setVisibleCount(ITEMS_PER_PAGE);
            }}
          />

          {/* Open modal to create a new story. */}
          <button className="create-story-btn" onClick={openNewStoryModal}>
            New Story
          </button>
        </div>
      </div>

      {/* Story cards grid for currently visible subset. */}
      <StoryGrid
        stories={visibleStories}
        onCardClick={handleStoryClick}
        gridClassName="story-grid"
        cardClassName="story-card"
        emptyMessage="No stories found."
      />

      {/* Shared load-more and back-to-top controls. */}
      <PaginationControls
        filteredItems={filtered}
        visibleCount={visibleCount}
        setVisibleCount={setVisibleCount}
        isAtBottom={isAtBottom}
      />

      {/* Create story modal with all required reference data. */}
      <StoryModal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        handleSave={handleCreateNewStory}
        releasesList={releasesList}
        saving={creatingStory}
        sprintsList={sprintsList}
        initialSprintName=""
        existingStories={stories}
      />
    </div>
  );
};
export default StoryList;
