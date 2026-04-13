// Release list page.
//
// High-level flow:
// 1) Fetch all releases on mount.
// 2) Filter by search input and sort by release date.
// 3) Paginate visible cards.
// 4) Create release via modal and prepend it locally.
import { useEffect, useState, useMemo } from "react";
import { fetchAllReleases, createRelease, clearAllCaches } from "../../Api/Api";
import { useNavigate } from "react-router-dom";
import "../Sprints/SprintList.css";
import "../Release/ReleaseList.css";
import { toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import ReleaseModal from "../Modals/ReleaseModal";
import { ITEMS_PER_PAGE } from "../../utils/AppConfig";
import { handleApiError, handleApiSuccess } from "../Common/ApiUtils";
import LoadingSpinner from "../Common/LoadingSpinner";
import usePaginationState from "../Common/UsePaginationState";
import useInfiniteScroll from "../Common/UseInfiniteScroll";
import PaginationControls from "../Common/PaginationControls";

const ReleaseList = () => {
  // ------------------------------
  // View State
  // ------------------------------
  const [releases, setReleases] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const navigate = useNavigate();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [saving, setSaving] = useState(false);

  // Persist pagination count across revisits.
  const [visibleCount, setVisibleCount] =
    usePaginationState(`releaseList_count`);

  // Used by shared pagination controls.
  const isAtBottom = useInfiniteScroll([releases, visibleCount, searchTerm]);

  // Fetch release list on first render.
  useEffect(() => {
    const getReleases = async () => {
      try {
        setLoading(true);
        const data = await fetchAllReleases();
        setReleases(data || []);
      } catch (err) {
        console.error(err);
        toast.error("Failed to fetch releases");
      } finally {
        setLoading(false);
      }
    };
    getReleases();
  }, []);

  // Creates a release and updates local list immediately.
  const handleSave = async (newReleaseData) => {
    setSaving(true);
    try {
      const { isEditMode, ...createPayload } = newReleaseData;
      const createdReleaseKey = await createRelease(createPayload);
      if (!createdReleaseKey?._id) {
        throw new Error("Create release response missing _id");
      }

      const createdRelease = {
        ...createPayload,
        _id: createdReleaseKey._id,
      };

      setIsModalOpen(false);
      clearAllCaches();
      setReleases((prevReleases) => [createdRelease, ...prevReleases]);
      handleApiSuccess("Release created successfully");
    } catch (error) {
      handleApiError(error, "Failed to create release");
    } finally {
      setSaving(false);
    }
  };

  // Open release details page for selected release card.
  const handleReleaseClick = (releaseId) => {
    navigate(`/releases/${releaseId}/stories`);
  };

  // Search + sort pipeline for release cards.
  const filtered = useMemo(() => {
    const search = searchTerm.trim().toLowerCase();
    return (
      releases
        ?.filter((item) => {
          if (!search) return true;
          return (
            item.name?.toLowerCase().includes(search) ||
            item.category?.toLowerCase().includes(search)
          );
        })
        .sort((a, b) => {
          const dateA = a.releaseDate ? new Date(a.releaseDate).getTime() : 0;
          const dateB = b.releaseDate ? new Date(b.releaseDate).getTime() : 0;
          return dateB - dateA;
        }) || []
    );
  }, [releases, searchTerm]);

  // Apply pagination slice.
  const visibleReleases = useMemo(() => {
    return filtered.slice(0, visibleCount);
  }, [filtered, visibleCount]);

  if (loading) return <LoadingSpinner />;

  return (
    <div className="sprint-container">
      <div className="sprint-container2">
        <h3 className="sprint-title">Releases</h3>
        <div className="sprint-search-header">
          {/* Search input resets visible count for consistent UX. */}
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
            className="create-sprint-button"
            onClick={() => setIsModalOpen(true)}
          >
            Add Release
          </button>
        </div>
      </div>

      <div className="sprint-grid">
        {visibleReleases.length > 0 ? (
          visibleReleases.map((release) => (
            <a
              key={release._id}
              className="release-card"
              onClick={() => handleReleaseClick(release._id)}
              style={{
                textDecoration: "none",
                color: "inherit",
              }}
            >
              <div className="release-card-header">
                <span className="release-name">{release.name}</span>
                <span className="release-category-tag">
                  {release.category || "General"}
                </span>
              </div>

              <div
                style={{
                  color: "#64748b",
                  fontSize: "0.9rem",
                }}
              >
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
            </a>
          ))
        ) : (
          <p
            style={{
              textAlign: "center",
              width: "100%",
              color: "#64748b",
            }}
          >
            No releases found.
          </p>
        )}
      </div>

      <PaginationControls
        filteredItems={filtered}
        visibleCount={visibleCount}
        setVisibleCount={setVisibleCount}
        isAtBottom={isAtBottom}
      />

      {/* Create release modal. */}
      <ReleaseModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        initialData={null}
        handleSave={handleSave}
        saving={saving}
        existingReleases={releases}
      />
    </div>
  );
};
export default ReleaseList;
