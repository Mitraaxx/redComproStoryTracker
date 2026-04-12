// Story details screen.
//
// High-level flow:
// 1) Read `storyId` from URL.
// 2) Fetch full story details from backend.
// 3) Render story metadata and linked app cards.
// 4) For each linked app branch, fetch and show GitHub merge status.
// 5) Allow editing story/app fields via `StoryModal`.
// 6) Allow opening PR helper modal for a specific app branch.
import { useEffect, useState } from "react";
import {
  fetchStoryDetails,
  updateStory,
  clearAllCaches,
  fetchAllSprints,
  fetchAllReleases,
  fetchBranchMergeStatus,
  fetchAllStories,
} from "../../Api/api";
import { MdArrowBack, MdSource, MdNotes, MdEdit } from "react-icons/md";
import { FaCodeBranch, FaSync } from "react-icons/fa";
import { AiOutlineLink } from "react-icons/ai";
import { useParams, useNavigate } from "react-router-dom";
import "../Sprints/StoryDetails.css";
import "react-toastify/dist/ReactToastify.css";
import CreatePrModal from "../Modals/CreatePrModal";
import { repoConfig } from "../../utils/AppConfig";
import StoryModal from "../Modals/StoryModal";
import { handleApiError, handleApiSuccess } from "../Common/apiUtils";
import LoadingSpinner from "../Common/LoadingSpinner";

