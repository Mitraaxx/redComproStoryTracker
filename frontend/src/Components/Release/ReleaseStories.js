import React, { useEffect, useState, useMemo } from "react";
import {
  fetchReleaseStories,
  fetchStoryDetails,
  updateStory,
  clearAllCaches,
  updateRelease,
  fetchBranchMergeStatus, 
} from "../../Api/api";
import { MdArrowBack, MdEdit, MdClose } from "react-icons/md";
import { FaCodeBranch, FaSync } from "react-icons/fa"; 
import { HashLoader } from "react-spinners";
import { useParams, useNavigate } from "react-router-dom";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import AddExistingStoryModal from "../Modals/AddExistingStoryModal";

import "./ReleaseStories.css"; 
import { repoConfig, ITEMS_PER_PAGE } from "../../utils/AppConfig";
import StoryFilter from "../Tools/StoryFilter";
import ReleaseModal from "../Modals/ReleaseModal";
import PrModal from "../Modals/prModal";
import SearchableSelect from "../Tools/SeachableSelect";

/**
 * Component to manage and display stories tied to a specific Release.
 * Handles manual app additions, existing story linking, filtering, and triggering global/inline PRs for the release.
 */
const ReleaseStories = () => {
  const [stories, setStories] = useState([]);
  const [release, setRelease] = useState(null);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");

  const [isAddExistingModalOpen, setIsAddExistingModalOpen] = useState(false);

  const [isReleaseModalOpen, setIsReleaseModalOpen] = useState(false);
  const [savingRelease, setSavingRelease] = useState(false);

  const [newManualApp, setNewManualApp] = useState("");

  const [isMasterModalOpen, setIsMasterModalOpen] = useState(false);
  const [isAlphaModalOpen, setIsAlphaModalOpen] = useState(false);
  const [isHFXModalOpen, setIsHFXModalOpen] = useState(false);

  const [isAtBottom, setIsAtBottom] = useState(false);

  const { releaseId } = useParams();
  const navigate = useNavigate();

  const [mergeStatuses, setMergeStatuses] = useState({});

  /**
   * Initializes and persists pagination limits in session storage.
   */
  const [visibleCount, setVisibleCount] = useState(() => {
    const savedCount = sessionStorage.getItem(`release_${releaseId}_count`);
    return savedCount ? parseInt(savedCount, 10) : ITEMS_PER_PAGE;
  });

  // State for active filters
  const [activeFilters, setActiveFilters] = useState({
    assignee: "",
    status: "",
    qaRelDate: "",
    apps: "",
  });

  /**
   * Applies selected filters from the StoryFilter component and resets pagination.
   */
  const handleApplyFilter = (newFilters) => {
    setActiveFilters(newFilters);
    setVisibleCount(ITEMS_PER_PAGE);
  };

  /**
   * Persists the current visible count of stories to session storage.
   */
  useEffect(() => {
    sessionStorage.setItem(`release_${releaseId}_count`, visibleCount);
  }, [visibleCount, releaseId]);

  /**
   * Universal function to check scroll as well as height (for big viewports)
   * to determine if the user has reached the bottom of the page.
   */
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
   * Effect hook to manage scroll and resize events for infinite scrolling/pagination.
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
   * Effect hook to recalculate the page height whenever data or filters change.
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

  const availableAppsForManualAdd = Object.keys(repoConfig).filter(
    (appName) => !combinedUniqueApps.includes(appName),
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

  /**
   * Navigates to the detailed view page of a specific story.
   */
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
    setIsReleaseModalOpen(true);
  };

  /**
   * Saves metadata modifications to the release context (name, date, category).
   * Bypasses the API call if no changes were detected.
   */
  const handleReleaseSave = async (updatedSprintData) => {
    setSavingRelease(true);
    try {
      await updateRelease(releaseId, updatedSprintData);

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
   * Specific refresh button ka logic - Fetches single branch update
   */
  const handleSpecificRefresh = async (appName, orgName, repoName, branch) => {
    const statusKey = `${appName}-${branch}`;

    setMergeStatuses(prev => ({
      ...prev,
      [statusKey]: null, 
    }));

    try {
      const res = await fetchBranchMergeStatus(orgName, repoName, branch, true);
      setMergeStatuses(prev => ({
        ...prev,
        [statusKey]: res.mergedTill || "Not Merged",
      }));
    } catch (error) {
      console.error("Error refreshing specific status:", error);
      setMergeStatuses(prev => ({
        ...prev,
        [statusKey]: "Error",
      }));
    }
  };

  /**
   * Filters and sorts the stories based on active filters and search terms.
   * useMemo caches this heavy calculation so it only re-runs when inputs actually change.
   */
  const filtered = useMemo(() => {
    return (
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

          if (activeFilters.apps) {
            const selectedApp = activeFilters.apps;
            const hasLinkedApp = item.linkedApps?.some(
              (app) =>
                app.appName === selectedApp || app.appRef?.name === selectedApp,
            );
            if (!hasLinkedApp) return false;
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
        }) || []
    );
  }, [stories, activeFilters, searchTerm]);

  /**
   * Slices the filtered array for infinite scrolling/pagination.
   * useMemo prevents the array's memory address from resetting on every page re-render.
   */
  const visibleStories = useMemo(() => {
    return filtered.slice(0, visibleCount);
  }, [filtered, visibleCount]); 


  /**
   * Effect hook fetches all fields required for github-status api call
   * Uses Promise.all to fetch all branch statuses in PARALLEL for maximum speed.
   */
  useEffect(() => {
    const fetchAllStatuses = async () => {
      if (!visibleStories || visibleStories.length === 0) return;

      try {
        const promises = [];

        for (const story of visibleStories) {
          if (!story.linkedApps) continue;

          for (const appItem of story.linkedApps) {
            const appName = appItem.appRef?.name || appItem.appName;
            const config = repoConfig[appName];

            if (config && appItem.featureBranches?.length > 0) {
              const { orgName, repoName } = config;

              for (const branch of appItem.featureBranches) {
                const key = `${appName}-${branch}`;

                if (mergeStatuses[key] === undefined) {
                  const fetchPromise = fetchBranchMergeStatus(orgName, repoName, branch)
                    .then((res) => ({ key, status: res.mergedTill || "Not Merged" }))
                    .catch((err) => {
                      console.error(`Error fetching status for ${key}:`, err);
                      return { key, status: "Error" };
                    });

                  promises.push(fetchPromise);
                }
              }
            }
          }
        }

        if (promises.length > 0) {
          const results = await Promise.all(promises);

          const fetchedStatuses = {};
          results.forEach(({ key, status }) => {
            fetchedStatuses[key] = status;
          });

          setMergeStatuses((prev) => ({ ...prev, ...fetchedStatuses }));
        }
      } catch (err) {
        console.error("Error fetching statuses:", err);
      }
    };

    fetchAllStatuses();
  }, [visibleStories]); 

  /**
   * Utility to smoothly scroll the page back to the top.
   */
  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

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

  return (
    <div className="release-story-container">
      <div className="extra-box" style={{ justifyContent: "flex-start" }}>
        <button onClick={handleBack} className="back-button">
          <MdArrowBack />
        </button>
      </div>
      <ToastContainer position="top-right" autoClose={3000} />
      <div className="release-story-container2">
        <section>
          <div className="release-title-group">
            <h3 className="release-story-title">{release?.name}</h3>
            <button
              onClick={openReleaseEditModal}
              className="release-edit-btn"
              title="Edit Release"
            >
              <MdEdit size={15} />
            </button>
          </div>

          <div className="release-Date-group">
            <div
              style={{ display: "flex", flexDirection: "column", gap: "8px" }}
            >
              <p
                className="release-date-badge"
                style={{ padding: "4px 8px", fontSize: "0.75rem", margin: 0 }}
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
                className="release-date-badge"
                style={{ padding: "4px 8px", fontSize: "0.75rem", margin: 0 }}
              >
                <strong>Dev Cutoff: </strong>
                {release?.devCutoff
                  ? new Date(release.devCutoff).toLocaleDateString("en-IN", {
                      day: "2-digit",
                      month: "short",
                      year: "numeric",
                    })
                  : "TBD"}
              </p>

              <p
                className="release-date-badge"
                style={{ padding: "4px 8px", fontSize: "0.75rem", margin: 0 }}
              >
                <strong>QA Signoff: </strong>
                {release?.qaSignoff
                  ? new Date(release.qaSignoff).toLocaleDateString("en-IN", {
                      day: "2-digit",
                      month: "short",
                      year: "numeric",
                    })
                  : "TBD"}
              </p>
            </div>

            <div>
              <p
                className="release-date-badge"
                id="rel-date-badge"
                style={{ padding: "6px 12px", fontSize: "0.8rem", margin: 0 }}
              >
                <strong>Category: </strong>
                {release?.category || "General"}
              </p>
            </div>
          </div>
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

        <section className="release-story-container3">
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
        </section>
      </div>

      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: "10px",
          flexWrap: "wrap",
          marginBottom: "25px",
          marginTop: "15px",
          padding: "12px 18px",
          backgroundColor: "#f8fafc",
          borderRadius: "10px",
          border: "1px solid #e2e8f0",
        }}
      >
        <strong style={{ fontSize: "0.9rem", color: "#334155" }}>
          Apps to be deployed:{" "}
        </strong>

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
          <SearchableSelect
            name="appsToBeDeployedInput"
            value={newManualApp}
            onChange={(e) => setNewManualApp(e.target.value)}
             onKeyDown={(e) => e.key === "Enter" && handleAddManualApp()}
            options={availableAppsForManualAdd}
            placeholder="Select App"
          />
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

      <div className="extra-box">
        <StoryFilter onApplyFilter={handleApplyFilter} />
      </div>

      <div className="release-story-grid">
        {visibleStories.length > 0 ? (
          visibleStories.map((story) => (
            <div
              key={story._id}
              onClick={() => handleStoryClick(story._id)}
              className="release-story-card"
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
              <div className="story-comments">
                <strong>Comments: </strong>
                <span>{story?.comments || "No comments."}</span>
              </div>

              {story.linkedApps && story.linkedApps.length > 0 && (
                <div
                  style={{
                    marginTop: "16px",
                    borderTop: "1px dashed #cbd5e1",
                    paddingTop: "12px",
                  }}
                >
                  <strong
                    style={{
                      fontSize: "0.75rem",
                      color: "#2563eb",
                      backgroundColor: "#eff6ff",
                      padding: "8px",
                      borderRadius: "5px",
                      display: "inline-block",
                      marginBottom: "10px",
                      fontWeight: "600",
                      textTransform: "uppercase",
                    }}
                  >
                    Apps:
                  </strong>
                  {story.linkedApps.map((appItem, idx) => {
                    const repoName =
                      appItem.appRef?.name || appItem.appName || "Unknown";

                    const appConfig = repoConfig[repoName] || {};
                    const targetBranch = appConfig.envBranches?.rel || "";
                    const baseUrl =
                      appConfig.baseUrl ||
                      `https://github.com/comprodls/${repoName}/compare/`;

                    return (
                      <div key={idx} style={{ marginBottom: "12px" }}>
                        <span
                          style={{
                            fontSize: "0.8rem",
                            fontWeight: "700",
                            color: "#1e293b",
                          }}
                        >
                          {repoName}
                        </span>
                        {appItem.featureBranches &&
                        appItem.featureBranches.length > 0 ? (
                          <div
                            style={{
                              display: "flex",
                              flexDirection: "column",
                              gap: "6px",
                              marginTop: "6px",
                            }}
                          >
                            {appItem.featureBranches.map((branch, bIdx) => {
                              const statusKey = `${repoName}-${branch}`;
                              const currentStatus = mergeStatuses[statusKey];
                              const config = repoConfig[repoName];

                              return (
                                <div
                                  key={bIdx}
                                  style={{
                                    display: "flex",
                                    flexDirection: "column",
                                    gap: "10px",
                                    backgroundColor: "#f8fafc",
                                    border: "1px solid #e2e8f0",
                                    padding: "8px 10px",
                                    borderRadius: "6px",
                                  }}
                                >
                                  <div
                                    style={{
                                      display: "flex",
                                      justifyContent: "space-between",
                                      alignItems: "center",
                                    }}
                                  >
                                    <span
                                      style={{
                                        fontSize: "0.75rem",
                                        fontFamily: "monospace",
                                        color: "#334155",
                                        wordBreak: "break-all",
                                        marginRight: "10px",
                                      }}
                                    >
                                      <FaCodeBranch color="#3b82f6" /> {branch}
                                    </span>
                                    <button
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        const githubUrl = `${baseUrl}${targetBranch}...${branch}`;
                                        window.open(githubUrl, "_blank");
                                      }}
                                      className="relBottom-btn-pr"
                                      title="Create Release PR"
                                    >
                                      PR Rel
                                    </button>
                                  </div>

                                  <div
                                    style={{
                                      display: "flex",
                                      alignItems: "center",
                                      gap: "8px",
                                    }}
                                  >
                                    <div
                                      className="merged-till-badge"
                                      style={{ margin: 0 }}
                                    >
                                      Merged Till:{" "}
                                      <strong>
                                        {currentStatus ? (
                                          currentStatus
                                        ) : (
                                          <FaSync
                                            className="spin-icon"
                                            color="#15803d"
                                          />
                                        )}
                                      </strong>
                                    </div>

                                    {currentStatus && (
                                      <button
                                        onClick={(e) => {
                                          e.stopPropagation();
                                          if (config) {
                                            handleSpecificRefresh(
                                              repoName,
                                              config.orgName,
                                              repoName,
                                              branch,
                                            );
                                          }
                                        }}
                                        style={{
                                          background: "none",
                                          border: "none",
                                          cursor: "pointer",
                                          display: "flex",
                                          padding: "2px",
                                        }}
                                        title="Refresh branch status"
                                      >
                                        <FaSync color="#15803d" size={14} />
                                      </button>
                                    )}
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                        ) : (
                          <div
                            style={{
                              fontSize: "0.75rem",
                              color: "#94a3b8",
                              marginTop: "2px",
                            }}
                          >
                            No branches
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
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

      <PrModal
        isOpen={isMasterModalOpen}
        onClose={() => setIsMasterModalOpen(false)}
        appsToBeDeployed={combinedUniqueApps}
        releaseName={release?.name}
        prType="master"
      />

      <PrModal
        isOpen={isAlphaModalOpen}
        onClose={() => setIsAlphaModalOpen(false)}
        appsToBeDeployed={combinedUniqueApps}
        releaseName={release?.name}
        prType="alpha"
      />

      <PrModal
        isOpen={isHFXModalOpen}
        onClose={() => setIsHFXModalOpen(false)}
        appsToBeDeployed={combinedUniqueApps}
        releaseName={release?.name}
        prType="hfx"
      />

      <AddExistingStoryModal
        isOpen={isAddExistingModalOpen}
        onClose={() => setIsAddExistingModalOpen(false)}
        onSelectStory={handleSelectExistingStory}
        currentSprintStories={stories}
      />

      <ReleaseModal
        isOpen={isReleaseModalOpen}
        onClose={() => setIsReleaseModalOpen(false)}
        initialData={release}
        handleSave={handleReleaseSave}
        saving={savingRelease}
      />
    </div>
  );
};

export default ReleaseStories;