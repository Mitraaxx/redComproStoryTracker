// Add Existing Story modal.
//
// Complete flow:
// 1) Open modal and fetch all stories.
// 2) Remove stories already linked to current sprint.
// 3) Apply search by storyId/storyName.
// 4) Render in chunks (20) with scroll-based incremental loading.
// 5) Return selected story object to parent via onSelectStory.
import { useState, useEffect } from "react";
import { MdClose, MdSearch } from "react-icons/md";
import { fetchAllStories } from "../../Api/Api";
import { HashLoader } from "react-spinners";
import "../Modals/EditStoryModal.css";
import useModalScrollLock from "../../Components/Common/UseModalScrollLock";

const AddExistingStoryModal = ({
  isOpen,
  onClose,
  onSelectStory,
  currentSprintStories = [],
}) => {
  // ------------------------------
  // View State
  // ------------------------------
  // Search text entered by user.
  const [searchTerm, setSearchTerm] = useState("");

  // Full story list fetched from backend.
  const [allStories, setAllStories] = useState([]);

  // Loader state for initial fetch when modal opens.
  const [loading, setLoading] = useState(false);

  // Number of currently visible rows in modal list.
  const [visibleCount, setVisibleCount] = useState(20);

  // Locks background body scroll while modal is open.
  useModalScrollLock(isOpen);

  // Fetches stories on modal open; resets lightweight UI state on close.
  useEffect(() => {
    if (isOpen) {
      const getStories = async () => {
        // Start loading indicator.
        setLoading(true);

        // Load lightweight story identities used by selection list.
        const data = await fetchAllStories("validation");
        if (data) setAllStories(data);

        // Stop loading indicator.
        setLoading(false);
      };
      getStories();
    } else {
      setSearchTerm("");
      setVisibleCount(20);
    }
  }, [isOpen]);

  // Whenever search changes, restart pagination from first chunk.
  useEffect(() => {
    setVisibleCount(20);
  }, [searchTerm]);

  // Render nothing if modal is not open.
  if (!isOpen) return null;

  // Build a quick lookup source: ids already present in current sprint.
  const currentStoryIds = currentSprintStories.map((s) => s._id);

  // Exclude stories already linked to this sprint.
  const availableStoriesToLink = allStories.filter(
    (s) => !currentStoryIds.includes(s._id),
  );

  // Apply search filter over story id or story name.
  const filteredStories = availableStoriesToLink.filter(
    (s) =>
      (s.storyId &&
        s.storyId.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (s.storyName &&
        s.storyName.toLowerCase().includes(searchTerm.toLowerCase())),
  );

  // Apply visible slice limit.
  const visibleStories = filteredStories.slice(0, visibleCount);

  // Infinite-scroll style chunk loading within modal list area.
  const handleScroll = (e) => {
    const { scrollTop, clientHeight, scrollHeight } = e.target;

    // If near bottom, reveal next chunk.
    if (scrollHeight - scrollTop <= clientHeight + 10) {
      if (visibleCount < filteredStories.length) {
        setVisibleCount((prev) => prev + 20);
      }
    }
  };

  // ------------------------------
  // Render
  // ------------------------------
  return (
    <div
      className="modal show d-block"
      tabIndex="-1"
      style={{
        backgroundColor: "rgba(15, 23, 42, 0.6)",
        backdropFilter: "blur(4px)",
        zIndex: 1040,
      }}
    >
      <div
        className="modal-dialog modal-dialog-centered modal-dialog-scrollable modal-lg"
        style={{
          maxWidth: "600px",
        }}
      >
        <div
          className="modal-content border-0"
          style={{
            borderRadius: "25px",
            boxShadow: "0 20px 25px -5px rgba(0,0,0,0.1)",
          }}
        >
          <div
            className="modal-header px-4 pt-4 pb-3"
            style={{
              borderBottom: "1px solid #e2e8f0",
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
            }}
          >
            <h2>Add Existing Story</h2>
            <MdClose size={28} className="close-icon" onClick={onClose} />
          </div>

          <div className="modal-body px-4 pb-4">
            <div
              style={{
                padding: "0 20px 15px 20px",
              }}
            >
              <div
                style={{
                  position: "relative",
                }}
              >
                <MdSearch
                  size={22}
                  style={{
                    position: "absolute",
                    left: "10px",
                    top: "10px",
                    color: "#64748b",
                  }}
                />

                {/* Search input updates filter text in real time. */}
                <input
                  type="text"
                  placeholder="Search by Story ID or Name"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="form-input"
                  style={{
                    paddingLeft: "38px",
                  }}
                  autoFocus
                />
              </div>
            </div>

            <div
              onScroll={handleScroll}
              style={{
                flex: 1,
                overflowY: "auto",
                padding: "0 20px 20px 20px",
              }}
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
                  style={{
                    display: "flex",
                    flexDirection: "column",
                    gap: "10px",
                  }}
                >
                  {/* Click a story row to pass selection back to parent. */}
                  {visibleStories.map((story) => (
                    <a
                      key={story._id}
                      onClick={() => onSelectStory(story)}
                      style={{
                        padding: "12px 16px",
                        backgroundColor: "#f8fafc",
                        border: "1px solid #e2e8f0",
                        borderRadius: "8px",
                        cursor: "pointer",
                        transition: "all 0.2s ease",
                        textDecoration: "none",
                        color: "inherit",
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
                    </a>
                  ))}

                  {/* Footer hint while more items are still available. */}
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
                  {/* Empty state after filtering and exclusion. */}
                  No new stories available to add.
                </p>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
export default AddExistingStoryModal;
