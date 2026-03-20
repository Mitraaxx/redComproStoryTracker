import React, { useEffect, useState } from "react";
import { fetchSprintStories, clearAllCaches, updateSprint, createStory,fetchAllSprints,fetchStoryDetails,updateStory,updateStoryApps,fetchAllReleases} from "../../Api/api";
import { MdArrowBack, MdEdit } from "react-icons/md";
import { HashLoader } from "react-spinners";
import { useParams, useNavigate } from "react-router-dom";
import "../Sprints/SprintStories.css";
import EditSprintModal from "../Modals/EditSprintModal";
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import CreateStoryModal from "../Modals/CreateStoryModal";
import AddExistingStoryModal from "../Modals/AddExistingStoryModal";
import { ITEMS_PER_PAGE } from "../../utils/AppConfig";


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
  const [isUnifiedEditOpen, setIsUnifiedEditOpen] = useState(false);
  
  const [storyToEdit, setStoryToEdit] = useState(null);
  const [sprintsList, setSprintsList] = useState([]);

  const [releasesList, setReleasesList] = useState([]);

  const [visibleCount, setVisibleCount] = useState(() => {
    const savedCount = sessionStorage.getItem(`sprint_${sprintId}_count`);
    return savedCount ? parseInt(savedCount, 10) : ITEMS_PER_PAGE;
  });

  useEffect(() => {
    sessionStorage.setItem(`sprint_${sprintId}_count`, visibleCount);
  }, [visibleCount, sprintId]);

  useEffect(() => {
    const getStories = async () => {
      try {
        setLoading(true);
        const data = await fetchSprintStories(sprintId);
        setStories(data.stories);
        setSprint(data.sprint);

        const allSprintsData = await fetchAllSprints();
        if (allSprintsData) setSprintsList(allSprintsData);
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

  const handleStoryClick = (storyDbId) => {
    navigate(`/sprints/${sprintId}/stories/${storyDbId}`);
  };

  const handleBack = () => {
    navigate("/sprints");
  };

  // ================= SPRINT EDIT LOGIC =================
  const formatDateForInput = (dateString) => {
    if (!dateString) return "";
    return new Date(dateString).toISOString().split("T")[0];
  };

  const openSprintEditModal = () => {
    setSprintFormData({
      name: sprint?.name || "",
      startDate: formatDateForInput(sprint?.startDate),
      endDate: formatDateForInput(sprint?.endDate),
      sprintNotes: sprint?.sprintNotes || "",
    });
    setIsSprintModalOpen(true);
  };

  const handleSprintChange = (e) => {
    setSprintFormData({ ...sprintFormData, [e.target.name]: e.target.value });
  };

  const handleSprintSave = async (e) => {
    e.preventDefault();
    const isNameSame = (sprintFormData.name || "") === (sprint?.name || "");
    const isStartSame = (sprintFormData.startDate || "") === formatDateForInput(sprint?.startDate);
    const isEndSame = (sprintFormData.endDate || "") === formatDateForInput(sprint?.endDate);
    const isNotesSame = (sprintFormData.sprintNotes || "") === (sprint?.sprintNotes || "");

    if (isNameSame && isStartSame && isEndSame && isNotesSame) {
      console.log("No sprint changes detected. Skipping API call.");
      setIsSprintModalOpen(false); 
      return;
    }

    setSavingSprint(true);
    try {
      await updateSprint(sprintId, sprintFormData)

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
  
  const handleUnifiedEditSave = async (updatedDataWithApps) => {
    setCreatingStory(true); 
    try {
      const { appsData, ...storyFields } = updatedDataWithApps;
      
      await updateStory(storyToEdit.storyId, storyFields);
      await updateStoryApps(storyToEdit.storyId, appsData);
      
      setIsUnifiedEditOpen(false); 
      clearAllCaches();
      
      setLoading(true);
      const updatedData = await fetchSprintStories(sprintId, true);
      setStories(updatedData.stories);
      setSprint(updatedData.sprint);
      setLoading(false);

      toast.success("Story added to this Sprint successfully");
    } catch (error) {
      toast.error(error.message || "Failed to update story");
    } finally {
      setCreatingStory(false);
    }
  };

  const filtered =
    stories
      ?.filter((item) => {
        const search = searchTerm.trim().toLowerCase();

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
            <button 
               className="create-story-btn" 
               onClick={openCreateStoryModal}
            >
              New Story
            </button>
          </div>

          <button onClick={handleBack} className="back-button">
            <MdArrowBack />
          </button>
        </section>
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