const StoryDetails = () => {
  // ------------------------------
  // View State
  // ------------------------------
  // `loading` controls full-page spinner while initial story data is loading.
  const [loading, setLoading] = useState(true);

  // `storyData` is the full story object returned by the backend.
  // It contains metadata (name, sprint, release, dates, etc.) and `linkedApps`.
  const [storyData, setStoryData] = useState(null);

  // Dropdown/support data for edit modal.
  const [sprintsList, setSprintsList] = useState([]);
  const [releasesList, setReleasesList] = useState([]);

  // PR helper modal state.
  const [isPrModalOpen, setIsPrModalOpen] = useState(false);

  // Stores app + feature branch context for PR modal.
  const [prAppData, setPrAppData] = useState({
    appName: "",
    featureBranch: "",
  });

  // Edit story modal state.
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);

  // Save button spinner/disabled state while update request is in-flight.
  const [savingChanges, setSavingChanges] = useState(false);

  // Map of merge statuses keyed by `${appName}-${branch}`.
  // Example key: `nemo-micro-admin-env/qa` -> "main" or "Not Merged".
  const [mergeStatuses, setMergeStatuses] = useState({});

  // Full stories list used by edit modal for duplicate story-id validation.
  const [allStory, setAllStory] = useState([]);

  // Read route parameters from URL across direct and nested story routes.
  const { storyId, sprintId, releaseId, appName } = useParams();

  // Router helper for back navigation.
  const navigate = useNavigate();

  // ------------------------------
  // Data Loader: Story Details
  // ------------------------------
  // Fetches the selected story and stores it in state.
  // This function is called when route param `storyId` changes.
  const getStoryDetails = async () => {
    try {
      // Show full-page loader while fetching story payload.
      setLoading(true);

      // Backend returns story detail object by DB id.
      const data = await fetchStoryDetails(storyId);
      setStoryData(data);
    } catch (err) {
      handleApiError(err, "Failed to fetch story details");
    } finally {
      setLoading(false);
    }
  };

  // Trigger detail fetch whenever route param changes.
  useEffect(() => {
    if (storyId) {
      getStoryDetails();
    }
  }, [storyId]);

  // ------------------------------
  // Data Loader: GitHub Merge Statuses
  // ------------------------------
  // Once storyData is available, fetch merge status for each linked app branch.
  // Only missing keys are fetched; existing cached statuses in state are preserved.
  useEffect(() => {
    const fetchAllStatuses = async () => {
      // No app links means nothing to resolve.
      if (!storyData?.linkedApps?.length) return;

      // Collect unresolved status requests and run them in parallel.
      const promises = [];

      // Iterate every linked app block saved against this story.
      for (const appItem of storyData.linkedApps) {
        // Read app name and branch from linked app entry.
        const appName = appItem.appName;
        const branch = appItem.featureBranch;

        // Repo metadata is needed to call GitHub status API.
        const config = repoConfig[appName];

        // Skip invalid config or empty branch.
        if (!config || !branch) continue;

        // Extract org/repo names from config.
        const { orgName, repoName } = config;

        // Build stable status key for this app+branch pair.
        const key = `${appName}-${branch}`;

        // Skip if already resolved in component state.
        if (mergeStatuses[key] !== undefined) continue;

        // Queue backend call for this key. If request fails, mark key as "Error"
        // so UI remains explicit and does not spin forever.
        promises.push(
          fetchBranchMergeStatus(orgName, repoName, branch)
            .then((res) => ({
              key,
              status: res.mergedTill || "Not Merged",
            }))
            .catch(() => ({
              key,
              status: "Error",
            })),
        );
      }

      // If everything was already resolved, stop here.
      if (promises.length === 0) return;

      // Resolve all pending statuses in parallel.
      const results = await Promise.all(promises);

      // Merge newly fetched status entries into existing status map.
      setMergeStatuses((prev) => ({
        ...prev,
        ...results.reduce((acc, { key, status }) => {
          // Fold array of `{key, status}` into plain object map.
          acc[key] = status;
          return acc;
        }, {}),
      }));
    };

    fetchAllStatuses();
  }, [storyData]);

  // ------------------------------
  // Save Handler: Story Edit Modal
  // ------------------------------
  // Receives structured payload from StoryModal and performs a single update call.
  // Then updates local UI state to reflect new values immediately.
  const handleEditStorySave = async (payload) => {
    // Lock save button and show saving state.
    setSavingChanges(true);

    try {
      // Payload shape is designed by StoryModal.
      const {
        changedStoryFields,
        isAppsChanged,
        linkedApps,
        fullFormDataForState,
      } = payload;

      // Start with changed top-level story fields only.
      const finalPayload = {
        ...changedStoryFields,
      };

      // Attach linked apps only when app section changed.
      if (isAppsChanged) {
        finalPayload.linkedApps = linkedApps;
      }

      // Update by business storyId (backend route expects storyId param).
      await updateStory(storyData.storyId, finalPayload);

      // Normalize app shape for consistent UI rendering after save.
      // Supports both `appName` and fallback `name` keys.
      const normalizedApps = linkedApps.map((app) => ({
        ...app,
        appName: app.appName || app.name || "Unknown App",
        featureBranch: app.featureBranch || "",
      }));

      // Update local story state so user sees changes without re-fetch.
      setStoryData((prev) => {
        // Keep existing sprint reference by default.
        let updatedSprint = prev.sprint;

        // New sprint id selected in edit form.
        const incomingSprintId = fullFormDataForState.sprintId;

        // If sprint was selected, resolve sprint label from preloaded sprint list.
        if (incomingSprintId) {
          const matchingSprint = sprintsList.find(
            (s) => s._id === incomingSprintId,
          );
          if (matchingSprint) {
            updatedSprint = {
              _id: matchingSprint._id,
              name: matchingSprint.name,
            };
          }
          // If sprint was explicitly cleared, set sprint to null.
        } else if (
          fullFormDataForState.sprintName === "" ||
          incomingSprintId === null
        ) {
          updatedSprint = null;
        }

        // Return merged story object for immediate UI refresh.
        return {
          ...prev,
          ...fullFormDataForState,
          sprint: updatedSprint,
          linkedApps: normalizedApps,
        };
      });

      // Close modal after successful save.
      setIsEditModalOpen(false);

      // Clear cross-page caches so lists/details on other screens are fresh.
      clearAllCaches();


      handleApiSuccess("Update Successful");
    } catch (error) {
      handleApiError(error, "Update Failed");
    } finally {
      setSavingChanges(false);
    }
  };

  // ------------------------------
  // Modal Prep: Open Edit Story
  // ------------------------------
  // Preloads all dropdown/validation datasets before showing modal.
  // This avoids partial-loading experience inside the modal itself.
  const openEditStoryModal = async () => {
    try {
      // Fetch all required datasets concurrently for faster modal open.
      const [releasesData, storiesData, sprintsData] = await Promise.all([
        fetchAllReleases(),
        fetchAllStories(),
        fetchAllSprints(),
      ]);

      // Store each dataset if request returned data.
      if (releasesData) setReleasesList(releasesData);
      if (storiesData) setAllStory(storiesData);
      if (sprintsData) setSprintsList(sprintsData);
    } catch (err) {
      handleApiError(err, "Failed to fetch data for edit modal");
    } finally {
      setIsEditModalOpen(true);
    }
  };

  // Opens PR helper modal for selected app + branch.
  const openPrModal = (appName, featureBranch) => {
    setPrAppData({
      appName: appName || "Unknown",
      featureBranch,
    });
    setIsPrModalOpen(true);
  };

  // Route-aware back navigation for nested story detail entry points.
  const handleBack = () => {
    if (sprintId) {
      navigate(`/sprints/${sprintId}/stories`);
      return;
    }

    if (releaseId) {
      navigate(`/releases/${releaseId}/stories`);
      return;
    }

    if (appName) {
      navigate(`/apps/${appName}/stories`);
      return;
    }

    // Fallback for direct story route when there is no parent route context.
    navigate("/stories");
  };

  // Manual refresh for one app branch merge status.
  // Sets current status to `null` first so spinner appears while refreshing.
  const handleSpecificRefresh = async (appName, orgName, repoName, branch) => {
    const statusKey = `${appName}-${branch}`;

    // Set null to drive loading indicator in the badge UI.
    setMergeStatuses((prev) => ({
      ...prev,
      [statusKey]: null,
    }));

    try {
      // forceRefresh=true bypasses API-layer cache.
      const res = await fetchBranchMergeStatus(orgName, repoName, branch, true);

      // Store latest resolved status string.
      setMergeStatuses((prev) => ({
        ...prev,
        [statusKey]: res.mergedTill || "Not Merged",
      }));
    } catch (error) {
      console.error("Error refreshing specific status:", error);
      setMergeStatuses((prev) => ({
        ...prev,
        [statusKey]: "Error",
      }));
    }
  };

  // Initial page loading state.
  if (loading) return <LoadingSpinner />;

  // Safe fallback to empty array if story has no linked apps.
  const appsList = storyData?.linkedApps || [];

  // ------------------------------
  // Render
  // ------------------------------
  return (
    <div className="sprint-storyDetails-container">
      {/* Top row: back button only. */}
      <div
        className="extra-box"
        style={{
          justifyContent: "flex-start",
          marginLeft: "1rem",
          marginBottom: "1rem",
        }}
      >
        {/* Return to previous screen without hardcoded route dependency. */}
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

      {/* Main summary card: all core story metadata fields. */}
      <div className="sprint-storyDetails-container2">
        <div className="sprint-storyDetails-container2-5">
          {/* Story identity fields. */}
          <p>
            <strong>Story Name: </strong>
            <span>{storyData.storyName}</span>
          </p>
          <p>
            <strong>Story ID: </strong> {storyData.storyId}
          </p>

          {/* Relational fields (sprint + release tag). */}
          <p>
            <strong>Sprint: </strong> {storyData.sprint?.name || "N/A"}
          </p>
          <p>
            <strong>Release Tag: </strong>{" "}
            <span id="release-tag">{storyData.releaseTag}</span>
          </p>

          {/* Planning/ownership fields. */}
          <p>
            <strong>Story Points: </strong> <span>{storyData.storyPoints}</span>
          </p>
          <p>
            <strong>EPIC: </strong> <span>{storyData.epic}</span>
          </p>
          <p>
            <strong>Category: </strong> <span>{storyData.category}</span>
          </p>
          <p>
            {/* Assigned owner for current execution responsibility. */}
            <strong>Responsibility: </strong>{" "}
            <span>{storyData.responsibility}</span>
          </p>
          <p>
            <strong>First Review: </strong> <span>{storyData.firstReview}</span>
          </p>

          {/* Timeline fields with localized formatting + graceful fallbacks. */}
          <p>
            <strong>QA Release Date: </strong>{" "}
            <span>
              {storyData?.qaEnvRelDate
                ? new Date(storyData.qaEnvRelDate).toLocaleDateString("en-IN", {
                    day: "2-digit",
                    month: "short",
                    year: "numeric",
                  })
                : "N/A"}
            </span>
          </p>
          <p>
            <strong>Currently With: </strong> <span>{storyData.status}</span>
          </p>
          <p>
            <strong>Live Release Date: </strong>{" "}
            <span>
              {storyData?.liveEnvRelease
                ? new Date(storyData.liveEnvRelease).toLocaleDateString(
                    "en-IN",
                    {
                      day: "2-digit",
                      month: "short",
                      year: "numeric",
                    },
                  )
                : "N/A"}
            </span>
          </p>

          {/* Type + deployment app list + comments. */}
          <p>
            <strong>Type: </strong> <span>{storyData.type}</span>
          </p>
          <p>
            <strong>Apps to be deployed: </strong>
            <span
              style={{
                marginTop: "4px",
              }}
            >
              {/* Render each app as a stacked bullet; fallback to None. */}
              {Array.isArray(storyData.appsToBeDeployed) &&
              storyData.appsToBeDeployed.length > 0
                ? storyData.appsToBeDeployed.map((app, i) => (
                    <span
                      key={i}
                      style={{
                        display: "block",
                        fontSize: "0.8rem",
                        color: "#475569",
                      }}
                    >
                      • {app}
                    </span>
                  ))
                : storyData.appsToBeDeployed || "None"}
            </span>
          </p>
          <p className="comments-field">
            {/* Free text notes from story record. */}
            <strong>Comments: </strong>{" "}
            <span>{storyData.comments || "No comments."}</span>
          </p>
        </div>

        {/* Right-side action area: edit modal trigger. */}
        <section className="sprint-storyDetails-container3">
          <button
            className="add-app-button"
            onClick={openEditStoryModal}
            style={{
              display: "flex",
              alignItems: "center",
              gap: "5px",
            }}
          >
            <MdEdit /> Edit
          </button>
        </section>
      </div>

      {/* Linked app cards grid: one card per app in `storyData.linkedApps`. */}
      <div className="sprint-storyDetails-grid">
        {appsList.map((appItem, index) => {
          // Prefer explicit appName; use readable fallback if missing.
          const repoName = appItem.appName || "Unknown App";

          return (
            <div key={index} className="sprint-storyDetails-card">
              {/* Card header: app badge. */}
              <div
                className="app-card-header"
                style={{
                  borderBottom: "1px solid #e2e8f0",
                  paddingBottom: "12px",
                  marginBottom: "12px",
                }}
              >
                <span
                  style={{
                    backgroundColor: "#eff6ff",
                    color: "#2563eb",
                    border: "1px solid #bfdbfe",
                    padding: "4px 10px",
                    borderRadius: "8px",
                    fontSize: "1rem",
                    fontWeight: "600",
                    display: "inline-block",
                  }}
                >
                  {repoName}
                </span>
              </div>

              <div className="app-card-body">
                <div>
                  {/* Feature branch block: PR trigger + merge-status badge + refresh. */}
                  <strong>Feature Branch:</strong> <br />
                  {appItem.featureBranch
                    ? (() => {
                        // Build status key for this exact app/branch pair.
                        const branch = appItem.featureBranch;
                        const statusKey = `${repoName}-${branch}`;

                        // Read current status from merged status map.
                        const currentStatus = mergeStatuses[statusKey];

                        return (
                          <div
                            className="storyDetails-feature-branch-item"
                            style={{
                              flexDirection: "column",
                              alignItems: "stretch",
                              gap: "10px",
                            }}
                          >
                            <div
                              style={{
                                display: "flex",
                                justifyContent: "space-between",
                                alignItems: "center",
                                width: "100%",
                              }}
                            >
                              {/* Branch label row. */}
                              <div className="storyDetails-feature-branch-name">
                                <FaCodeBranch color="#3b82f6" />
                                <span className="storyDetails-feature-branch-text">
                                  {branch}
                                </span>
                              </div>

                              {/* Open PR helper modal for this app/branch. */}
                              <button
                                onClick={() => openPrModal(repoName, branch)}
                                className="storyDetails-btn-pr"
                                title="Create Pull Request"
                              >
                                PR
                              </button>
                            </div>

                            <div
                              style={{
                                display: "flex",
                                alignItems: "center",
                                gap: "8px",
                              }}
                            >
                              {/* If status is null we show spinner icon; otherwise text value. */}
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
                                    <FaSync
                                      className="spin-icon"
                                      color="#15803d"
                                    />
                                  )}
                                </strong>
                              </div>

                              {/* Refresh button is shown only after first status resolution. */}
                              {currentStatus && (
                                <button
                                  onClick={() =>
                                    handleSpecificRefresh(
                                      repoName,
                                      repoConfig[repoName]?.orgName,
                                      repoName,
                                      branch,
                                    )
                                  }
                                  style={{
                                    background: "none",
                                    border: "none",
                                    cursor: "pointer",
                                    display: "flex",
                                    padding: "2px",
                                  }}
                                >
                                  <FaSync color="#15803d" size={14} />
                                </button>
                              )}
                            </div>
                          </div>
                        );
                        // If no feature branch is linked, show fallback text.
                      })()
                    : "N/A"}
                </div>

                {/* Remaining app-specific metadata fields. */}
                <p>
                  <strong>Base Branch:</strong> <br />
                  <MdSource /> {appItem.baseBranch || "N/A"}
                </p>
                <p>
                  <strong>Dependencies:</strong> <br />
                  <AiOutlineLink /> {appItem.dependencies || "None"}
                </p>
                <p>
                  <strong>Notes:</strong> <br />
                  <MdNotes /> {appItem.notes || "No notes provided."}
                </p>
              </div>
            </div>
          );
        })}
      </div>

      {/* PR creation helper modal (opens for selected app branch). */}
      <CreatePrModal
        isOpen={isPrModalOpen}
        onClose={() => setIsPrModalOpen(false)}
        appName={prAppData.appName}
        featureBranch={prAppData.featureBranch}
      />

      {/* Story edit modal with preloaded reference datasets. */}
      <StoryModal
        isOpen={isEditModalOpen}
        onClose={() => setIsEditModalOpen(false)}
        handleSave={handleEditStorySave}
        releasesList={releasesList}
        sprintsList={sprintsList}
        saving={savingChanges}
        initialData={storyData}
        existingStories={allStory}
      />
    </div>
  );
};
export default StoryDetails;
