// App stories page.
//
// High-level flow:
// 1) Read appName from route.
// 2) Fetch stories linked to that app.
// 3) Apply dropdown filters + search.
// 4) Paginate and render story cards.
import { useEffect, useState, useMemo } from "react";
import { fetchAppStories } from "../../Api/Api";
import { MdArrowBack } from "react-icons/md";
import { useParams, useNavigate, useLocation } from "react-router-dom";
import "../Sprints/SprintStories.css";
import { ITEMS_PER_PAGE } from "../../utils/AppConfig";
import StoryFilter from "../Tools/StoryFilter";
import StoryGrid from "../Common/StoryGrid";
import LoadingSpinner from "../Common/LoadingSpinner";
import usePaginationState from "../Common/UsePaginationState";
import useInfiniteScroll from "../Common/UseInfiniteScroll";
import PaginationControls from "../Common/PaginationControls";
import { applyDropdownFilters, applySearchAndSort } from "../Common/SearchBar";
import { toast } from "react-toastify";

const AppStories = () => {
  // ------------------------------
  // View State
  // ------------------------------
  const [stories, setStories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [activeFilters, setActiveFilters] = useState({
    assignee: "",
    status: "",
    qaRelDate: "",
    apps: "",
  });
  const { appName } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const [visibleCount, setVisibleCount] = usePaginationState(
    `app_${appName}_count`,
  );
  const isAtBottom = useInfiniteScroll([
    stories,
    visibleCount,
    searchTerm,
    activeFilters,
  ]);

  // Receives filter values from StoryFilter and resets pagination.
  const handleApplyFilter = (newFilters) => {
    setActiveFilters(newFilters);
    setVisibleCount(ITEMS_PER_PAGE);
  };

  // Fetch stories whenever appName route param changes.
  useEffect(() => {
    const getStories = async () => {
      try {
        setLoading(true);
        const data = await fetchAppStories(appName);
        setStories(data?.stories || []);
      } catch (err) {
        console.error(err);
        toast.error(err);
      } finally {
        setLoading(false);
      }
    };
    if (appName) getStories();
  }, [appName]);

  // Apply filter/search pipeline.
  const dropdownFilteredStories = useMemo(
    () => applyDropdownFilters(stories, activeFilters),
    [stories, activeFilters],
  );
  const filtered = useMemo(
    () => applySearchAndSort(dropdownFilteredStories, searchTerm),
    [dropdownFilteredStories, searchTerm],
  );
  const visibleStories = filtered.slice(0, visibleCount);

  if (loading) return <LoadingSpinner />;

  return (
    <div className="sprint-story-container">
      <div
        className="extra-box"
        style={{
          justifyContent: "flex-start",
        }}
      >
        <button
          onClick={() => navigate("/apps")}
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

      <div className="sprint-story-container2">
        <section>
          <div className="sprint-title-group">
            <h3 className="sprint-title">{appName}</h3>
          </div>
        </section>

        <section className="sprint-story-container3">
          <div className="story-search-header">
            <StoryFilter onApplyFilter={handleApplyFilter} />
            {/* Search input resets pagination for consistent first-page view. */}
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
          </div>
        </section>
      </div>

      <StoryGrid
        stories={visibleStories}
        onCardClick={(storyDbId) =>
          navigate(`/apps/${appName}/stories/${storyDbId}`, {
            state: { from: `${location.pathname}${location.search}` },
          })
        }
        gridClassName="story-grid"
        cardClassName="story-card"
        emptyMessage="No stories linked to this app yet."
      />

      <PaginationControls
        filteredItems={filtered}
        visibleCount={visibleCount}
        setVisibleCount={setVisibleCount}
        isAtBottom={isAtBottom}
      />
    </div>
  );
};
export default AppStories;
