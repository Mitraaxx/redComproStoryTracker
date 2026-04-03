import React, { useEffect, useState } from "react";
import { fetchAllReleases, createRelease } from "../../Api/api";
import { HashLoader } from "react-spinners";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import "../Sprints/SprintList.css";
import "../Release/ReleaseList.css";
import { useNavigate } from "react-router-dom";
import { ITEMS_PER_PAGE } from "../../utils/AppConfig";
import { AiOutlineArrowUp } from "react-icons/ai";
import ReleaseModal from "../Modals/ReleaseModal";

/**
 * Main component to render and manage the global list of software releases.
 * Provides functionalities to view, search, paginate, and create new releases.
 */
const ReleaseList = () => {
  const [releases, setReleases] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [saving, setSaving] = useState(false);

  // For load more at bottom
  const [isAtBottom, setIsAtBottom] = useState(false);

  const navigate = useNavigate();

  /**
   * Initializes pagination count from cache or defaults to ITEMS_PER_PAGE.
   */
  const [visibleCount, setVisibleCount] = useState(() => {
    const savedCount = sessionStorage.getItem(`releaseList_count`);
    return savedCount ? parseInt(savedCount, 10) : ITEMS_PER_PAGE;
  });

  /**
   * Persists the current pagination limit in session storage.
   */
  useEffect(() => {
    sessionStorage.setItem(`releaseList_count`, visibleCount);
  }, [visibleCount]);

  /**
   * Navigates to the detailed view of a specific release.
   */
  const handleReleaseClick = (releaseId) => {
    navigate(`/releases/${releaseId}/stories`);
  };

  // Universal function to check scroll as well as height(for big viewport)
  const checkBottom = () => {
    const windowHeight = window.innerHeight;
    const scrollY = window.scrollY;
    const documentHeight = document.documentElement.scrollHeight;

    if (
      documentHeight <= windowHeight + 10 ||
      windowHeight + scrollY >= documentHeight - 50
    ) {
      setIsAtBottom(true);
    } else {
      setIsAtBottom(false);
    }
  };

  /**
   * Effect hook to manage scroll and resize events
   */
  useEffect(() => {
    window.addEventListener("scroll", checkBottom);
    window.addEventListener("resize", checkBottom);

    checkBottom();

    return () => {
      window.removeEventListener("scroll", checkBottom);
      window.removeEventListener("resize", checkBottom);
    };
  }, []);

  /**
   * Effect hook to make sure whenever the data changes to
   * recalculate the height
   */
  useEffect(() => {
    const timeout = setTimeout(() => {
      checkBottom();
    }, 100);
    return () => clearTimeout(timeout);
  }, [visibleCount, searchTerm]);

  /**
   * Fetches the complete list of available releases from the API.
   */
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

  /**
   * Opens the Create Release modal and resets the form data.
   */
  const handleOpenModal = () => {
    setIsModalOpen(true);
  };


  /**
   * Submits the new release data to the API, refreshes the release list,
   * and handles toast notifications for success or failure..
   */
  const handleSave = async (newReleaseData) => {
    setSaving(true);
    try {
      await createRelease(newReleaseData);
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

  /**
   * Filters the release list based on search term (name or category).
   */
  const filtered = releases
    .filter(
      (item) =>
        item.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.category?.toLowerCase().includes(searchTerm.toLowerCase()),
    )
    .sort((a, b) => {
      const dateA = a.releaseDate ? new Date(a.releaseDate).getTime() : 0;
      const dateB = b.releaseDate ? new Date(b.releaseDate).getTime() : 0;

      return dateB - dateA;
    });
  const visibleRelease = filtered.slice(0, visibleCount);

  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  return (
    <div className="sprint-container">
      <ToastContainer position="top-right" autoClose={3000} />

      <div className="sprint-container2">
        <h3 className="sprint-title">Releases</h3>
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
          <button className="create-sprint-button" onClick={handleOpenModal}>
            Add Release
          </button>
        </div>
      </div>

      <div className="sprint-grid">
        {visibleRelease.map((release) => (
          <div
            key={release._id}
            className="release-card"
            onClick={() => handleReleaseClick(release._id)}
          >
            <div className="release-card-header">
              <span className="release-name">{release.name}</span>
              <span className="release-category-tag">
                {release.category || "General"}
              </span>
            </div>

            <div style={{ color: "#64748b", fontSize: "0.9rem" }}>
              <strong>Date: </strong>
              {release.releaseDate
                ? new Date(release.releaseDate).toLocaleDateString("en-IN", {
                    day: "2-digit",
                    month: "short",
                    year: "numeric",
                  })
                : "TBD"}
            </div>

            <div
              style={{
                color: "#64748b",
                fontSize: "0.85rem",
                marginTop: "4px",
              }}
            >
              <strong>Dev Cutoff: </strong>
              {release.devCutoff
                ? new Date(release.devCutoff).toLocaleDateString("en-IN", {
                    day: "2-digit",
                    month: "short",
                    year: "numeric",
                  })
                : "TBD"}
            </div>

            <div
              style={{
                color: "#64748b",
                fontSize: "0.85rem",
                marginTop: "4px",
              }}
            >
              <strong>QA Signoff: </strong>
              {release.qaSignoff
                ? new Date(release.qaSignoff).toLocaleDateString("en-IN", {
                    day: "2-digit",
                    month: "short",
                    year: "numeric",
                  })
                : "TBD"}
            </div>
          </div>
        ))}
        {visibleRelease.length === 0 && (
          <p style={{ textAlign: "center", width: "100%", color: "#64748b" }}>
            No releases found.
          </p>
        )}
      </div>

      {filtered.length > ITEMS_PER_PAGE && (
        <div className="pagination-container">
          {visibleCount < filtered.length && (
            <button
              className="load-more-btn"
              onClick={() => setVisibleCount((prev) => prev + ITEMS_PER_PAGE)}
              style={{
                opacity: isAtBottom ? 1 : 0,
                pointerEvents: isAtBottom ? "auto" : "none",
                transition: "opacity 0.3s ease-in-out",
              }}
            >
              Load More
            </button>
          )}

          <button className="back-top-btn" onClick={scrollToTop}>
            <AiOutlineArrowUp />
          </button>
        </div>
      )}

      <ReleaseModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        initialData={null}
        handleSave={handleSave}
        saving={saving}
      />
    </div>
  );
};

export default ReleaseList;
