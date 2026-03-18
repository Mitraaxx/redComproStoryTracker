import React, { useEffect, useState } from "react";
import { fetchStoryDetails, updateStory, updateStoryApps, clearAllCaches, fetchAllSprints, fetchAllReleases } from "../Api/api";
import { HashLoader } from "react-spinners";
import { MdArrowBack, MdSource, MdNotes, MdEdit } from "react-icons/md";
import { FaCodeBranch, FaGithub } from "react-icons/fa";
import { AiOutlineLink } from "react-icons/ai";
import { useParams, useNavigate } from "react-router-dom";
import "./StoryDetails.css";
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import CreatePrModal from "./CreatePrModal";
import UnifiedEditModal from "./UnifiedEditModal";
import { APPS_CONFIG } from "../utils/AppConfig";

const StoryDetails = () => {
  const [loading, setLoading] = useState(true);
  const [storyData, setStoryData] = useState(null);
  
  const [sprintsList, setSprintsList] = useState([]);
  
  const { storyId } = useParams();
  const navigate = useNavigate();

  const [isPrModalOpen, setIsPrModalOpen] = useState(false);
  const [prAppData, setPrAppData] = useState({ appName: "", featureBranch: "" });

  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [savingChanges, setSavingChanges] = useState(false);

  const [releasesList, setReleasesList] = useState([]);

  const openPrModal = (appName, featureBranch) => {
    setPrAppData({ appName: appName || "Unknown", featureBranch });
    setIsPrModalOpen(true);
  };

  const getStoryDetails = async () => {
    try {
      setLoading(true);
      const data = await fetchStoryDetails(storyId);
      setStoryData(data);

      const sprintsData = await fetchAllSprints();
      if(sprintsData) {
        setSprintsList(sprintsData);
      }

      const releasesData = await fetchAllReleases();
      if (releasesData) setReleasesList(releasesData);
    } catch (err) {
      console.log(err);
    } finally {
      setLoading(false);
    }
  };

  const handleEditStorySave = async (updatedDataWithApps) => {
    setSavingChanges(true);
    try {
      const { appsData, ...storyFields } = updatedDataWithApps;
      
      await updateStory(storyData.storyId, storyFields);
      await updateStoryApps(storyData.storyId, appsData);
      
      setIsEditModalOpen(false);
      clearAllCaches();
      
      await getStoryDetails();
      toast.success("Story and Apps updated successfully!");
    } catch (error) {
      console.error(error);
      toast.error(error.message || "Failed to update story");
    } finally {
      setSavingChanges(false);
    }
  };

  useEffect(() => {
    if (storyId) {
      getStoryDetails();
    }
  }, [storyId]);

  const handleBack = () => {
    navigate(-1);
  };

  if (loading) {
    return (
      <div className="loader-container" style={{ display: "flex", justifyContent: "center", alignItems: "center", height: "100vh" }}>
        <HashLoader color="#007bff" size={80} />
      </div>
    );
  }

  if (!storyData) return <div>Loading...</div>;

  const appsList = storyData?.linkedApps || [];

  return (
    <div className="sprint-storyDetails-container">
      <div className="sprint-storyDetails-container2">
        <div className="sprint-storyDetails-container2-5">
          <p><strong>Story Name: </strong><span>{storyData.storyName}</span></p>
          <p><strong>Story ID: </strong> {storyData.storyId}</p>
          <p><strong>Sprint: </strong> {storyData.sprint?.name || "N/A"}</p>
          <p><strong>Release Tag: </strong> <span id="release-tag">{storyData.releaseTag}</span></p>
          <p><strong>Story Points: </strong> <span>{storyData.storyPoints}</span></p>
          <p><strong>EPIC: </strong> <span>{storyData.epic}</span></p>
          <p><strong>Category: </strong> <span>{storyData.category}</span></p>
          <p><strong>Responsibility: </strong> <span>{storyData.responsibility}</span></p>
          <p><strong>First Review: </strong> <span>{storyData.firstReview}</span></p>
          <p>
            <strong>Release Date: </strong>{" "}
            <span>
              {storyData?.qaEnvRelDate
                ? new Date(storyData.qaEnvRelDate).toLocaleDateString("en-IN", {
                    day: "2-digit", month: "short", year: "numeric",
                  }) : "N/A"}
            </span>
          </p>
          <p><strong>Status: </strong> <span>{storyData.status}</span></p>
          <p>
            <strong>Live Env release: </strong>{" "}
            <span>
              {storyData?.liveEnvRelease
                ? new Date(storyData.liveEnvRelease).toLocaleDateString(
                    "en-IN", { day: "2-digit", month: "short", year: "numeric" },
                  ) : "N/A"}
            </span>
          </p>
          <p><strong>Type: </strong> <span>{storyData.type}</span></p>
          <p><strong>Apps to be deployed: </strong> <span>{`${storyData.appsToBeDeployed},`}</span></p>
          <p className="comments-field"><strong>Comments: </strong> <span>{storyData.comments || "No comments."}</span></p>
        </div>

        <section className="sprint-storyDetails-container3">
          <button className="add-app-button" onClick={() => setIsEditModalOpen(true)} style={{display: 'flex', alignItems: 'center', gap: '5px'}}>
            <MdEdit /> Edit
          </button>
          <button onClick={handleBack} className="back-button">
            <MdArrowBack />
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
                    ? appItem.featureBranches.map((branch, i) => (
                        <div
                          key={i}
                          className="storyDetails-feature-branch-item"
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
                      ))
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