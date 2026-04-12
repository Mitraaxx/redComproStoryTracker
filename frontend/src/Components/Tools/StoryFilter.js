// Component flow summary:
// 1) Initialize filter state from URL query params.
// 2) Auto-apply URL-backed filters on first mount.
// 3) Let users edit fields, then apply/clear filters and sync URL.
// 4) Render a toggleable dropdown anchored near the filter button.
import { useState, useEffect } from "react";
import { MdFilterList, MdClose } from "react-icons/md";
import { useSearchParams } from "react-router-dom";
import "./StoryFilter.css";
import {
  TEAM_MEMBERS,
  STATUS_MEMBERS,
  repoConfig,
} from "../../utils/AppConfig";
import SearchableSelect from "./SearchableSelect";

const StoryFilter = ({ onApplyFilter }) => {
  // Controls open/close state for filter dropdown.
  const [isOpen, setIsOpen] = useState(false);

  // React Router query param API for persistent/shareable filter state.
  const [searchParams, setSearchParams] = useSearchParams();

  // Dynamic left/right alignment style for dropdown placement.
  const [dropdownStyle, setDropdownStyle] = useState({});

  // Local editable filter values seeded from URL.
  const [filters, setFilters] = useState({
    assignee: searchParams.get("assignee") || "",
    status: searchParams.get("status") || "",
    qaRelDate: searchParams.get("qaRelDate") || "",
    apps: searchParams.get("apps") || "",
  });

  // On first render, hydrate list view using any existing URL filters.
  useEffect(() => {
    const urlFilters = {
      assignee: searchParams.get("assignee") || "",
      status: searchParams.get("status") || "",
      qaRelDate: searchParams.get("qaRelDate") || "",
      apps: searchParams.get("apps") || "",
    };
    const hasFilters = Object.values(urlFilters).some((val) => val !== "");
    if (hasFilters) {
      onApplyFilter(urlFilters);
    }
  }, []);

  // Toggle panel and compute horizontal alignment based on button position.
  const handleToggle = (e) => {
    if (!isOpen) {
      const buttonRect = e.currentTarget.getBoundingClientRect();
      const screenWidth = window.innerWidth;
      if (buttonRect.left > screenWidth / 2) {
        setDropdownStyle({
          right: 0,
          left: "auto",
        });
      } else {
        setDropdownStyle({
          left: 0,
          right: "auto",
        });
      }
    }
    setIsOpen(!isOpen);
  };

  // Generic controlled-field handler.
  const handleChange = (e) => {
    setFilters({
      ...filters,
      [e.target.name]: e.target.value,
    });
  };

  // Clear one field without affecting other filters.
  const handleClearField = (fieldName) => {
    setFilters({
      ...filters,
      [fieldName]: "",
    });
  };

  // Persist current filters into URL and notify parent list to refresh.
  const handleApply = () => {
    const newParams = new URLSearchParams(searchParams);
    Object.keys(filters).forEach((key) => {
      if (filters[key]) {
        newParams.set(key, filters[key]);
      } else {
        newParams.delete(key);
      }
    });
    setSearchParams(newParams);
    onApplyFilter(filters);
    setIsOpen(false);
  };

  // Reset all filters in local state + URL, then notify parent.
  const handleClear = () => {
    const cleared = {
      assignee: "",
      status: "",
      qaRelDate: "",
      apps: "",
    };
    setFilters(cleared);
    const newParams = new URLSearchParams(searchParams);
    Object.keys(cleared).forEach((key) => newParams.delete(key));
    setSearchParams(newParams);
    onApplyFilter(cleared);
    setIsOpen(false);
  };

  // Shared clear-icon style for date input field.
  const clearIconStyle = {
    position: "absolute",
    right: "2.5rem",
    top: "50%",
    transform: "translateY(-50%)",
    cursor: "pointer",
    color: "#94a3b8",
  };

  // Count active URL filters to show status badge on toggle button.
  const activeFiltersCount = ["assignee", "status", "qaRelDate", "apps"].filter(
    (key) => searchParams.get(key),
  ).length;

  return (
    <div className="filter-container">
      <div
        style={{
          display: "flex",
          justifyContent: "flex-end",
        }}
      >
        {/* Button toggles filter panel and shows whether any filters are active. */}
        <button
          className="filter-toggle-btn"
          onClick={handleToggle}
          style={{
            display: "flex",
            alignItems: "center",
            gap: "8px",
          }}
        >
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: "4px",
            }}
          >
            <MdFilterList size={20} /> Filter
          </div>

          {activeFiltersCount > 0 && (
            <span
              style={{
                color: "#16a34a",
                backgroundColor: "#f0fdf4",
                border: "1px solid #16a34a",
                borderRadius: "999px",
                padding: "2px 8px",
                fontSize: "0.7rem",
                fontWeight: "700",
                marginLeft: "4px",
              }}
            >
              Filled
            </span>
          )}
        </button>
      </div>

      {isOpen && (
        <div className="filter-dropdown" style={dropdownStyle}>
          {/* Header row with title + quick close action. */}
          <div className="filter-header">
            <h4 className="filter-title">Filter Stories</h4>
            <MdClose
              size={20}
              className="filter-close-icon"
              onClick={() => setIsOpen(false)}
            />
          </div>

          {/* Editable filter controls section. */}
          <div className="filter-fields-container px-3 py-3">
            <div className="row g-3">
              <div className="col-12">
                <label className="filter-label">Assignee</label>
                <div
                  style={{
                    position: "relative",
                  }}
                >
                  <SearchableSelect
                    name="assignee"
                    value={filters.assignee}
                    onChange={handleChange}
                    options={TEAM_MEMBERS}
                    placeholder="Search"
                  />
                </div>
              </div>

              <div className="col-12">
                <label className="filter-label">Currently With</label>
                <div
                  style={{
                    position: "relative",
                  }}
                >
                  <SearchableSelect
                    name="status"
                    value={filters.status}
                    onChange={handleChange}
                    options={STATUS_MEMBERS}
                    placeholder="Search"
                  />
                </div>
              </div>

              <div className="col-12">
                <label className="filter-label">Apps</label>
                <div
                  style={{
                    position: "relative",
                  }}
                >
                  <SearchableSelect
                    name="apps"
                    value={filters.apps}
                    onChange={handleChange}
                    options={Object.keys(repoConfig)}
                    placeholder="Search App"
                  />
                </div>
              </div>

              <div className="col-12">
                <label className="filter-label">Qa Release Date</label>
                <div
                  style={{
                    position: "relative",
                  }}
                >
                  {/* Date input includes inline clear icon when value exists. */}
                  <input
                    type="date"
                    name="qaRelDate"
                    value={filters.qaRelDate}
                    onChange={handleChange}
                    className="filter-input w-100"
                    style={{
                      paddingRight: "30px",
                    }}
                  />
                  {filters.qaRelDate && (
                    <MdClose
                      size={18}
                      style={{
                        ...clearIconStyle,
                        right: "25px",
                      }}
                      onClick={() => handleClearField("qaRelDate")}
                      title="Clear Date"
                    />
                  )}
                </div>
              </div>
            </div>

            {/* Footer actions to clear or apply current filter set. */}
            <div className="filter-actions mt-4">
              <button className="filter-clear-btn" onClick={handleClear}>
                Clear All
              </button>
              <button className="filter-apply-btn" onClick={handleApply}>
                Apply
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default StoryFilter;
