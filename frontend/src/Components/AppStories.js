import React, { useEffect, useState } from "react";
import { fetchAppStories } from "../Api/api";
import { MdArrowBack } from "react-icons/md";
import { HashLoader } from "react-spinners";
import { useParams, useNavigate } from "react-router-dom";
import "./SprintStories.css"; 

const AppStories = () => {
  const [stories, setStories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  
  const { appName } = useParams();
  const navigate = useNavigate();

  useEffect(() => {
    const getStories = async () => {
      try {
        setLoading(true);
        const data = await fetchAppStories(appName);
        if (data) setStories(data.stories);
      } catch (err) {
        console.log(err);
      } finally {
        setLoading(false);
      }
    };
    if (appName) getStories();
  }, [appName]);

  if (loading) return <div style={{ display: "flex", justifyContent: "center", alignItems: "center", height: "100vh" }}><HashLoader color="#007bff" size={80} /></div>;

  const filtered = stories.filter(item => 
    item.storyName?.toLowerCase().includes(searchTerm.toLowerCase()) || 
    item.storyId?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="sprint-story-container">
      <div className="sprint-story-container2">
        <section>
          <div className="sprint-title-group">
            <h2 className="sprint-story-title">{appName}</h2>
          </div>
        </section>

        <section className="sprint-story-container3">
          <div className="story-search-header">
            <input type="text" className="story-search-input" placeholder="Search" value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} />
          </div>
          <button onClick={() => navigate(-1)} className="back-button"><MdArrowBack /></button>
        </section>
      </div>

      <div className="sprint-story-grid">
        {filtered.length > 0 ? filtered.map((story) => (
          <div key={story._id} onClick={() => navigate(`/apps/${appName}/stories/${story._id}`)} className="sprint-story-card">
            <p><strong>Story Name: </strong>{story?.storyName}</p>
            <p><strong>Story ID: </strong> {story?.storyId}</p>
            <p><strong>Assigned: </strong> {story?.responsibility}</p>
            <p><strong>First Review: </strong> {story?.firstReview}</p>
            <p>
              <strong>Release Date: </strong>
              {story?.qaEnvRelDate ? new Date(story.qaEnvRelDate).toLocaleDateString("en-IN", {
                day: "2-digit", month: "short", year: "numeric",
              }) : "N/A"}
            </p>
            <p><strong>Story Points: </strong> {story?.storyPoints}</p>
            <div className="story-comments">
              <strong>Comments: </strong>
              <span>{story?.comments || "No comments."}</span>
            </div>
          </div>
        )) : <p style={{ color: "#64748b", marginTop: "20px" }}>No stories linked to this app yet.</p>}
      </div>
    </div>
  );
};

export default AppStories;