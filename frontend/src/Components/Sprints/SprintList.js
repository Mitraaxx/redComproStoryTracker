import React, { useEffect, useState, useContext } from "react";
import { fetchAllSprints, createSprint, clearAllCaches } from "../../Api/api";
import { HashLoader } from "react-spinners";
import { useNavigate } from "react-router-dom";
import "../Sprints/SprintList.css";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import { ITEMS_PER_PAGE } from "../../utils/AppConfig";
import { AiOutlineArrowUp } from "react-icons/ai";
import SprintModal from "../Modals/SprintModal";

/**
 * Main component to render and manage the complete list of sprints.
 * Handles fetching sprint data, searching, pagination (Load More), and initiating new sprint creation.
 */
const SprintList = () => {
  const [sprints, setSprints] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const navigate = useNavigate();

  const [isCreateSprintModalOpen, setCreateIsSprintModalOpen] = useState(false);
  const [savingSprint, setSavingSprint] = useState(false);

  // For load more at bottom
  const [isAtBottom, setIsAtBottom] = useState(false);

  /**
   * Initializes the visible count for pagination from session storage to persist user state,
   * falling back to the default ITEMS_PER_PAGE if no cache exists.
   */
  const [visibleCount, setVisibleCount] = useState(() => {
    const savedCount = sessionStorage.getItem(`sprintList_count`);
    return savedCount ? parseInt(savedCount, 10) : ITEMS_PER_PAGE;
  });

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
  }, [ visibleCount, searchTerm]);

  /**
   * Effect hook to synchronize the current visible count with session storage
   * whenever the user interacts with the pagination (Load More).
   */
  useEffect(() => {
    sessionStorage.setItem(`sprintList_count`, visibleCount);
  }, [visibleCount]);

  /**
   * Handles the submission of a new sprint.
   * Sends data to the API, clears local caches, refreshes the sprint list,
   * and displays a toast notification regarding the outcome.
   */
  const handleSprintSave = async (newSprintData) => {
    setSavingSprint(true);
    try {
      await createSprint(newSprintData);

      setCreateIsSprintModalOpen(false);
      clearAllCaches();
      const data = await fetchAllSprints();
      setSprints(data);
      toast.success("Sprint created successfully");
    } catch (error) {
      console.error("Sprint Save error:", error);
      toast.error(error.message || "Failed to create Sprint");
    } finally {
      setSavingSprint(false);
    }
  };

  /**
   * Effect hook to fetch the complete list of sprints from the backend API
   * when the component mounts. Manages the loading state during the request.
   */
  useEffect(() => {
    const getSprints = async () => {
      try {
        setLoading(true);
        const data = await fetchAllSprints();
        setSprints(data);
      } catch (err) {
        console.log(err);
      } finally {
        setLoading(false);
      }
    };
    getSprints();
  }, []);

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
   * Navigates to the detailed story view for a specific sprint.
   */
  const handleSprintClick = (sprintId) => {
    navigate(`/sprints/${sprintId}/stories`);
  };

  /**
   * Filters the master sprint array based on the current search term,
   * and subsequently sorts the results in descending order.
   */
  const filtered =
    sprints
      ?.filter((item) => {
        const search = searchTerm.toLowerCase();
        const sprintName = item.name?.toLowerCase() || "";
        return sprintName.includes(search);
      })
      .sort((a, b) => {
        const nameA = a.name || "";
        const nameB = b.name || "";
        return nameB.localeCompare(nameA, undefined, {
          numeric: true,
          sensitivity: "base",
        });
      }) || [];

  // Applies pagination limit to the filtered array
  const visibleSprints = filtered.slice(0, visibleCount);

  /**
   * Utility function to smoothly scroll the window back to the top of the page.
   */
  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  // Helper function to format the date
  const formatDate = (dateString) => {
    if (!dateString) return "";
    const options = { day: "numeric", month: "short", year: "numeric" };
    return new Date(dateString).toLocaleDateString("en-GB", options);
  };

  return (
    <div className="sprint-container">
      <ToastContainer position="top-right" autoClose={3000} />
      <div className="sprint-container2">
        <h3 className="sprint-title">Sprint List</h3>
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
          <button
            onClick={() => setCreateIsSprintModalOpen(true)}
            className="create-sprint-button"
          >
            Add Sprint
          </button>
        </div>
      </div>

      <div className="sprint-grid">
        {visibleSprints.map((sprint) => (
          <div
            key={sprint._id}
            onClick={() => handleSprintClick(sprint._id)}
            className="sprint-card"
          >
            {/* Sprint ka naam */}
            <span className="sprint-card-name">{sprint.name}</span>

            {/* Sprint ki Date Range */}
            {(sprint.startDate || sprint.endDate) && (
              <span className="sprint-card-dates">
                {sprint.startDate ? formatDate(sprint.startDate) : "TBD"}
                {" - "}
                {sprint.endDate ? formatDate(sprint.endDate) : "TBD"}
              </span>
            )}
          </div>
        ))}
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

      <SprintModal
        isOpen={isCreateSprintModalOpen}
        onClose={() => setCreateIsSprintModalOpen(false)}
        initialData={null}
        handleSave={handleSprintSave}
        saving={savingSprint}
      />
    </div>
  );
};

export default SprintList;
