import React, { useEffect, useState } from "react";
import { fetchAllReleases, createRelease } from "../../Api/api";
import { HashLoader } from "react-spinners";
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import CreateReleaseModal from "../Modals/CreateReleaseModal";
import "../Sprints/SprintList.css"; 
import "../Release/ReleaseList.css";
import { useNavigate } from "react-router-dom"; 
import { ITEMS_PER_PAGE } from "../../utils/AppConfig";

const ReleaseList = () => {
  const [releases, setReleases] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [formData, setFormData] = useState({ name: "", releaseDate: "", category: "" });
  const [saving, setSaving] = useState(false);

  const navigate = useNavigate();

  const [visibleCount, setVisibleCount] = useState(() => {
    const savedCount = sessionStorage.getItem(`releaseList_count`);
    return savedCount ? parseInt(savedCount, 10) : ITEMS_PER_PAGE;
  });

  useEffect(() => {
    sessionStorage.setItem(`releaseList_count`, visibleCount);
  }, [visibleCount]);

  const handleReleaseClick = (releaseId) => {
    navigate(`/releases/${releaseId}/stories`); 
  };

  const getReleases = async () => {
    try {
      setLoading(true);
      const data = await fetchAllReleases();
      setReleases(data || []);
    } catch (err) {
      console.log(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    getReleases();
  }, []);

  const handleOpenModal = () => {
    setFormData({ name: "", releaseDate: "", category: "" });
    setIsModalOpen(true);
  };

  const handleChange = (e) => setFormData({ ...formData, [e.target.name]: e.target.value });

  const handleSave = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      await createRelease(formData);
      setIsModalOpen(false);
      await getReleases(); 
      toast.success("Release created successfully");
    } catch (error) {
      toast.error(error.message || "Failed to create release");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div style={{ display: "flex", justifyContent: "center", alignItems: "center", height: "100vh" }}>
        <HashLoader color="#007bff" size={80} />
      </div>
    );
  }

  const filtered = releases.filter((item) => 
    item.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    item.category?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const visibleRelease = filtered.slice(0, visibleCount);

  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  return (
    <div className="sprint-container">
      <ToastContainer position="top-right" autoClose={3000} />
      
      <div className="sprint-container2">
        <h2 className="sprint-title">Releases</h2>
        <div className="sprint-search-header">
          <input
            type="text"
            className="sprint-search-input"
            placeholder="Search"
            value={searchTerm}
            onChange={(e) => {
              setSearchTerm(e.target.value);
              setVisibleCount(ITEMS_PER_PAGE);
            }}
          />
          <button className="create-sprint-button" onClick={handleOpenModal}>Add Release</button>
        </div>
      </div>

      <div className="sprint-grid">
        {visibleRelease.map((release) => (
          <div key={release._id} className="release-card" onClick={() => handleReleaseClick(release._id)}>
            <div className="release-card-header">
              <span className="release-name">{release.name}</span>
              <span className="release-category-tag">{release.category || "General"}</span>
            </div>
            
            <div style={{ color: "#64748b", fontSize: "0.9rem" }}>
              <strong>Date: </strong> 
              {release.releaseDate ? new Date(release.releaseDate).toLocaleDateString("en-IN", {
                day: "2-digit", month: "short", year: "numeric"
              }) : "TBD"}
            </div>

          </div>
        ))}
        {visibleRelease.length === 0 && <p style={{ textAlign: "center", width: "100%", color: "#64748b" }}>No releases found.</p>}
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

      <CreateReleaseModal
        isOpen={isModalOpen} onClose={() => setIsModalOpen(false)}
        formData={formData} handleChange={handleChange}
        handleSave={handleSave} saving={saving}
      />
    </div>
  );
};

export default ReleaseList;