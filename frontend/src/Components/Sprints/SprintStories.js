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
import EditSprintModal from "../Modals/EditSprintModal";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import CreateStoryModal from "../Modals/CreateStoryModal";
import AddExistingStoryModal from "../Modals/AddExistingStoryModal";
import { ITEMS_PER_PAGE } from "../../utils/AppConfig";
import StoryFilter from "../Tools/StoryFilter";

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
  const [sprintFormData, setSprintFormData] = useState({});
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
   * Utility function to format a raw ISO date string into a standard "YYYY-MM-DD" format
   * suitable for HTML date input fields.
   */
  const formatDateForInput = (dateString) => {
    if (!dateString) return "";
    return new Date(dateString).toISOString().split("T")[0];
  };

  /**
   * Populates the sprint edit form with current sprint data and opens the edit modal.
   */
  const openSprintEditModal = () => {
    setSprintFormData({
      name: sprint?.name || "",
      startDate: formatDateForInput(sprint?.startDate),
      endDate: formatDateForInput(sprint?.endDate),
      sprintNotes: sprint?.sprintNotes || "",
    });
    setIsSprintModalOpen(true);
  };

  /**
   * Handles input changes within the sprint edit modal form.
   */
  const handleSprintChange = (e) => {
    setSprintFormData({ ...sprintFormData, [e.target.name]: e.target.value });
  };

  /**
   * Submits the updated sprint information to the backend API.
   * Prevents unnecessary API calls if no data has been modified.
   */
  const handleSprintSave = async (e) => {
    e.preventDefault();
    const isNameSame = (sprintFormData.name || "") === (sprint?.name || "");
    const isStartSame =
      (sprintFormData.startDate || "") ===
      formatDateForInput(sprint?.startDate);
    const isEndSame =
      (sprintFormData.endDate || "") === formatDateForInput(sprint?.endDate);
    const isNotesSame =
      (sprintFormData.sprintNotes || "") === (sprint?.sprintNotes || "");

    if (isNameSame && isStartSame && isEndSame && isNotesSame) {
      console.log("No sprint changes detected. Skipping API call.");
      setIsSprintModalOpen(false);
      return;
    }

    setSavingSprint(true);
    try {
      await updateSprint(sprintId, sprintFormData);

      setIsSprintModalOpen(false);
      clearAllCaches();

      const updatedData = await fetchSprintStories(sprintId, true);
      setStories(updatedData.stories);
      setSprint(updatedData.sprint);

      toast.success("Update Successful");
    } catch (error) {
      console.error("Sprint Save error:", error);
      toast.error("Sprint Name exists");
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
      <ToastContainer position="top-right" autoClose={3000} />
      <div className="sprint-story-container2">
        <section>
          <div className="sprint-title-group">
            <h2 className="sprint-story-title">{sprint?.name}</h2>
            <button
              onClick={openSprintEditModal}
              className="sprint-edit-btn"
              title="Edit Sprint"
            >
              <MdEdit size={15} />
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

          <button onClick={handleBack} className="back-button">
            <MdArrowBack />
          </button>
        </section>
      </div>

      <div className="filter-box">
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

      <EditSprintModal
        isOpen={isSprintModalOpen}
        onClose={() => setIsSprintModalOpen(false)}
        sprintFormData={sprintFormData}
        handleSprintChange={handleSprintChange}
        handleSprintSave={handleSprintSave}
        saving={savingSprint}
      />

      <CreateStoryModal
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
