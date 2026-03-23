import React, { useEffect, useState } from "react";
import {
  fetchReleaseStories,
  fetchStoryDetails,
  updateStory,
  clearAllCaches,
  updateRelease,
} from "../../Api/api";
import { MdArrowBack, MdEdit, MdClose } from "react-icons/md";
import { HashLoader } from "react-spinners";
import { useParams, useNavigate } from "react-router-dom";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import AddExistingStoryModal from "../Modals/AddExistingStoryModal";
import EditReleaseModal from "../Modals/EditReleaseModal";
import "../Sprints/SprintStories.css";
import { APPS_CONFIG, ITEMS_PER_PAGE } from "../../utils/AppConfig";
import ReleasePrModal from "../Modals/ReleasePrModal";
import MasterPrModal from "../Modals/MasterPrModal";
import AlphaPrModal from "../Modals/AlphaPrModal";
import HFXPrModal from "../Modals/HFXPrModal";
import StoryFilter from "../Tools/StoryFilter";

/**
 * Component to manage and display stories tied to a specific Release.
 * Handles manual app additions, existing story linking, and triggering global PRs for the release.
 */
const ReleaseStories = () => {
  const [stories, setStories] = useState([]);
  const [release, setRelease] = useState(null);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");

  const [isAddExistingModalOpen, setIsAddExistingModalOpen] = useState(false);

  const [isReleaseModalOpen, setIsReleaseModalOpen] = useState(false);
  const [releaseFormData, setReleaseFormData] = useState({});
  const [savingRelease, setSavingRelease] = useState(false);

  const [newManualApp, setNewManualApp] = useState("");

  const [isPrModalOpen, setIsPrModalOpen] = useState(false);
  const [selectedStoryForPr, setSelectedStoryForPr] = useState(null);

  const [isMasterModalOpen, setIsMasterModalOpen] = useState(false);
  const [isAlphaModalOpen, setIsAlphaModalOpen] = useState(false);
  const [isHFXModalOpen, setIsHFXModalOpen] = useState(false);

  // For load more at bottom
  const [isAtBottom, setIsAtBottom] = useState(false);

  const { releaseId } = useParams();
  const navigate = useNavigate();

  /**
   * Initializes and persists pagination limits in session storage.
   */
  const [visibleCount, setVisibleCount] = useState(() => {
    const savedCount = sessionStorage.getItem(`release_${releaseId}_count`);
    return savedCount ? parseInt(savedCount, 10) : ITEMS_PER_PAGE;
  });

  // New State for active filters
  const [activeFilters, setActiveFilters] = useState({
    assignee: "",
    status: "",
    qaRelDate: "",
  });

  // Function to apply filter
  const handleApplyFilter = (newFilters) => {
    setActiveFilters(newFilters);
    setVisibleCount(ITEMS_PER_PAGE);
  };

  useEffect(() => {
    sessionStorage.setItem(`release_${releaseId}_count`, visibleCount);
  }, [visibleCount, releaseId]);

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

  /**
   * Fetches specific release metadata and all stories associated with that release tag.
   */
  useEffect(() => {
    const getStories = async () => {
      try {
        setLoading(true);
        const data = await fetchReleaseStories(releaseId);
        setRelease(data.release);
        setStories(data.stories);
      } catch (err) {
        console.log(err);
      } finally {
        setLoading(false);
      }
    };
    if (releaseId) {
      getStories();
    }
  }, [releaseId]);

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
   * Dynamically aggregates a unique list of all applications that need to be deployed
   * in this release, combining apps inherently linked via stories with apps added manually.
   */
  const storyApps = stories.reduce((acc, story) => {
    if (Array.isArray(story.appsToBeDeployed)) {
      acc.push(...story.appsToBeDeployed);
    } else if (story.appsToBeDeployed) {
      acc.push(story.appsToBeDeployed);
    }
    return acc;
  }, []);
  const manualReleaseApps = release?.appsToBeDeployed || [];
  const combinedUniqueApps = [...new Set([...storyApps, ...manualReleaseApps])];

  const availableAppsForManualAdd = APPS_CONFIG.filter(
    (app) => !combinedUniqueApps.includes(app.repoName),
  );

  /**
   * Handles manually adding an application to the global release list.
   * Prevents duplicates and updates the release document via API.
   */
  const handleAddManualApp = async () => {
    if (!newManualApp.trim()) return;

    if (
      manualReleaseApps.includes(newManualApp.trim()) ||
      storyApps.includes(newManualApp.trim())
    ) {
      setNewManualApp("");
      return;
    }

    const updatedApps = [...manualReleaseApps, newManualApp.trim()];

    try {
      const payload = {
        name: release.name,
        releaseDate: release.releaseDate,
        category: release.category,
        appsToBeDeployed: updatedApps,
      };

      await updateRelease(releaseId, payload);
      clearAllCaches();

      const updatedData = await fetchReleaseStories(releaseId);
      setRelease(updatedData.release);
      setStories(updatedData.stories);
      setNewManualApp("");
      toast.success("App added to release");
    } catch (err) {
      console.error(err);
      toast.error("Failed to add app");
    }
  };

  /**
   * Handles removing a manually added application from the release.
   * Note: Applications attached via specific stories cannot be removed here.
   */
  const handleRemoveManualApp = async (appToRemove) => {
    const updatedApps = manualReleaseApps.filter((app) => app !== appToRemove);

    try {
      const payload = {
        name: release.name,
        releaseDate: release.releaseDate,
        category: release.category,
        appsToBeDeployed: updatedApps,
      };

      await updateRelease(releaseId, payload);
      clearAllCaches();

      const updatedData = await fetchReleaseStories(releaseId);
      setRelease(updatedData.release);
      setStories(updatedData.stories);
      toast.success("App removed from release");
    } catch (err) {
      console.error(err);
      toast.error("Failed to remove app");
    }
  };

  /**
   * Associates an existing, standalone story directly with this release.
   */
  const handleSelectExistingStory = async (storyDbId) => {
    setIsAddExistingModalOpen(false);
    setLoading(true);
    try {
      const fullStory = await fetchStoryDetails(storyDbId, true);
      fullStory.releaseTag = release?.name;

      if (fullStory.sprint) {
        fullStory.sprintId = fullStory.sprint._id || fullStory.sprint;
      }

      await updateStory(fullStory.storyId, fullStory);

      clearAllCaches();
      const updatedData = await fetchReleaseStories(releaseId);
      setRelease(updatedData.release);
      setStories(updatedData.stories);

      toast.success("Story successfully added to this Release");
    } catch (err) {
      console.error(err);
      toast.error(err.message || "Failed to add story to this release");
    } finally {
      setLoading(false);
    }
  };

  const handleStoryClick = (storyDbId) => {
    navigate(`/releases/${releaseId}/stories/${storyDbId}`);
  };

  const handleBack = () => {
    navigate("/releases");
  };

  const formatDateForInput = (dateString) => {
    if (!dateString) return "";
    return new Date(dateString).toISOString().split("T")[0];
  };

  /**
   * Opens the Release Edit Modal, pre-filling it with the current release context.
   */
  const openReleaseEditModal = () => {
    setReleaseFormData({
      name: release?.name || "",
      releaseDate: formatDateForInput(release?.releaseDate),
      category: release?.category || "",
    });
    setIsReleaseModalOpen(true);
  };

  const handleReleaseChange = (e) => {
    setReleaseFormData({ ...releaseFormData, [e.target.name]: e.target.value });
  };

  /**
   * Saves metadata modifications to the release context (name, date, category).
   * Bypasses the API call if no changes were detected.
   */
  const handleReleaseSave = async (e) => {
    e.preventDefault();
    const isNameSame = (releaseFormData.name || "") === (release?.name || "");
    const isDateSame =
      (releaseFormData.releaseDate || "") ===
      formatDateForInput(release?.releaseDate);
    const isCatSame =
      (releaseFormData.category || "") === (release?.category || "");

    if (isNameSame && isDateSame && isCatSame) {
      setIsReleaseModalOpen(false);
      return;
    }

    setSavingRelease(true);
    try {
      await updateRelease(releaseId, releaseFormData);

      setIsReleaseModalOpen(false);
      clearAllCaches();

      const updatedData = await fetchReleaseStories(releaseId);
      setRelease(updatedData.release);
      setStories(updatedData.stories);

      toast.success("Release updated successfully");
    } catch (error) {
      console.error("Release Save error:", error);
      toast.error(error.message || "Release Name exists");
    } finally {
      setSavingRelease(false);
    }
  };

  /**
   * Filters stories based on the search query and orders them by ID number in descending order.
   */
  const filtered =
    stories
      ?.filter((item) => {
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

        const search = searchTerm.trim().toLowerCase();
        if (!search) return true;

        const storyName = item.storyName?.toLowerCase() || "";
        const storyId = item.storyId?.toLowerCase() || "";
        const responsibility = item.responsibility?.toLowerCase() || "";
        const firstReview = item.firstReview?.toLowerCase() || "";
        const releaseDate = item.qaEnvRelDate
          ? new Date(item.qaEnvRelDate)
              .toLocaleDateString("en-IN", {
                day: "2-digit",
                month: "short",
                year: "numeric",
              })
              .toLowerCase()
          : "";
        const storyPoints = item.storyPoints?.toString().toLowerCase() || "";

        return (
          storyName.includes(search) ||
          storyId.includes(search) ||
          responsibility.includes(search) ||
          firstReview.includes(search) ||
          releaseDate.includes(search) ||
          storyPoints.includes(search)
        );
      })
      .sort((a, b) => {
        const numA = parseInt(a.storyId?.match(/\d+/)?.[0] || "0", 10);
        const numB = parseInt(b.storyId?.match(/\d+/)?.[0] || "0", 10);
        return numB - numA;
      }) || [];

  const visibleStories = filtered.slice(0, visibleCount);

  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  return (
    <div className="sprint-story-container">
      <ToastContainer position="top-right" autoClose={3000} />
      <div className="sprint-story-container2">
        <section>
          <div className="sprint-title-group">
            <h2 className="sprint-story-title">{release?.name}</h2>
            <button
              onClick={openReleaseEditModal}
              className="sprint-edit-btn"
              title="Edit Release"
            >
              <MdEdit size={15} />
            </button>
          </div>
          <p
            className="sprint-date-badge"
            style={{ padding: "4px 8px", fontSize: "0.75rem" }}
          >
            <strong>Release Date: </strong>
            {release?.releaseDate
              ? new Date(release.releaseDate).toLocaleDateString("en-IN", {
                  day: "2-digit",
                  month: "short",
                  year: "numeric",
                })
              : "TBD"}
          </p>
          <p
            className="sprint-date-badge"
            style={{ padding: "4px 8px", fontSize: "0.75rem" }}
          >
            <strong>Category: </strong>
            {release?.category || "General"}
          </p>
        </section>

        <div className="relTop-btn-group">
          <button
            className="relTop-btn-pr"
            onClick={(e) => {
              setIsMasterModalOpen(true);
            }}
          >
            Master
          </button>
          <button
            className="relTop-btn-pr"
            onClick={(e) => {
              setIsAlphaModalOpen(true);
            }}
          >
            Alpha
          </button>
          <button
            className="relTop-btn-pr"
            onClick={(e) => {
              setIsHFXModalOpen(true);
            }}
          >
            HFX
          </button>
        </div>

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
          </div>
          <button
            className="btn-add-existing"
            onClick={() => setIsAddExistingModalOpen(true)}
          >
            Add Existing
          </button>
          <button onClick={handleBack} className="back-button">
            <MdArrowBack />
          </button>
        </section>
      </div>
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: "10px",
          flexWrap: "wrap",
          marginBottom: "25px",
          padding: "12px 18px",
          backgroundColor: "#f8fafc",
          borderRadius: "10px",
          border: "1px solid #e2e8f0",
        }}
      >
        <strong style={{ fontSize: "0.9rem", color: "#334155" }}>
          Apps to be deployed:{" "}
        </strong>

        {/* List of all the apps to be deployed present in the stories
        attached with the release tag
        */}
        {combinedUniqueApps.length > 0 ? (
          combinedUniqueApps.map((app, idx) => {
            const isFromStory = storyApps.includes(app);
            return (
              <span
                key={idx}
                style={{
                  backgroundColor: "#eff6ff",
                  color: "#2563eb",
                  padding: "4px 10px",
                  borderRadius: "6px",
                  fontSize: "0.8rem",
                  border: "1px solid #bfdbfe",
                  fontWeight: "600",
                  display: "inline-flex",
                  alignItems: "center",
                  gap: "6px",
                }}
              >
                {app}
                {!isFromStory && (
                  <MdClose
                    size={14}
                    style={{ cursor: "pointer", color: "#ef4444" }}
                    onClick={() => handleRemoveManualApp(app)}
                    title="Remove manually added app"
                  />
                )}
              </span>
            );
          })
        ) : (
          <span style={{ color: "#64748b", fontSize: "0.85rem" }}>
            None yet
          </span>
        )}
        <div
          style={{
            display: "flex",
            gap: "6px",
            alignItems: "center",
            marginLeft: "auto",
          }}
        >
          <input
            list="release-apps-options"
            type="text"
            value={newManualApp}
            onChange={(e) => setNewManualApp(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleAddManualApp()}
            placeholder="Select app to add..."
            style={{
              padding: "6px 10px",
              borderRadius: "6px",
              border: "1px solid #cbd5e1",
              fontSize: "0.8rem",
              width: "160px",
              outline: "none",
            }}
          />
          <datalist id="release-apps-options">
            {availableAppsForManualAdd.map((app, i) => (
              <option key={i} value={app.repoName}>
                {app.repoName}
              </option>
            ))}
          </datalist>
          <button
            onClick={handleAddManualApp}
            style={{
              backgroundColor: "#16a34a",
              color: "white",
              border: "none",
              borderRadius: "6px",
              padding: "6px 14px",
              fontSize: "0.8rem",
              cursor: "pointer",
              fontWeight: "600",
            }}
          >
            Add
          </button>
        </div>
      </div>

      <div className="filter-box">
        <StoryFilter onApplyFilter={handleApplyFilter} />
      </div>

      {/*
      This display all the stories in card format attached with the
      release tag 
       */}
      <div className="sprint-story-grid">
        {visibleStories.length > 0 ? (
          visibleStories.map((story) => (
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
                <strong>Release Date: </strong>
                {new Date(story?.qaEnvRelDate).toLocaleDateString("en-IN", {
                  day: "2-digit",
                  month: "short",
                  year: "numeric",
                })}
              </p>
              <p>
                <strong>Story Points: </strong> {story?.storyPoints}
              </p>
              <div className="story-comments">
                <strong>Comments: </strong>
                <span>{story?.comments || "No comments."}</span>
              </div>

              <button
                className="prForRel-btn"
                onClick={(e) => {
                  e.stopPropagation();
                  setSelectedStoryForPr(story);
                  setIsPrModalOpen(true);
                }}
              >
                PR Rel
              </button>
            </div>
          ))
        ) : (
          <p style={{ color: "#64748b", marginTop: "20px" }}>
            No stories linked to this release yet.
          </p>
        )}
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
      <MasterPrModal
        isOpen={isMasterModalOpen}
        onClose={() => setIsMasterModalOpen(false)}
        appsToBeDeployed={combinedUniqueApps}
        releaseName={release?.name}
      />

      <AlphaPrModal
        isOpen={isAlphaModalOpen}
        onClose={() => setIsAlphaModalOpen(false)}
        appsToBeDeployed={combinedUniqueApps}
        releaseName={release?.name}
      />

      <HFXPrModal
        isOpen={isHFXModalOpen}
        onClose={() => setIsHFXModalOpen(false)}
        appsToBeDeployed={combinedUniqueApps}
        releaseName={release?.name}
      />

      <ReleasePrModal
        isOpen={isPrModalOpen}
        onClose={() => setIsPrModalOpen(false)}
        selectedStory={selectedStoryForPr}
      />

      <AddExistingStoryModal
        isOpen={isAddExistingModalOpen}
        onClose={() => setIsAddExistingModalOpen(false)}
        onSelectStory={handleSelectExistingStory}
        currentSprintStories={stories}
      />
      <EditReleaseModal
        isOpen={isReleaseModalOpen}
        onClose={() => setIsReleaseModalOpen(false)}
        releaseFormData={releaseFormData}
        handleReleaseChange={handleReleaseChange}
        handleReleaseSave={handleReleaseSave}
        saving={savingRelease}
      />
    </div>
  );
};

export default ReleaseStories;
