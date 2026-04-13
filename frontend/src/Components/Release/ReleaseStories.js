// Release stories page.
//
// Complete flow overview:
// 1) Read `releaseId` from the URL.
// 2) Fetch release metadata + stories linked to that release.
// 3) Build an effective deployment app list from two sources:
//    - story-level appsToBeDeployed
//    - release-level manually added apps
// 4) Apply dropdown filters + search + pagination for story cards.
// 5) Fetch merge status for visible app branches and render PR helpers.
// 6) Support release edit, manual app add/remove, and linking existing stories.
import { useEffect, useState, useMemo } from "react";
import {
  fetchReleaseStories,
  updateStory,
  clearAllCaches,
  updateRelease,
  fetchBranchMergeStatus,
  fetchAllReleases,
} from "../../Api/Api";
import { MdArrowBack, MdEdit, MdClose } from "react-icons/md";
import { FaCodeBranch, FaSync } from "react-icons/fa";
import { useParams, useNavigate, useLocation } from "react-router-dom";
import { toast } from "react-toastify";
import "./ReleaseStories.css";
import { repoConfig, ITEMS_PER_PAGE } from "../../utils/AppConfig";
import AddExistingStoryModal from "../Modals/AddExistingStoryModal";
import StoryFilter from "../Tools/StoryFilter";
import ReleaseModal from "../Modals/ReleaseModal";
import PrModal from "../Modals/PrModal";
import SearchableSelect from "../Tools/SearchableSelect";
import { handleApiError, handleApiSuccess } from "../Common/ApiUtils";
import { formatDate } from "../Common/DateUtils";
import LoadingSpinner from "../Common/LoadingSpinner";
import usePaginationState from "../Common/UsePaginationState";
import useInfiniteScroll from "../Common/UseInfiniteScroll";
import PaginationControls from "../Common/PaginationControls";
import { applyDropdownFilters, applySearchAndSort } from "../Common/SearchBar";
import StoryGrid from "../Common/StoryGrid";

