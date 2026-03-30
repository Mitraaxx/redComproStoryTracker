import React, { useEffect, useState } from "react";
import {
  fetchStoryDetails,
  updateStory,
  updateStoryApps,
  clearAllCaches,
  fetchAllSprints,
  fetchAllReleases,
  fetchBranchMergeStatus ,
} from "../../Api/api";
import { HashLoader } from "react-spinners";
import { MdArrowBack, MdSource, MdNotes, MdEdit } from "react-icons/md";
import { FaCodeBranch,FaSync } from "react-icons/fa";
import { AiOutlineLink } from "react-icons/ai";
import { useParams, useNavigate } from "react-router-dom";
import "../Sprints/StoryDetails.css";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import CreatePrModal from "../Modals/CreatePrModal";
import UnifiedEditModal from "../Modals/UnifiedEditModal";
import { useAuth } from "@clerk/clerk-react"; 
import { repoConfig } from "../../utils/AppConfig"; 

/**
 * Component to display the comprehensive details of a specific story.
 * Handles displaying story metadata, linked applications, feature branches,
 * and provides functionalities to edit the story or trigger Pull Requests.
 */
const StoryDetails = () => {
  const [loading, setLoading] = useState(true);
  const [storyData, setStoryData] = useState(null);

  const [sprintsList, setSprintsList] = useState([]);

  const { storyId } = useParams();
  const navigate = useNavigate();

  const [isPrModalOpen, setIsPrModalOpen] = useState(false);
  const [prAppData, setPrAppData] = useState({
    appName: "",
    featureBranch: "",
  });

  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [savingChanges, setSavingChanges] = useState(false);

  const [releasesList, setReleasesList] = useState([]);

  const { getToken } = useAuth();
  const [mergeStatuses, setMergeStatuses] = useState({});

  /**
   * Effect hook fetches all fields required for githubstatus api call
   * and gives post request to the api whenever new user is logged in or
   * any storyData is changed
   */
  useEffect(() => {
    const fetchAllStatuses = async () => {
      if (!storyData?.linkedApps) return;

      try {
        const token = await getToken();
        const newStatuses = { ...mergeStatuses };

        for (const appItem of storyData.linkedApps) {
          const appName = appItem.appRef?.name;
          const config = repoConfig[appName];

          if (config && appItem.featureBranches?.length > 0) {
            const { orgName, repoName } = config;

            for (const branch of appItem.featureBranches) {
              const key = `${appName}-${branch}`;
              
              if (!newStatuses[key]) {
                const res = await fetchBranchMergeStatus(orgName, repoName, branch, token);
                newStatuses[key] = res.mergedTill || "Not Merged";
              }
            }
          }
        }
        setMergeStatuses(newStatuses);
      } catch (err) {
        console.error("Error fetching statuses:", err);
      }
    };

    fetchAllStatuses();
  }, [storyData, getToken]);

  /**
   * Opens the Pull Request modal and sets the context for the selected app and branch.
   */
  const openPrModal = (appName, featureBranch) => {
    setPrAppData({ appName: appName || "Unknown", featureBranch });
    setIsPrModalOpen(true);
  };

  /**
   * Fetches the detailed information of the current story from the backend API,
   * along with the list of available sprints to populate dropdowns if editing.
   */
  const getStoryDetails = async () => {
    try {
      setLoading(true);
      const data = await fetchStoryDetails(storyId);
      setStoryData(data);

      const sprintsData = await fetchAllSprints();
      if (sprintsData) {
        setSprintsList(sprintsData);
      }
    } catch (err) {
      console.log(err);
    } finally {
      setLoading(false);
    }
  };

  /**
   * Effect hook to trigger the data fetch when the component mounts
   * or when the storyId URL parameter changes.
   */
  useEffect(() => {
    if (storyId) {
      getStoryDetails();
    }
  }, [storyId]);

  /**
   * Handles saving modifications made to the story.
   * Separates core story fields from linked application data and updates both via API.
   */
  const handleEditStorySave = async (updatedDataWithApps) => {
    setSavingChanges(true);
    try {
      const { appsData, ...storyFields } = updatedDataWithApps;

      await updateStory(storyData.storyId, storyFields);
      await updateStoryApps(storyData.storyId, appsData);

      setIsEditModalOpen(false);
      clearAllCaches();

      await getStoryDetails();
      toast.success("Update Successful");
    } catch (error) {
      console.error(error);
      toast.error(error.message || "Update Failed");
    } finally {
      setSavingChanges(false);
    }
  };

  /**
   * Opens the comprehensive edit modal for the story.
   * Concurrently fetches the latest release data required for the form dropdowns.
   */
  const openEditStoryModal = async () => {
    setIsEditModalOpen(true);

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
   * Navigates the user back to the previous page in their browser history.
   */
  const handleBack = () => {
    navigate(-1);
  };

  /**
   * This function only refresh a single github status of merge till
   */
  const handleSpecificRefresh = async (appName, orgName, repoName, branch) => {
    const statusKey = `${appName}-${branch}`;
    const token = await getToken();

    setMergeStatuses(prev => ({
      ...prev,
      [statusKey]: null, 
    }));

    try {
      console.log(`Force refreshing status for: ${statusKey}`);
      const res = await fetchBranchMergeStatus(orgName, repoName, branch, token, true);

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

  if (loading) {
    return (
      <div
        className="loader-container"
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

  if (!storyData) return <div>Loading...</div>;

  const appsList = storyData?.linkedApps || [];

  return (
    <div className="sprint-storyDetails-container">
      <div
        className="extra-box"
        style={{
          justifyContent: "flex-start",
          marginLeft: "1rem",
          marginBottom: "1rem",
        }}
      >
        <button onClick={handleBack} className="back-button">
          <MdArrowBack />
        </button>
      </div>
      <div className="sprint-storyDetails-container2">
        <div className="sprint-storyDetails-container2-5">
          <p>
            <strong>Story Name: </strong>
            <span>{storyData.storyName}</span>
          </p>
          <p>
            <strong>Story ID: </strong> {storyData.storyId}
          </p>
          <p>
            <strong>Sprint: </strong> {storyData.sprint?.name || "N/A"}
          </p>
          <p>
            <strong>Release Tag: </strong>{" "}
            <span id="release-tag">{storyData.releaseTag}</span>
          </p>
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
            <strong>Responsibility: </strong>{" "}
            <span>{storyData.responsibility}</span>
          </p>
          <p>
            <strong>First Review: </strong> <span>{storyData.firstReview}</span>
          </p>
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
                    { day: "2-digit", month: "short", year: "numeric" },
                  )
                : "N/A"}
            </span>
          </p>
          <p>
            <strong>Type: </strong> <span>{storyData.type}</span>
          </p>
          <p>
            <strong>Apps to be deployed: </strong>
            <span style={{ marginTop: "4px" }}>
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
            <strong>Comments: </strong>{" "}
            <span>{storyData.comments || "No comments."}</span>
          </p>
        </div>

        <section className="sprint-storyDetails-container3">
          <button
            className="add-app-button"
            onClick={openEditStoryModal}
            style={{ display: "flex", alignItems: "center", gap: "5px" }}
          >
            <MdEdit /> Edit
          </button>
        </section>
      </div>

      <div className="sprint-storyDetails-grid">
        {appsList.map((appItem, index) => {
          const repoName = appItem.appRef?.name || "Unknown App";

          return (
            <div key={index} className="sprint-storyDetails-card">
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
                  <strong>Feature Branch:</strong> <br />
                  {appItem.featureBranches && appItem.featureBranches.length > 0
                    ? appItem.featureBranches.map((branch, i) => {
                        const statusKey = `${repoName}-${branch}`;
                        const currentStatus = mergeStatuses[statusKey];

                        return (
                          <div
                            key={i}
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
                              <div className="storyDetails-feature-branch-name">
                                <FaCodeBranch color="#3b82f6" />
                                <span className="storyDetails-feature-branch-text">
                                  {branch}
                                </span>
                              </div>
                              <button
                                onClick={() => openPrModal(repoName, branch)}
                                className="storyDetails-btn-pr"
                                title="Create Pull Request"
                              >
                                PR
                              </button>
                            </div>

                            <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                              <div className="merged-till-badge" style={{ margin: 0 }}>
                                Merged Till:{" "}
                                <strong>
                                  {currentStatus ? (
                                    currentStatus 
                                  ) : (
                                    <FaSync className="spin-icon" color="#15803d" /> 
                                  )}
                                </strong>
                              </div>

                              {currentStatus && (
                                <button
                                  onClick={() => {
                                    const config = repoConfig[repoName];
                                    if (config) {
                                      handleSpecificRefresh(repoName, config.orgName, repoName, branch);
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
                      })
                    : "N/A"}
                </div>
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

      <CreatePrModal
        isOpen={isPrModalOpen}
        onClose={() => setIsPrModalOpen(false)}
        appName={prAppData.appName}
        featureBranch={prAppData.featureBranch}
      />

      <UnifiedEditModal
        isOpen={isEditModalOpen}
        onClose={() => setIsEditModalOpen(false)}
        handleSave={handleEditStorySave}
        releasesList={releasesList}
        sprintsList={sprintsList}
        saving={savingChanges}
        initialData={storyData}
      />
      <ToastContainer />
    </div>
  );
};

export default StoryDetails;
