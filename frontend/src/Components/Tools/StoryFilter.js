import React, { useState, useEffect } from "react";
import { MdFilterList, MdClose } from "react-icons/md";
import { useSearchParams } from "react-router-dom"; 
import "./StoryFilter.css";
import { TEAM_MEMBERS, STATUS_MEMBERS, repoConfig } from "../../utils/AppConfig";
import SearchableSelect from "./SeachableSelect";

const StoryFilter = ({ onApplyFilter }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [searchParams, setSearchParams] = useSearchParams();

  const [dropdownStyle, setDropdownStyle] = useState({}); 

  const [filters, setFilters] = useState({
    assignee: searchParams.get("assignee") || "",
    status: searchParams.get("status") || "",
    qaRelDate: searchParams.get("qaRelDate") || "",
    apps: searchParams.get("apps") || ""
  });

  useEffect(() => {
    const urlFilters = {
      assignee: searchParams.get("assignee") || "",
      status: searchParams.get("status") || "",
      qaRelDate: searchParams.get("qaRelDate") || "",
      apps: searchParams.get("apps") || ""
    };
    
    const hasFilters = Object.values(urlFilters).some(val => val !== "");
    if (hasFilters) {
      onApplyFilter(urlFilters); 
    }
  }, []);

  const handleToggle = (e) => {
    if (!isOpen) {
      const buttonRect = e.currentTarget.getBoundingClientRect();
      const screenWidth = window.innerWidth;

      if (buttonRect.left > screenWidth / 2) {
        setDropdownStyle({ right: 0, left: "auto" }); 
      } else {
        setDropdownStyle({ left: 0, right: "auto" });
      }
    }
    setIsOpen(!isOpen);
  };

  const handleChange = (e) => {
    setFilters({ ...filters, [e.target.name]: e.target.value });
  };

  const handleClearField = (fieldName) => {
    setFilters({ ...filters, [fieldName]: "" });
  };

  const handleApply = () => {
    const newParams = new URLSearchParams(searchParams);
    Object.keys(filters).forEach(key => {
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

  const handleClear = () => {
    const cleared = {
      assignee: "",
      status: "",
      qaRelDate: "",
      apps: ""
    };
    setFilters(cleared);

    const newParams = new URLSearchParams(searchParams);
    Object.keys(cleared).forEach(key => newParams.delete(key));
    setSearchParams(newParams);

    onApplyFilter(cleared);
    setIsOpen(false);
  };

  const clearIconStyle = {
    position: "absolute",
    right: "2.5rem",
    top: "50%",
    transform: "translateY(-50%)",
    cursor: "pointer",
    color: "#94a3b8",
  };

  const activeFiltersCount = ["assignee", "status", "qaRelDate", "apps"].filter(
    key => searchParams.get(key)
  ).length;

  return (
    <div className="filter-container">
      <div style={{ display: "flex", justifyContent: "flex-end" }}>
        <button 
          className="filter-toggle-btn" 
          onClick={handleToggle}
          style={{ display: "flex", alignItems: "center", gap: "8px" }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: "4px" }}>
            <MdFilterList size={20} /> Filter
          </div>
          
          {activeFiltersCount > 0 && (
            <span style={{
              color: "#16a34a",
              backgroundColor: "#f0fdf4",
              border: "1px solid #16a34a",
              borderRadius: "999px",
              padding: "2px 8px",
              fontSize: "0.7rem",
              fontWeight: "700",
              marginLeft: "4px"
            }}>
              Filled
            </span>
          )}
        </button>
      </div>

      {isOpen && (
        <div className="filter-dropdown" style={dropdownStyle}>
          <div className="filter-header">
            <h4 className="filter-title">Filter Stories</h4>
            <MdClose
              size={20}
              className="filter-close-icon"
              onClick={() => setIsOpen(false)}
            />
          </div>

          <div className="filter-fields-container px-3 py-3">
            <div className="row g-3">
              
              <div className="col-12">
                <label className="filter-label">Assignee</label>
                <div style={{ position: "relative" }}>
                  
                   
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
                <div style={{ position: "relative" }}>
                  
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
                <div style={{ position: "relative" }}>
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
                <div style={{ position: "relative" }}>
                  <input
                    type="date"
                    name="qaRelDate"
                    value={filters.qaRelDate}
                    onChange={handleChange}
                    className="filter-input w-100"
                    style={{ paddingRight: "30px" }}
                  />
                  {filters.qaRelDate && (
                    <MdClose
                      size={18}
                      style={{...clearIconStyle, right: "25px"}} 
                      onClick={() => handleClearField("qaRelDate")}
                      title="Clear Date"
                    />
                  )}
                </div>
              </div>

            </div>

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