const ReleaseStories = () => {
  // ------------------------------
  // View State
  // ------------------------------
  // Stories currently associated with this release.
  const [stories, setStories] = useState([]);

  // Release header object (name, dates, category, manual apps).
  const [release, setRelease] = useState(null);

  // Full-page loading state during initial fetch and story-link operations.
  const [loading, setLoading] = useState(true);

  // Free-text search query.
  const [searchTerm, setSearchTerm] = useState("");

  // Modal visibility state: add existing story modal.
  const [isAddExistingModalOpen, setIsAddExistingModalOpen] = useState(false);

  // Modal visibility state: edit release modal.
  const [isReleaseModalOpen, setIsReleaseModalOpen] = useState(false);

  // Submit-lock for release save action.
  const [savingRelease, setSavingRelease] = useState(false);

  // Temporary selected app value for manual app-add control.
  const [newManualApp, setNewManualApp] = useState("");

  // Active PR modal type: "master" | "alpha" | "hfx" | null.
  const [activePrType, setActivePrType] = useState(null);

  // Full release list used by modal for duplicate name checks.
  const [allRelease, setAllRelease] = useState([]);

  // Route parameter (release context).
  const { releaseId } = useParams();

  // Navigation helper for back and detail route transitions.
  const navigate = useNavigate();
  const location = useLocation();

  // Per-app-branch merge status map keyed by `${appName}-${branch}`.
  const [mergeStatuses, setMergeStatuses] = useState({});

  // Dropdown filter state managed by StoryFilter.
  const [activeFilters, setActiveFilters] = useState({
    assignee: "",
    status: "",
    qaRelDate: "",
    apps: "",
  });

  // Persist visible card count per release so pagination survives route revisits.
  const [visibleCount, setVisibleCount] = usePaginationState(
    `release_${releaseId}_count`,
  );

  // Used by shared pagination controls for load-more visibility behavior.
  const isAtBottom = useInfiniteScroll([
    stories,
    visibleCount,
    searchTerm,
    activeFilters,
  ]);

  // Opens release edit modal and preloads release list for duplicate-name checks.
  const openEditReleaseModal = async () => {
    setIsReleaseModalOpen(true);
    try {
      // Preload all releases so modal can validate duplicate names client-side.
      const data = await fetchAllReleases(true);
      if (data) setAllRelease(data);
    } catch (err) {
      console.error("Failed to fetch all release for validation", err);
    }
  };

  // Receives dropdown filters and resets pagination window.
  const handleApplyFilter = (newFilters) => {
    setActiveFilters(newFilters);
    setVisibleCount(ITEMS_PER_PAGE);
  };

  // Fetch release summary and linked stories when route releaseId changes.
  useEffect(() => {
    const getStories = async () => {
      try {
        // Enter loading mode while requesting release payload.
        setLoading(true);

        // Backend returns `{ release, stories }` for this releaseId.
        const data = await fetchReleaseStories(releaseId);

        // Hydrate header and story grid state.
        setRelease(data.release);
        setStories(data.stories);
      } catch (err) {
        console.error(err);
        toast.error(err.message);
      } finally {
        setLoading(false);
      }
    };

    // Only fetch when route has a valid release id.
    if (releaseId) {
      getStories();
    }
  }, [releaseId]);

  // Aggregate apps requested by stories, then combine with manual release apps.
  const storyApps = stories.reduce((acc, story) => {
    // Each story may store apps as string or array; normalize to list push.
    if (Array.isArray(story.appsToBeDeployed)) {
      acc.push(...story.appsToBeDeployed);
    } else if (story.appsToBeDeployed) {
      acc.push(story.appsToBeDeployed);
    }
    return acc;
  }, []);

  // Release-level manually curated app list.
  const manualReleaseApps = release?.appsToBeDeployed || [];

  // Combined + de-duplicated deployment app list used in UI and PR modal.
  const combinedUniqueApps = [...new Set([...storyApps, ...manualReleaseApps])];

  // Options shown in add-manual-app dropdown: exclude apps already selected.
  const availableAppsForManualAdd = Object.keys(repoConfig).filter(
    (appName) => !combinedUniqueApps.includes(appName),
  );

  // Adds a manual app to release-level deployment list.
  const handleAddManualApp = async () => {
    // Guard: empty input should do nothing.
    if (!newManualApp.trim()) return;

    // Guard: ignore duplicates that already exist from either source list.
    if (
      manualReleaseApps.includes(newManualApp.trim()) ||
      storyApps.includes(newManualApp.trim())
    ) {
      setNewManualApp("");
      return;
    }

    // Build next manual app list.
    const updatedApps = [...manualReleaseApps, newManualApp.trim()];

    try {
      // Persist release changes.
      await updateRelease(releaseId, { appsToBeDeployed: updatedApps });

      // Update local release state for immediate UI feedback.
      setRelease((prev) => ({
        ...prev,
        appsToBeDeployed: updatedApps,
      }));

      // Invalidate shared caches so other views do not use stale release data.
      clearAllCaches();

      // Reset input and show success toast.
      setNewManualApp("");
      handleApiSuccess("App added to release");
    } catch (err) {
      handleApiError(err, "Failed to add app");
    }
  };

  // Removes a manual app from release-level deployment list.
  const handleRemoveManualApp = async (appToRemove) => {
    // Remove target app from manual-only list.
    const updatedApps = manualReleaseApps.filter((app) => app !== appToRemove);

    try {
      await updateRelease(releaseId, { appsToBeDeployed: updatedApps });

      // Reflect removal in local header state.
      setRelease((prev) => ({
        ...prev,
        appsToBeDeployed: updatedApps,
      }));

      clearAllCaches();
      handleApiSuccess("App removed from release");
    } catch (err) {
      handleApiError(err, "Failed to remove app");
    }
  };

  // Links an existing story to this release by updating story releaseTag.
  const handleSelectExistingStory = async (selectedStory) => {
    // Close picker modal and show loading while reassignment happens.
    setIsAddExistingModalOpen(false);
    setLoading(true);

    try {
      // Re-tag selected story to current release name.
      const updatedStory = await updateStory(selectedStory.storyId, {
        releaseTag: release?.name,
      });

      clearAllCaches();

      // Optimistically prepend newly linked story into visible list.
      setStories((prev) => [
        updatedStory,
        ...prev,
      ]);

      handleApiSuccess("Story successfully added to this Release");
    } catch (err) {
      handleApiError(err, "Failed to add story to this release");
    } finally {
      // Restore UI.
      setLoading(false);
    }
  };

  // Navigate to release story detail.
  const handleStoryClick = (storyDbId) => {
    navigate(`/releases/${releaseId}/stories/${storyDbId}`, {
      state: { from: `${location.pathname}${location.search}` },
    });
  };

  // Back to release list.
  const handleBack = () => {
    navigate("/releases");
  };

  // Saves release edits and propagates renamed releaseTag to current list view.
  const handleReleaseSave = async (payload) => {
    // Lock modal save while update request runs.
    setSavingRelease(true);

    try {
      const { isEditMode, changedFields } = payload;

      // Only process edit payload shape.
      if (isEditMode) {
        // Persist changed fields.
        await updateRelease(releaseId, changedFields);

        // Sync local release header with changed values.
        setRelease((prev) => ({
          ...prev,
          ...changedFields,
        }));

        // If release name changed, update current story chips in-memory.
        if (changedFields.name) {
          setStories((prev) =>
            prev.map((s) => ({
              ...s,
              releaseTag: changedFields.name,
            })),
          );
        }
      }

      setIsReleaseModalOpen(false);
      clearAllCaches();
      handleApiSuccess("Release updated successfully");
    } catch (error) {
      handleApiError(error, "Release Name exists or failed to update");
    } finally {
      // Unlock save button.
      setSavingRelease(false);
    }
  };

  // Manually refresh one branch merge status.
  const handleSpecificRefresh = async (appName, orgName, repoName, branch) => {
    // Status map key for this specific app branch pair.
    const statusKey = `${appName}-${branch}`;

    // Set to null so UI renders loading spinner during refresh.
    setMergeStatuses((prev) => ({
      ...prev,
      [statusKey]: null,
    }));

    try {
      // forceRefresh=true bypasses client cache.
      const res = await fetchBranchMergeStatus(orgName, repoName, branch, true);

      // Write fresh status value.
      setMergeStatuses((prev) => ({
        ...prev,
        [statusKey]: res.mergedTill || "Not Merged",
      }));
    } catch (error) {
      // Keep trace and show explicit error state in badge.
      console.error("Error refreshing specific status:", error);
      setMergeStatuses((prev) => ({
        ...prev,
        [statusKey]: "Error",
      }));
    }
  };

  // Filter/search/paginate pipeline.
  const dropdownFilteredStories = useMemo(() => {
    // Step 1: apply filter panel values.
    return applyDropdownFilters(stories, activeFilters);
  }, [stories, activeFilters]);

  const filtered = useMemo(() => {
    // Step 2: apply text search + sorting.
    return applySearchAndSort(dropdownFilteredStories, searchTerm);
  }, [dropdownFilteredStories, searchTerm]);

  const visibleStories = useMemo(() => {
    // Step 3: apply pagination cap.
    return filtered.slice(0, visibleCount);
  }, [filtered, visibleCount]);

  // Resolve merge statuses for visible story app branches in parallel.
  useEffect(() => {
    const fetchAllStatuses = async () => {
      // Nothing visible means nothing to resolve.
      if (!visibleStories || visibleStories.length === 0) return;

      try {
        // Queue unresolved branch lookups and resolve in parallel.
        const promises = [];

        for (const story of visibleStories) {
          // Skip stories with no app linkage.
          if (!story.linkedApps) continue;

          for (const appItem of story.linkedApps) {
            // Defensive guard: backend data can include null placeholders.
            if (!appItem || typeof appItem !== "object") continue;

            // Pull app + branch for status lookup.
            const appName = appItem.appName;
            const branch = appItem.featureBranch;
            const config = repoConfig[appName];

            if (config && branch) {
              const { orgName, repoName } = config;

              const key = `${appName}-${branch}`;

              // Fetch only if this key is not already present in map.
              if (mergeStatuses[key] === undefined) {
                const fetchPromise = fetchBranchMergeStatus(
                  orgName,
                  repoName,
                  branch,
                )
                  .then((res) => ({
                    key,
                    status: res.mergedTill || "Not Merged",
                  }))
                  .catch((err) => {
                    console.error(`Error fetching status for ${key}:`, err);
                    return {
                      key,
                      status: "Error",
                    };
                  });
                promises.push(fetchPromise);
              }
            }
          }
        }

        // Merge resolved statuses into existing state map.
        if (promises.length > 0) {
          const results = await Promise.all(promises);
          const fetchedStatuses = {};
          results.forEach(({ key, status }) => {
            fetchedStatuses[key] = status;
          });
          setMergeStatuses((prev) => ({
            ...prev,
            ...fetchedStatuses,
          }));
        }
      } catch (err) {
        console.error("Error fetching statuses:", err);
        toast.error(err.message);
      }
    };

    fetchAllStatuses();
  }, [visibleStories]);

  // Extra renderer passed to StoryGrid to show per-app branch and PR controls.
  const renderReleaseExtra = (story) => {
    // Skip extra block when there are no linked apps.
    if (!story.linkedApps || story.linkedApps.length === 0) return null;

    return (
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

        {/* Render app-level branch blocks inside each story card. */}
        {story.linkedApps
          .filter((appItem) => appItem && typeof appItem === "object")
          .map((appItem, idx) => {
          // Resolve repo settings for current app.
          const repoName = appItem.appName || "Unknown";
          const appConfig = repoConfig[repoName] || {};
          const targetBranch = appConfig.envBranches?.rel || "";
          const baseUrl =
            appConfig.baseUrl ||
            `https://github.com/comprodls/${repoName}/compare/`;

          return (
            <div
              key={idx}
              style={{
                marginBottom: "12px",
              }}
            >
              <span
                style={{
                  fontSize: "0.8rem",
                  fontWeight: "700",
                  color: "#1e293b",
                }}
              >
                {repoName}
              </span>

              {}
              {/* Branch controls appear only if feature branch is present. */}
              {appItem.featureBranch ? (
                <div
                  style={{
                    display: "flex",
                    flexDirection: "column",
                    gap: "6px",
                    marginTop: "6px",
                  }}
                >
                  {(() => {
                    // Build lookup context for status and refresh actions.
                    const branch = appItem.featureBranch;
                    const statusKey = `${repoName}-${branch}`;
                    const currentStatus = mergeStatuses[statusKey];
                    const config = repoConfig[repoName];

                    return (
                      <div
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

                          {/* Opens GitHub compare URL for release PR creation. */}
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
                          {/* Shows resolved merge target or spinner while loading. */}
                          <div
                            className="merged-till-badge"
                            style={{
                              margin: 0,
                            }}
                          >
                            Merged Till:{" "}
                            <strong>
                              {currentStatus ? (
                                currentStatus
                              ) : (
                                <FaSync className="spin-icon" color="#15803d" />
                              )}
                            </strong>
                          </div>

                          {/* Refresh status button appears once initial status is known. */}
                          {currentStatus && (
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                e.preventDefault();
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
                  })()}
                </div>
              ) : (
                <div
                  style={{
                    // Fallback text for apps without feature branch data.
                    fontSize: "0.75rem",
                    color: "#94a3b8",
                    marginTop: "2px",
                  }}
                >
                  No branch linked
                </div>
              )}
            </div>
          );
        })}
      </div>
    );
  };

  // Initial fetch guard.
  if (loading) return <LoadingSpinner />;

  // ------------------------------
  // Render
  // ------------------------------
  return (
    <div className="release-story-container">
      {/* Back row. */}
      <div
        className="extra-box"
        style={{
          justifyContent: "flex-start",
        }}
      >
        <button
          onClick={handleBack}
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

      <div className="release-story-container2">
        {/* Release summary header and edit action. */}
        <section>
          <div className="release-title-group">
            <h3 className="release-story-title">{release?.name}</h3>
            <button
              onClick={openEditReleaseModal}
              className="release-edit-btn"
              title="Edit Release"
            >
              <MdEdit size={15} />
            </button>
          </div>

          <div className="release-Date-group">
            <div
              style={{
                display: "flex",
                flexDirection: "column",
                gap: "8px",
              }}
            >
              <p
                className="release-date-badge"
                style={{
                  padding: "4px 8px",
                  fontSize: "0.75rem",
                  margin: 0,
                }}
              >
                <strong>Release Date: </strong>
                {release?.releaseDate ? formatDate(release.releaseDate) : "TBD"}
              </p>

              <p
                className="release-date-badge"
                style={{
                  padding: "4px 8px",
                  fontSize: "0.75rem",
                  margin: 0,
                }}
              >
                <strong>Dev Cutoff: </strong>
                {release?.devCutoff ? formatDate(release.devCutoff) : "TBD"}
              </p>

              <p
                className="release-date-badge"
                style={{
                  padding: "4px 8px",
                  fontSize: "0.75rem",
                  margin: 0,
                }}
              >
                <strong>QA Signoff: </strong>
                {release?.qaSignoff ? formatDate(release.qaSignoff) : "TBD"}
              </p>
            </div>

            <div>
              <p
                className="release-date-badge"
                id="rel-date-badge"
                style={{
                  padding: "6px 12px",
                  fontSize: "0.8rem",
                  margin: 0,
                }}
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
            onClick={() => setActivePrType("master")}
          >
            Master
          </button>
          <button
            className="relTop-btn-pr"
            onClick={() => setActivePrType("alpha")}
          >
            Alpha
          </button>
          <button
            className="relTop-btn-pr"
            onClick={() => setActivePrType("hfx")}
          >
            HFX
          </button>
        </div>

        <section className="release-story-container3">
          <div className="story-search-header">
            {/* Search text with pagination reset. */}
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

          {/* Open modal to attach existing story to this release. */}
          <button
            className="btn-add-existing"
            onClick={() => setIsAddExistingModalOpen(true)}
          >
            Add Existing
          </button>
        </section>
      </div>

      {/* Deployment apps summary bar (story-derived + manual apps). */}
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
        <strong
          style={{
            fontSize: "0.9rem",
            color: "#334155",
          }}
        >
          Apps to be deployed:{" "}
        </strong>

        {combinedUniqueApps.length > 0 ? (
          combinedUniqueApps.map((app, idx) => {
            // Apps originating from story data cannot be removed from this bar.
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
                    style={{
                      cursor: "pointer",
                      color: "#ef4444",
                    }}
                    onClick={() => handleRemoveManualApp(app)}
                    title="Remove manually added app"
                  />
                )}
              </span>
            );
          })
        ) : (
          <span
            style={{
              color: "#64748b",
              fontSize: "0.85rem",
            }}
          >
            None yet
          </span>
        )}

        {/* Manual app add controls. */}
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

      {/* Advanced filter bar. */}
      <div className="extra-box">
        <StoryFilter onApplyFilter={handleApplyFilter} />
      </div>

      {/* Story grid with release-specific extra branch renderer. */}
      <StoryGrid
        stories={visibleStories}
        onCardClick={handleStoryClick}
        gridClassName="release-story-grid"
        cardClassName="release-story-card"
        emptyMessage="No stories linked to this release yet."
        renderExtra={renderReleaseExtra}
      />

      {/* Shared load-more/back-to-top controls. */}
      <PaginationControls
        filteredItems={filtered}
        visibleCount={visibleCount}
        setVisibleCount={setVisibleCount}
        isAtBottom={isAtBottom}
      />

      {/* PR modal for selected release PR flow type (master/alpha/hfx). */}
      <PrModal
        isOpen={!!activePrType}
        onClose={() => setActivePrType(null)}
        appsToBeDeployed={combinedUniqueApps}
        releaseName={release?.name}
        prType={activePrType}
      />

      {/* Attach existing story modal. */}
      <AddExistingStoryModal
        isOpen={isAddExistingModalOpen}
        onClose={() => setIsAddExistingModalOpen(false)}
        onSelectStory={handleSelectExistingStory}
        currentSprintStories={stories}
      />

      {/* Edit release modal. */}
      <ReleaseModal
        isOpen={isReleaseModalOpen}
        onClose={() => setIsReleaseModalOpen(false)}
        initialData={release}
        handleSave={handleReleaseSave}
        saving={savingRelease}
        existingReleases={allRelease}
      />
    </div>
  );
};
export default ReleaseStories;
