import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { repoConfig } from "../../utils/AppConfig";
import "../Sprints/SprintList.css";
import "../App/AppList.css";

/**
 * Component to display a searchable grid of available applications.
 * Reads application data statically from the global AppConfig.
 */
const AppList = () => {
  const navigate = useNavigate();
  const [searchTerm, setSearchTerm] = useState("");

  /**
   * Filters the globally configured applications based on the search term input.
   */
  const appNames = Object.keys(repoConfig);
  const filteredApps = appNames.filter((appName) => {
    return appName.toLowerCase().includes(searchTerm.toLowerCase());
  });

  return (
    <div className="sprint-container">
      <div className="sprint-container2">
        <h3 className="sprint-title">Applications</h3>

        <div className="sprint-search-header">
          <input
            type="text"
            className="sprint-search-input"
            placeholder="Search"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
      </div>

      <div className="sprint-grid">
        {filteredApps.length > 0 ? (
          filteredApps.map((appName, index) => (
            <div
              key={index}
              className="sprint-card app-card-aligned"
              onClick={() => navigate(`/apps/${appName}/stories`)}
            >
              <h3 className="app-name-text">{appName}</h3>
            </div>
          ))
        ) : (
          <p
            style={{
              color: "#64748b",
              textAlign: "center",
              width: "100%",
              marginTop: "20px",
            }}
          >
            No applications found.
          </p>
        )}
      </div>
    </div>
  );
};

export default AppList;