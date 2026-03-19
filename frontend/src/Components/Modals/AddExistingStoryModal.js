import React, { useState, useEffect } from "react";
import { MdClose, MdSearch } from "react-icons/md";
import { fetchAllStories } from "../../Api/api";
import { HashLoader } from "react-spinners";
import "../Modals/EditStoryModal.css";


const AddExistingStoryModal = ({
  isOpen,
  onClose,
  onSelectStory,
  currentSprintStories = [],
}) => {
  const [searchTerm, setSearchTerm] = useState("");
  const [allStories, setAllStories] = useState([]);
  const [loading, setLoading] = useState(false);
  const [visibleCount, setVisibleCount] = useState(20);

  useEffect(() => {
    if (isOpen) {
      const getStories = async () => {
        setLoading(true);
        const data = await fetchAllStories();
        if (data) setAllStories(data);
        setLoading(false);
      };
      getStories();
    } else {
      setSearchTerm("");
      setVisibleCount(20);
    }
  }, [isOpen]);

  useEffect(() => {
    setVisibleCount(20);
  }, [searchTerm]);

  if (!isOpen) return null;



 
  const currentStoryIds = currentSprintStories.map((s) => s._id);
  const availableStoriesToLink = allStories.filter(
    (s) => !currentStoryIds.includes(s._id),
  );
  const filteredStories = availableStoriesToLink.filter(
    (s) =>
      (s.storyId &&
        s.storyId.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (s.storyName &&
        s.storyName.toLowerCase().includes(searchTerm.toLowerCase())),
  );

  const visibleStories = filteredStories.slice(0, visibleCount);

  const handleScroll = (e) => {
    const { scrollTop, clientHeight, scrollHeight } = e.target;
    if (scrollHeight - scrollTop <= clientHeight + 10) {
      if (visibleCount < filteredStories.length) {
        setVisibleCount((prev) => prev + 20);
      }
    }
  };

  return (
    <div className="modal-overlay" style={{ zIndex: 1040 }}>
      <div
        className="modal-content"
        style={{
          width: "500px",
          height: "80vh",
          display: "flex",
          flexDirection: "column",
        }}
      >
        <div className="modal-header">
          <h2>Add Existing Story</h2>
          <MdClose size={28} className="close-icon" onClick={onClose} />
        </div>

        <div style={{ padding: "0 20px 15px 20px" }}>
          <div style={{ position: "relative" }}>
            <MdSearch
              size={22}
              style={{
                position: "absolute",
                left: "10px",
                top: "10px",
                color: "#64748b",
              }}
            />
            <input
              type="text"
              placeholder="Search by Story ID or Name"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="form-input"
              style={{ paddingLeft: "38px" }}
              autoFocus
            />
          </div>
        </div>

        <div
          onScroll={handleScroll}
          style={{ flex: 1, overflowY: "auto", padding: "0 20px 20px 20px" }}
        >
          {loading ? (
            <div
              style={{
                display: "flex",
                justifyContent: "center",
                marginTop: "40px",
              }}
            >
              <HashLoader color="#007bff" size={40} />
            </div>
          ) : visibleStories.length > 0 ? (
            <div
              style={{ display: "flex", flexDirection: "column", gap: "10px" }}
            >
              {visibleStories.map((story) => (
                <div
                  key={story._id}
                  onClick={() => onSelectStory(story._id)}
                  style={{
                    padding: "12px 16px",
                    backgroundColor: "#f8fafc",
                    border: "1px solid #e2e8f0",
                    borderRadius: "8px",
                    cursor: "pointer",
                    transition: "all 0.2s ease",
                  }}
                  onMouseEnter={(e) =>
                    (e.currentTarget.style.borderColor = "#3b82f6")
                  }
                  onMouseLeave={(e) =>
                    (e.currentTarget.style.borderColor = "#e2e8f0")
                  }
                >
                  <div
                    style={{
                      fontWeight: "600",
                      color: "#0f172a",
                      fontSize: "0.95rem",
                    }}
                  >
                    {story.storyId}
                  </div>
                  <div
                    style={{
                      color: "#475569",
                      fontSize: "0.85rem",
                      marginTop: "4px",
                    }}
                  >
                    {story.storyName}
                  </div>
                </div>
              ))}

              {visibleCount < filteredStories.length && (
                <div
                  style={{
                    textAlign: "center",
                    padding: "10px 0",
                    color: "#64748b",
                    fontSize: "0.85rem",
                  }}
                >
                  Loading more...
                </div>
              )}
            </div>
          ) : (
            <p
              style={{
                textAlign: "center",
                color: "#64748b",
                marginTop: "40px",
              }}
            >
              No new stories available to add.
            </p>
          )}
        </div>
      </div>
    </div>
  );
};

export default AddExistingStoryModal;
