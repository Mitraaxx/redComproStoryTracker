import React, { useState } from "react";
import { MdFilterList, MdClose } from "react-icons/md";
import "./StoryFilter.css";
import { TEAM_MEMBERS, STATUS_MEMBERS, repoConfig } from "../../utils/AppConfig";

/**
 * Reusable Filter Component for Stories.
 * Exposes a generic UI to filter by Assignee, Status, Apps, and exact Release Date using Datalists.
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

  const handleChange = (e) => {
    setFilters({ ...filters, [e.target.name]: e.target.value });
  };

  const handleApply = () => {
    onApplyFilter(filters);
    setIsOpen(false);
  };

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
            {/* ASSIGNEE DATALIST */}
            <div>
              <label className="filter-label">Assignee</label>
              <input
                list="filter-assignee-options"
                name="assignee"
                value={filters.assignee}
                onChange={handleChange}
                className="filter-input"
                placeholder="Search"
                autoComplete="off"
              />
              <datalist id="filter-assignee-options">
                {TEAM_MEMBERS.map((a) => (
                  <option key={a} value={a} />
                ))}
              </datalist>
            </div>

            {/* STATUS DATALIST */}
            <div>
              <label className="filter-label">Currently With</label>
              <input
                list="filter-status-options"
                name="status"
                value={filters.status}
                onChange={handleChange}
                className="filter-input"
                placeholder="Search"
                autoComplete="off"
              />
              <datalist id="filter-status-options">
                {STATUS_MEMBERS.map((s) => (
                  <option key={s} value={s} />
                ))}
              </datalist>
            </div>

            {/* APPS DATALIST */}
            <div>
              <label className="filter-label">Apps</label>
              <input
                list="filter-apps-options"
                name="apps"
                value={filters.apps}
                onChange={handleChange}
                className="filter-input"
                placeholder="Search"
                autoComplete="off"
              />
              <datalist id="filter-apps-options">
                {Object.keys(repoConfig).map((appName, i) => (
                    <option key={i} value={appName} />
                ))}
              </datalist>
            </div>

            {/* QA RELEASE DATE  */}
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