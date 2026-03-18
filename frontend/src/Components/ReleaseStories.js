import React, { useEffect, useState } from "react";
import { fetchReleaseStories, fetchStoryDetails, updateStory, clearAllCaches, updateRelease } from "../Api/api";
import { MdArrowBack, MdEdit, MdClose } from "react-icons/md";
import { HashLoader } from "react-spinners";
import { useParams, useNavigate } from "react-router-dom";
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import AddExistingStoryModal from "./AddExistingStoryModal";
import EditReleaseModal from "./EditReleaseModal";
import "./SprintStories.css"; 
import { APPS_CONFIG } from "../utils/AppConfig";

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
  
  const { releaseId } = useParams();
  const navigate = useNavigate();

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
      <div style={{ display: "flex", justifyContent: "center", alignItems: "center", height: "100vh" }}>
        <HashLoader color="#007bff" size={80} />
      </div>
    );
  }

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
    (app) => !combinedUniqueApps.includes(app.repoName)
  );

  const handleAddManualApp = async () => {
    if (!newManualApp.trim()) return;
    
    if (manualReleaseApps.includes(newManualApp.trim()) || storyApps.includes(newManualApp.trim())) {
      setNewManualApp(""); 
      return;
    }

    const updatedApps = [...manualReleaseApps, newManualApp.trim()];

    try {
      const payload = {
        name: release.name,
        releaseDate: release.releaseDate,
        category: release.category,
        appsToBeDeployed: updatedApps
      };
      
      await updateRelease(releaseId, payload);
      clearAllCaches();
      
      const updatedData = await fetchReleaseStories(releaseId);
      setRelease(updatedData.release);
      setStories(updatedData.stories);
      setNewManualApp("");
      toast.success("App added to release!");
    } catch (err) {
      console.error(err);
      toast.error("Failed to add app");
    }
  };

  const handleRemoveManualApp = async (appToRemove) => {
    const updatedApps = manualReleaseApps.filter(app => app !== appToRemove);

    try {
      const payload = {
        name: release.name,
        releaseDate: release.releaseDate,
        category: release.category,
        appsToBeDeployed: updatedApps
      };
      
      await updateRelease(releaseId, payload);
      clearAllCaches();
      
      const updatedData = await fetchReleaseStories(releaseId);
      setRelease(updatedData.release);
      setStories(updatedData.stories);
      toast.success("App removed from release!");
    } catch (err) {
      console.error(err);
      toast.error("Failed to remove app");
    }
  };

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
      
      toast.success("Story successfully added to this Release!");
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

  const handleReleaseSave = async (e) => {
    e.preventDefault();
    const isNameSame = (releaseFormData.name || "") === (release?.name || "");
    const isDateSame = (releaseFormData.releaseDate || "") === formatDateForInput(release?.releaseDate);
    const isCatSame = (releaseFormData.category || "") === (release?.category || "");

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

      toast.success("Release updated successfully!");
    } catch (error) {
      console.error("Release Save error:", error);
      toast.error(error.message || "Release Name exists");
    } finally {
      setSavingRelease(false);
    }
  };


  const filtered = stories?.filter((item) => {
    const search = searchTerm.trim().toLowerCase();
    const storyName = item.storyName?.toLowerCase() || "";
    const storyId = item.storyId?.toLowerCase() || "";
    return storyName.includes(search) || storyId.includes(search);
  }) || [];

  return (
    <div className="sprint-story-container">
      <ToastContainer position="top-right" autoClose={3000} />

      <div className="sprint-story-container2">
        <section>
          <div className="sprint-title-group">
            <h2 className="sprint-story-title">{release?.name}</h2>
            <button onClick={openReleaseEditModal} className="sprint-edit-btn" title="Edit Release">
              <MdEdit size={15} />
            </button>
          </div>
          <p className="sprint-date-badge" style={{ padding: "4px 8px", fontSize: "0.75rem" }}>
            <strong>Release Date: </strong>
            {release?.releaseDate
              ? new Date(release.releaseDate).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" })
              : "TBD"}
          </p>
          <p className="sprint-date-badge" style={{ padding: "4px 8px", fontSize: "0.75rem" }}>
            <strong>Category: </strong>
            {release?.category || "General"}
          </p>
        </section>

        <div className="relTop-btn-group">
        <button 
          className="relTop-btn-pr"
        >
          Master
        </button>
        <button 
          className="relTop-btn-pr"
        >
          Alpha
        </button>
        <button 
          className="relTop-btn-pr"
        >
          HFX
        </button>
      </div>

        <section className="sprint-story-container3">
          <div className="story-search-header">
            <input type="text" className="story-search-input" placeholder="Search" value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} />
          </div>
          <button className="btn-add-existing" onClick={() => setIsAddExistingModalOpen(true)}>Add Existing</button>
          <button onClick={handleBack} className="back-button"><MdArrowBack /></button>
        </section>
      </div>

      <div style={{
        display: "flex", alignItems: "center", gap: "10px", flexWrap: "wrap", 
        marginBottom: "25px", padding: "12px 18px", backgroundColor: "#f8fafc", 
        borderRadius: "10px", border: "1px solid #e2e8f0" 
      }}>
        <strong style={{ fontSize: "0.9rem", color: "#334155" }}>Apps to be deployed: </strong>
        
        {combinedUniqueApps.length > 0 ? combinedUniqueApps.map((app, idx) => {
          const isFromStory = storyApps.includes(app);
          return (
            <span key={idx} style={{ 
              backgroundColor: "#eff6ff", color: "#2563eb", padding: "4px 10px", 
              borderRadius: "6px", fontSize: "0.8rem", border: "1px solid #bfdbfe", 
              fontWeight: "600", display: "inline-flex", alignItems: "center", gap: "6px" 
            }}>
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
        }) : <span style={{ color: "#64748b", fontSize: "0.85rem" }}>None yet</span>}
        
        <div style={{ display: "flex", gap: "6px", alignItems: "center", marginLeft: "auto" }}>
          <input
            list="release-apps-options"
            type="text"
            value={newManualApp}
            onChange={(e) => setNewManualApp(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleAddManualApp()}
            placeholder="Select app to add..."
            style={{ padding: "6px 10px", borderRadius: "6px", border: "1px solid #cbd5e1", fontSize: "0.8rem", width: "160px", outline: "none" }}
          />
          <datalist id="release-apps-options">
            {availableAppsForManualAdd.map((app, i) => (
              <option key={i} value={app.repoName}>{app.repoName}</option>
            ))}
          </datalist>
          <button 
            onClick={handleAddManualApp} 
            style={{ backgroundColor: "#16a34a", color: "white", border: "none", borderRadius: "6px", padding: "6px 14px", fontSize: "0.8rem", cursor: "pointer", fontWeight: "600" }}
          >
            Add
          </button>
        </div>
      </div>

      

      <div className="sprint-story-grid">
        {filtered.length > 0 ? (
          filtered.map((story) => (
            <div
              key={story._id}
              onClick={() => handleStoryClick(story._id)}
              className="sprint-story-card"
            >
              <p><strong>Story Name: </strong>{story?.storyName}</p>
              <p><strong>Story ID: </strong> {story?.storyId}</p>
              <p><strong>Assigned: </strong> {story?.responsibility}</p>
              <p><strong>First Review: </strong> {story?.firstReview}</p>
              <p>
              <strong>Release Date: </strong>
              {new Date(story?.qaEnvRelDate).toLocaleDateString("en-IN", {
                day: "2-digit", month: "short", year: "numeric",
              })}
            </p>
              <p><strong>Story Points: </strong> {story?.storyPoints}</p>
              <div className="story-comments">
              <strong>Comments: </strong>
              <span>{story?.comments || "No comments."}</span>
              </div>
              <button className="prForRel-btn">
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