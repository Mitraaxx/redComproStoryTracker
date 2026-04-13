// Application list page.
//
// High-level flow:
// 1) Read app names from repoConfig.
// 2) Filter list by search input.
// 3) Navigate to app stories on card click.
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { repoConfig } from "../../utils/AppConfig";
import "../Sprints/SprintList.css";
import "../App/AppList.css";

const AppList = () => {
  // ------------------------------
  // View State
  // ------------------------------
  const navigate = useNavigate();
  const [searchTerm, setSearchTerm] = useState("");

  // Source app names from static repo configuration.
  const appNames = Object.keys(repoConfig);

  // Case-insensitive search filter over app names.
  const filteredApps = appNames.filter((appName) => {
    return appName.toLowerCase().includes(searchTerm.toLowerCase());
  });

  return (
    <div className="sprint-container">
      <div className="sprint-container2">
        <h3 className="sprint-title">Applications</h3>

        <div className="sprint-search-header">
          {/* Updates the app-name search term. */}
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
            <a
              key={index}
              className="sprint-card app-card-aligned"
              onClick={() => navigate(`/apps/${appName}/stories`)}
              style={{
                textDecoration: "none",
                color: "inherit",
              }}
            >
              <h3 className="app-name-text">{appName}</h3>
            </a>
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
