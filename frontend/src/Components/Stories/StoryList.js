import React, { useEffect, useState } from 'react';
import { fetchAllStories, fetchAllSprints, createStory, clearAllCaches,fetchAllReleases } from '../../Api/api';
import { HashLoader } from "react-spinners";
import { useNavigate } from 'react-router-dom';
import '../Stories/StoryList.css';
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import CreateStoryModal from '../Modals/CreateStoryModal';

const StoryList = () => {
  const [stories, setStories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const navigate = useNavigate();

 
  const [sprintsList, setSprintsList] = useState([]);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [creatingStory, setCreatingStory] = useState(false);

  const [releasesList, setReleasesList] = useState([]);

  
  const getStoriesAndSprints = async () => {
    try {
      setLoading(true);
      const data = await fetchAllStories();
      setStories(data);
      const sprintsData = await fetchAllSprints();
      if (sprintsData) setSprintsList(sprintsData);

      const releasesData = await fetchAllReleases();
      if (releasesData) setReleasesList(releasesData);
    } catch (err) {
      console.log(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    getStoriesAndSprints();
  }, []);

  
  const handleCreateNewStory = async (storyDataWithApps) => {
    setCreatingStory(true);
    try {
      await createStory(storyDataWithApps);
      
      setIsCreateModalOpen(false); 
      clearAllCaches(); 
      await getStoriesAndSprints(); 
      toast.success("Story created successfully! 🚀");
    } catch (error) {
      console.error(error);
      toast.error(error.message || "Failed to create story");
    } finally {
      setCreatingStory(false);
    }
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

  const handleStoryClick = (storyDbId) => {
    navigate(`/stories/${storyDbId}`);
  };

  const filtered =
    stories?.filter((item) => {
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
    }) || [];

  return (
    <div className="story-container">
      <ToastContainer position="top-right" autoClose={3000} />
      
      <div className="story-container2">
        <h2 className="story-title">Story List</h2>
        <div className="story-search-header">
          <input
            type="text"
            className="story-search-input"
            placeholder="Search"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
          <button 
            className="create-story-btn" 
            onClick={() => setIsCreateModalOpen(true)}
          >
            New Story
          </button>
        </div>
      </div>

      <div className="story-grid">
        {filtered.map((story) => (
          <div
            key={story._id}
            onClick={() => handleStoryClick(story._id)}
            className="story-card"
          >
            <p>
              <strong>Story Name: </strong>
              {story.storyName}
            </p>
            <p>
              <strong>Story ID: </strong> {story.storyId}
            </p>
            <p>
              <strong>Assigned: </strong> {story.responsibility}
            </p>
            <p>
              <strong>First Review: </strong> {story?.firstReview}
            </p>
            <p>
              <strong>Release Date: </strong>
              {story.qaEnvRelDate ? new Date(story.qaEnvRelDate).toLocaleDateString("en-IN", {
                day: "2-digit",
                month: "short",
                year: "numeric",
              }) : "N/A"}
            </p>
            <p>
              <strong>Story Points: </strong> {story.storyPoints}
            </p>
            <div className="story-comments">
              <strong>Comments: </strong>
              <span>{story?.comments || "No comments."}</span>
            </div>
          </div>
        ))}
      </div>

      <CreateStoryModal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        handleSave={handleCreateNewStory}
        releasesList={releasesList}
        saving={creatingStory}
        sprintsList={sprintsList} 
        initialSprintName="" 
      />
    </div>
  );
};

export default StoryList;