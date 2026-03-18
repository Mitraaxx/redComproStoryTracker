import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { APPS_CONFIG } from "../utils/AppConfig";
import "./SprintList.css"; 
import "./AppList.css"; 

const AppList = () => {
  const navigate = useNavigate();
  const [searchTerm, setSearchTerm] = useState("");

  const filteredApps = APPS_CONFIG.filter((app) => {
    return app.repoName.toLowerCase().includes(searchTerm.toLowerCase());
  });

  return (
    <div className="sprint-container">
      <div className="sprint-container2">
        <h2 className="sprint-title">Applications</h2>
    
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

      <div className="sprint-grid" style={{
                      
                  }}>
        {filteredApps.length > 0 ? (
          filteredApps.map((app, index) => (
            <div 
              key={index} 
              className="sprint-card app-card-aligned"
              onClick={() => navigate(`/apps/${app.repoName}/stories`)}
            >
              <h3 className="app-name-text" >{app.repoName}</h3>
            </div>
          ))
        ) : (
          <p style={{ color: "#64748b", textAlign: "center", width: "100%", marginTop: "20px" }}>
            No applications found.
          </p>
        )}
      </div>
    </div>
  );
};

export default AppList;