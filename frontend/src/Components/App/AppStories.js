import React, { useEffect, useState } from "react";
import { fetchAppStories } from "../../Api/api";
import { MdArrowBack } from "react-icons/md";
import { HashLoader } from "react-spinners";
import { useParams, useNavigate } from "react-router-dom";
import "../Sprints/SprintStories.css";
import { ITEMS_PER_PAGE } from "../../utils/AppConfig";
import StoryFilter from "../Tools/StoryFilter";

/**
 * Component to display all stories associated with a specific Application/Repository.
 * Handles fetching application-specific stories, searching, and pagination logic.
 */
const AppStories = () => {
  const [stories, setStories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");

  // For load more at bottom
  const [isAtBottom, setIsAtBottom] = useState(false);

  const { appName } = useParams();
  const navigate = useNavigate();

  /**
   * Initializes pagination count from session storage cache,
   * falling back to ITEMS_PER_PAGE if no cache is present.
   */
  const [visibleCount, setVisibleCount] = useState(() => {
    const savedCount = sessionStorage.getItem(`app_${appName}_count`);
    return savedCount ? parseInt(savedCount, 10) : ITEMS_PER_PAGE;
  });

  // New State for active filters
  const [activeFilters, setActiveFilters] = useState({
    assignee: "",
    status: "",
    qaRelDate: "",
    apps: "",
  });

  // Function to apply filter
  const handleApplyFilter = (newFilters) => {
    setActiveFilters(newFilters);
    setVisibleCount(ITEMS_PER_PAGE);
  };

  /**
   * Persists the current pagination count to session storage to retain list length upon navigation.
   */
  useEffect(() => {
    sessionStorage.setItem(`app_${appName}_count`, visibleCount);
  }, [visibleCount, appName]);

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
  }, [stories, visibleCount, searchTerm, activeFilters]);

  /**
   * Fetches the stories specifically linked to the given application name
   * when the component mounts or the appName parameter changes.
   */
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
   * Filters the fetched stories array based on the current search term,
   * then sorts the results in descending numerical order using the Story ID.
   */
  const filtered =
    stories
      ?.filter((item) => {
        if (
          activeFilters.assignee &&
          item.responsibility !== activeFilters.assignee
        )
          return false;
        if (activeFilters.status && item.status !== activeFilters.status)
          return false;

        if (activeFilters.qaRelDate) {
          if (!item.qaEnvRelDate) return false;
          const storyDate = new Date(item.qaEnvRelDate)
            .toISOString()
            .split("T")[0];
          if (storyDate !== activeFilters.qaRelDate) return false;
        }

        if (activeFilters.apps) {
          const selectedApp = activeFilters.apps;
          const hasLinkedApp = item.linkedApps?.some(
            (app) =>
              app.appName === selectedApp || app.appRef?.name === selectedApp,
          );
          if (!hasLinkedApp) {
            return false;
          }
        }

        const search = searchTerm.trim().toLowerCase();
        if (!search) return true;

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

  // Applies pagination limit to the filtered array
  const visibleStories = filtered.slice(0, visibleCount);

  /**
   * Utility to smoothly scroll the page back to the top.
   */
  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  return (
    <div className="sprint-story-container">
      <div className="extra-box" style={{ justifyContent: "flex-start" }}>
        <button onClick={() => navigate(-1)} className="back-button">
          <MdArrowBack />
        </button>
      </div>
      <div className="sprint-story-container2">
        <section>
          <div className="sprint-title-group">
            <h3 className="sprint-story-title">{appName}</h3>
          </div>
        </section>

        <section className="sprint-story-container3">
          <div className="story-search-header">
            <StoryFilter onApplyFilter={handleApplyFilter} />
            <input
              type="text"
              className="story-search-input"
              placeholder="Search"
              value={searchTerm}
              onChange={(e) => {
                setSearchTerm(e.target.value);
                // Reset pagination to default items per page when a search is executed
                setVisibleCount(ITEMS_PER_PAGE);
              }}
            />
          </div>
        </section>
      </div>

      <div className="sprint-story-grid">
        {visibleStories.length > 0 ? (
          visibleStories.map((story) => (
            <div
              key={story._id}
              onClick={() => navigate(`/apps/${appName}/stories/${story._id}`)}
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
                <strong>Qa Release Date: </strong>
                {story?.qaEnvRelDate
                  ? new Date(story.qaEnvRelDate).toLocaleDateString("en-IN", {
                      day: "2-digit",
                      month: "short",
                      year: "numeric",
                    })
                  : "N/A"}
              </p>
              <p>
                <strong>Story Points: </strong> {story?.storyPoints}
              </p>
              <div className="story-comments">
                <strong>Comments: </strong>
                <span>{story?.comments || "No comments."}</span>
              </div>
            </div>
          ))
        ) : (
          <p style={{ color: "#64748b", marginTop: "20px" }}>
            No stories linked to this app yet.
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
            ⬆
          </button>
        </div>
      )}
    </div>
  );
};

export default AppStories;
