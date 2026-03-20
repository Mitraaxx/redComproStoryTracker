import React, { useEffect, useState } from 'react';
import { fetchAllStories, fetchAllSprints, createStory, clearAllCaches, fetchAllReleases } from '../../Api/api';
import { HashLoader } from "react-spinners";
import { useNavigate } from 'react-router-dom';
import '../Stories/StoryList.css';
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import CreateStoryModal from '../Modals/CreateStoryModal';
import { ITEMS_PER_PAGE } from "../../utils/AppConfig";

const StoryList = () => {
  const [stories, setStories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const navigate = useNavigate();

  const [sprintsList, setSprintsList] = useState([]);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [creatingStory, setCreatingStory] = useState(false);

  const [releasesList, setReleasesList] = useState([]);

  const [visibleCount, setVisibleCount] = useState(() => {
    const savedCount = sessionStorage.getItem(`storyList_count`);
    return savedCount ? parseInt(savedCount, 10) : ITEMS_PER_PAGE;
  });

  useEffect(() => {
    sessionStorage.setItem(`storyList_count`, visibleCount);
  }, [visibleCount]);

  const getStoriesAndSprints = async () => {
    try {
      setLoading(true);
      const data = await fetchAllStories();
      setStories(data);
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
      toast.success("Story created successfully");
    } catch (error) {
      console.error(error);
      toast.error(error.message || "Failed to create story");
    } finally {
      setCreatingStory(false);
    }
  };

  const openNewStoryModal = async () => {
    setIsCreateModalOpen(true);

    try {
      const sprintsData = await fetchAllSprints();
      if (sprintsData) setSprintsList(sprintsData);

      const releasesData = await fetchAllReleases();
      if (releasesData) {
        setReleasesList(releasesData);
      }
    } catch (err) {
      console.error("Failed to fetch releases", err);
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

    const visibleStories = filtered.slice(0, visibleCount);

    const scrollToTop = () => {
      window.scrollTo({ top: 0, behavior: "smooth" });
    };

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
            onChange={(e) => {
              setSearchTerm(e.target.value);
              setVisibleCount(ITEMS_PER_PAGE); 
            }}
          />
          <button 
            className="create-story-btn" 
            onClick={openNewStoryModal}
          >
            New Story
          </button>
        </div>
      </div>

      <div className="story-grid">
        {visibleStories.map((story) => (
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