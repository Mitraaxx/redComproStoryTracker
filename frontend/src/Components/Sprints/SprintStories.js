import React, { useEffect, useState } from "react";
import {
  fetchSprintStories,
  clearAllCaches,
  updateSprint,
  createStory,
  fetchStoryDetails,
  updateStory,
  fetchAllReleases,
} from "../../Api/api";
import { MdArrowBack, MdEdit } from "react-icons/md";
import { HashLoader } from "react-spinners";
import { useParams, useNavigate } from "react-router-dom";
import "../Sprints/SprintStories.css";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import AddExistingStoryModal from "../Modals/AddExistingStoryModal";
import { ITEMS_PER_PAGE } from "../../utils/AppConfig";
import StoryFilter from "../Tools/StoryFilter";
import StoryModal from "../Modals/StoryModal";
import SprintModal from "../Modals/SprintModal";


/**
 * Component to manage and display all stories associated with a specific Sprint.
 * Handles fetching, creating, editing, and assigning stories to the sprint.
 */
const SprintStories = () => {
  const [stories, setStories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [sprint, setSprint] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  const { sprintId } = useParams();
  const navigate = useNavigate();

  const [isSprintModalOpen, setIsSprintModalOpen] = useState(false);
  const [savingSprint, setSavingSprint] = useState(false);

  const [isCreateStoryModalOpen, setIsCreateStoryModalOpen] = useState(false);
  const [creatingStory, setCreatingStory] = useState(false);

  const [isAddExistingModalOpen, setIsAddExistingModalOpen] = useState(false);
  const [releasesList, setReleasesList] = useState([]);

  // For load more at bottom
  const [isAtBottom, setIsAtBottom] = useState(false);

  // states for filtering
  const [activeFilters, setActiveFilters] = useState({
    assignee: "",
    status: "",
    qaRelDate: "",
    apps: "",
  });

  /**
   * Initializes the visible count for pagination from session storage to persist user state,
   * falling back to the default ITEMS_PER_PAGE if no cache exists.
   */
  const [visibleCount, setVisibleCount] = useState(() => {
    const savedCount = sessionStorage.getItem(`sprint_${sprintId}_count`);
    return savedCount ? parseInt(savedCount, 10) : ITEMS_PER_PAGE;
  });

  // Universal function to check scroll as well as height(for big viewport)
  const checkBottom = () => {
    const windowHeight = window.innerHeight;
    const scrollY = window.scrollY;
    const documentHeight = document.documentElement.scrollHeight;

    if (
      documentHeight <= windowHeight + 10 ||
      windowHeight + scrollY >= documentHeight - 50
    ) {
      setIsAtBottom(true);
    } else {
      setIsAtBottom(false);
    }
  };

  /**
   * Effect hook to manage scroll and resize events
   */
  useEffect(() => {
    window.addEventListener("scroll", checkBottom);
    window.addEventListener("resize", checkBottom);

    checkBottom();

    return () => {
      window.removeEventListener("scroll", checkBottom);
      window.removeEventListener("resize", checkBottom);
    };
  }, []);

  /**
   * Effect hook to make sure whenever the data changes to
   * recalculate the height
   */
  useEffect(() => {
    const timeout = setTimeout(() => {
      checkBottom();
    }, 100);
    return () => clearTimeout(timeout);
  }, [stories, visibleCount, searchTerm, activeFilters]);

  // This function apply filtering in the stories
  const handleApplyFilter = (newFilters) => {
    setActiveFilters(newFilters);
    setVisibleCount(ITEMS_PER_PAGE);
  };

  /**
   * Effect hook to synchronize the current visible count with session storage
   * whenever the user clicks "Load More".
   */
  useEffect(() => {
    sessionStorage.setItem(`sprint_${sprintId}_count`, visibleCount);
  }, [visibleCount, sprintId]);

  /**
   * Effect hook to fetch the specific sprint details and its associated stories
   * when the component mounts or the sprintId changes.
   */
  useEffect(() => {
    const getStories = async () => {
      try {
        setLoading(true);
        const data = await fetchSprintStories(sprintId);
        setStories(data.stories);
        setSprint(data.sprint);
      } catch (err) {
        console.log(err);
      } finally {
        setLoading(false);
      }
    };
    if (sprintId) {
      getStories();
    }
  }, [sprintId]);

  if (loading) {
    return (
      <div
        style={{
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          height: "100vh",
        }}
      >
        <HashLoader color="#007bff" size={80} />
      </div>
    );
  }

  /**
   * Navigates to the detailed view page of a specific story.
   */
  const handleStoryClick = (storyDbId) => {
    navigate(`/sprints/${sprintId}/stories/${storyDbId}`);
  };

  /**
   * Navigates the user back to the main sprints list.
   */
  const handleBack = () => {
    navigate("/sprints");
  };


  /**
   * Submits the updated sprint information to the backend API.
   * Prevents unnecessary API calls if no data has been modified.
   */
  const handleSprintSave = async (updatedSprintData) => {
    setSavingSprint(true);
    try {
      // Yahan api call jaayegi updated data ke sath
      await updateSprint(sprintId, updatedSprintData);

      setIsSprintModalOpen(false);
      clearAllCaches();

      const updatedData = await fetchSprintStories(sprintId, true);
      setStories(updatedData.stories);
      setSprint(updatedData.sprint);

      toast.success("Sprint Updated Successfully");
    } catch (error) {
      console.error("Sprint Save error:", error);
      toast.error("Sprint Name already exists or failed to update");
    } finally {
      setSavingSprint(false);
    }
  };

  /**
   * Handles the creation of a new story linked directly to this sprint.
   * Sends data to the API, clears caches, and refreshes the story list.
   */
  const handleCreateNewStory = async (storyDataWithApps) => {
    setCreatingStory(true);
    try {
      await createStory(storyDataWithApps);

      setIsCreateStoryModalOpen(false);
      clearAllCaches();

      setLoading(true);
      const updatedData = await fetchSprintStories(sprintId, true);
      setStories(updatedData.stories);
      setSprint(updatedData.sprint);
      setLoading(false);

      toast.success("Story created successfully");
    } catch (error) {
      console.error(error);
      toast.error(error.message || "Failed to create story");
    } finally {
      setCreatingStory(false);
    }
  };

  /**
   * Associates an existing, orphaned story with the current sprint.
   */
  const handleSelectExistingStory = async (storyDbId) => {
    setIsAddExistingModalOpen(false);
    setLoading(true);
    try {
      const fullStory = await fetchStoryDetails(storyDbId, true);

      fullStory.sprintId = sprintId;
      fullStory.sprint = sprintId;
      fullStory.sprintName = sprint?.name;

      await updateStory(fullStory.storyId, fullStory);

      clearAllCaches();
      const updatedData = await fetchSprintStories(sprintId, true);
      setStories(updatedData.stories);
      setSprint(updatedData.sprint);

      toast.success("Story successfully moved to this Sprint");
    } catch (err) {
      console.error(err);
      toast.error(err.message || "Failed to move story to this sprint");
    } finally {
      setLoading(false);
    }
  };

  /**
   * Opens the "Create Story" modal and concurrently fetches prerequisite release data
   * to populate the dropdown menus inside the form.
   */
  const openCreateStoryModal = async () => {
    setIsCreateStoryModalOpen(true);

    try {
      const releasesData = await fetchAllReleases();
      if (releasesData) {
        setReleasesList(releasesData);
      }
    } catch (err) {
      console.error("Failed to fetch releases", err);
    }
  };

  /**
   * Filters the stories array based on the current search term,
   * checking multiple fields (Name, ID, Responsibility, Reviewer, Date, Points).
   * It subsequently sorts the results by Story ID in descending numerical order.
   * User Input ->  Update -> Array Test (Search + Filter) -> Sort -> Slice -> Render
   */
  const filtered =
    stories
      ?.filter((item) => {
        const search = searchTerm.trim().toLowerCase();
        const storyName = item.storyName?.toLowerCase() || "";
        const storyId = item.storyId?.toLowerCase() || "";
        const matchesSearch =
          storyName.includes(search) || storyId.includes(search);

        if (search && !matchesSearch) return false;

        if (
          activeFilters.assignee &&
          item.responsibility !== activeFilters.assignee
        )
          return false;
        if (activeFilters.status && item.status !== activeFilters.status)
          return false;

        if (activeFilters.qaRelDate) {
          if (!item.qaEnvRelDate) return false;

          const storyDate = new Date(item.qaEnvRelDate)
            .toISOString()
            .split("T")[0];
          if (storyDate !== activeFilters.qaRelDate) return false;
        }

        if (activeFilters.apps) {
          const selectedApp = activeFilters.apps;
          const hasLinkedApp = item.linkedApps?.some(
            (app) =>
              app.appName === selectedApp || app.appRef?.name === selectedApp,
          );
          if (!hasLinkedApp) {
            return false;
          }
        }

        return true;
      })
      .sort((a, b) => {
        const numA = parseInt(a.storyId?.match(/\d+/)?.[0] || "0", 10);
        const numB = parseInt(b.storyId?.match(/\d+/)?.[0] || "0", 10);
        return numB - numA;
      }) || [];

  const visibleStories = filtered.slice(0, visibleCount);

  /**
   * Utility function to smoothly scroll the window back to the top of the page.
   */
  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  return (
    <div className="sprint-story-container">
      <div className="extra-box" style={{ justifyContent: "flex-start" }}>
        <button onClick={handleBack} className="back-button">
          <MdArrowBack />
        </button>
      </div>
      <ToastContainer position="top-right" autoClose={3000} />
      <div className="sprint-story-container2">
        <section>
          <div className="sprint-title-group">
            <h3 className="sprint-story-title">{sprint?.name}</h3>
            <button
              onClick={() => setIsSprintModalOpen(true)}
              className="sprint-edit-btn"
              title="Edit Sprint"
            >
              <MdEdit/>
            </button>
          </div>
          <p className="sprint-date-badge">
            <strong>Start Date: </strong>
            {new Date(sprint?.startDate).toLocaleDateString("en-IN", {
              day: "2-digit",
              month: "short",
              year: "numeric",
            })}
          </p>
          <p className="sprint-date-badge">
            <strong>End Date: </strong>
            {new Date(sprint?.endDate).toLocaleDateString("en-IN", {
              day: "2-digit",
              month: "short",
              year: "numeric",
            })}
          </p>
          <p>
            <strong>Notes: </strong>
            {sprint?.sprintNotes}
          </p>
        </section>

        <section className="sprint-story-container3">
          <div className="story-search-header">
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
            <button
              className="btn-add-existing"
              onClick={() => setIsAddExistingModalOpen(true)}
            >
              Add Existing
            </button>
            <button className="create-story-btn" onClick={openCreateStoryModal}>
              New Story
            </button>
          </div>
        </section>
      </div>

      <div className="extra-box">
        <StoryFilter onApplyFilter={handleApplyFilter} />
      </div>

      <div className="sprint-story-grid">
        {visibleStories.map((story) => (
          <div
            key={story._id}
            onClick={() => handleStoryClick(story._id)}
            className="sprint-story-card"
          >
            <p>
              <strong>Story Name: </strong>
              {story?.storyName}
            </p>
            <p>
              <strong>Story ID: </strong> {story?.storyId}
            </p>
            <p>
              <strong>Assigned: </strong> {story?.responsibility}
            </p>
            <p>
              <strong>First Review: </strong> {story?.firstReview}
            </p>
            <p>
              <strong>Qa Release Date: </strong>
              {new Date(story?.qaEnvRelDate).toLocaleDateString("en-IN", {
                day: "2-digit",
                month: "short",
                year: "numeric",
              })}
            </p>
            <p>
              <strong>Story Points: </strong> {story?.storyPoints}
            </p>
            <div className="sprint-story-comments">
              <strong>Comments: </strong>
              <span>{story?.comments || "No comments."}</span>
            </div>
          </div>
        ))}
      </div>

      {filtered.length > ITEMS_PER_PAGE && (
        <div className="pagination-container">
          {visibleCount < filtered.length && (
            <button
              className="load-more-btn"
              onClick={() => setVisibleCount((prev) => prev + ITEMS_PER_PAGE)}
              style={{
                opacity: isAtBottom ? 1 : 0,
                pointerEvents: isAtBottom ? "auto" : "none",
                transition: "opacity 0.3s ease-in-out",
              }}
            >
              Load More
            </button>
          )}

          <button className="back-top-btn" onClick={scrollToTop}>
            ⬆
          </button>
        </div>
      )}

      <SprintModal
        isOpen={isSprintModalOpen}
        onClose={() => setIsSprintModalOpen(false)}
        initialData={sprint} 
        handleSave={handleSprintSave}
        saving={savingSprint}
      />

      <StoryModal
        isOpen={isCreateStoryModalOpen}
        onClose={() => setIsCreateStoryModalOpen(false)}
        handleSave={handleCreateNewStory}
        releasesList={releasesList}
        saving={creatingStory}
        sprintId={sprintId}
        hideSprintField={true}
      />

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
