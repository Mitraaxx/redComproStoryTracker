import React, { useState } from "react";
import { MdFilterList, MdClose } from "react-icons/md";
import "./StoryFilter.css";
import { TEAM_MEMBERS, STATUS_MEMBERS, APPS_CONFIG} from "../../utils/AppConfig";

/**
 * Reusable Filter Component for Stories.
 * Exposes a generic UI to filter by Assignee, Status, and exact Release Date.
 */
const StoryFilter = ({ onApplyFilter }) => {
  const [isOpen, setIsOpen] = useState(false);

  // Local state for filter inputs
  const [filters, setFilters] = useState({
    assignee: "",
    status: "",
    qaRelDate: "",
    apps: ""
  });

  /**
   * Handles user input changes across all filter fields.
   * Dynamically updates the specific field in the local state based on the input's 'name' attribute.
   */
  const handleChange = (e) => {
    setFilters({ ...filters, [e.target.name]: e.target.value });
  };

  /**
   * Confirms and applies the selected filters.
   * Passes the current local filter state up to the parent component and closes the dropdown.
   */
  const handleApply = () => {
    onApplyFilter(filters);
    setIsOpen(false);
  };

  /**
   * Resets all filter criteria to their default empty states.
   * Immediately notifies the parent component to remove all active filters and closes the dropdown.
   */
  const handleClear = () => {
    const cleared = {
      assignee: "",
      status: "",
      qaRelDate: "",
      apps: ""
    };
    setFilters(cleared);
    onApplyFilter(cleared);
    setIsOpen(false);
  };

  return (
    <div className="filter-container">
      <button className="filter-toggle-btn" onClick={() => setIsOpen(!isOpen)}>
        <MdFilterList size={20} /> Filter
      </button>

      {isOpen && (
        <div className="filter-dropdown">
          <div className="filter-header">
            <h4 className="filter-title">Filter Stories</h4>
            <MdClose
              size={20}
              className="filter-close-icon"
              onClick={() => setIsOpen(false)}
            />
          </div>

          <div className="filter-fields-container">
            <div>
              <label className="filter-label">Assignee</label>
              <select
                name="assignee"
                value={filters.assignee}
                onChange={handleChange}
                className="filter-input"
              >
                <option value="">All</option>
                {TEAM_MEMBERS.map((a) => (
                  <option key={a} value={a}>
                    {a}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="filter-label">Currently With</label>
              <select
                name="status"
                value={filters.status}
                onChange={handleChange}
                className="filter-input"
              >
                <option value="">All</option>
                {STATUS_MEMBERS.map((s) => (
                  <option key={s} value={s}>
                    {s}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="filter-label">Apps</label>
              <select
                name="apps"
                value={filters.apps}
                onChange={handleChange}
                className="filter-input"
              >
                <option value="">All</option>
                {APPS_CONFIG.map((app, i) => (
                    <option key={i} value={app.repoName}>
                      {app.repoName}
                    </option>
                ))}
              </select>
            </div>

            <div>
              <label className="filter-label">Qa Release Date</label>
              <div className="filter-date-group">
                <input
                  type="date"
                  name="qaRelDate"
                  value={filters.qaRelDate}
                  onChange={handleChange}
                  className="filter-input"
                />
              </div>
            </div>

            <div className="filter-actions">
              <button className="filter-clear-btn" onClick={handleClear}>
                Clear
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
