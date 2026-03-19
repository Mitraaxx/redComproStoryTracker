import React from "react";
import { MdClose } from "react-icons/md";
import { APPS_CONFIG } from "../../utils/AppConfig";
import "../Modals/ReleasePrModal.css";

const ReleasePrModal = ({ isOpen, onClose, selectedStory }) => {
  if (!isOpen || !selectedStory) return null;

  return (
    <div className="modal-overlay">
      <div className="modal-content pr-modal-custom-content">
        <div className="modal-header">
          <h2>PRs for: {selectedStory.storyName}</h2>
          <MdClose size={28} className="close-icon" onClick={onClose} />
        </div>

        <div className="pr-modal-body">
          {selectedStory.linkedApps && selectedStory.linkedApps.length > 0 ? (
            selectedStory.linkedApps.map((appItem, idx) => {
              const repoName = appItem.appRef?.name || appItem.appName || "Unknown";
              const matchedApp = APPS_CONFIG.find((a) => a.repoName === repoName);
              const orgName = matchedApp?.orgName || "YOUR_ORG_NAME";

              return (
                <div key={idx} className="pr-repo-card">
                  <div className="pr-repo-title-wrapper">
                    <strong className="pr-repo-title">{repoName}</strong>
                  </div>

                  <div className="pr-branch-list">
                    {appItem.featureBranches && appItem.featureBranches.length > 0 ? (
                      appItem.featureBranches.map((branch, bIdx) => (
                        <div key={bIdx} className="pr-branch-item">
                          <span className="pr-branch-name">{branch}</span>
                          <button
                            className="pr-create-btn"
                            onClick={() => {
                              const githubUrl = `https://github.com/${orgName}/${repoName}/compare/env/rel...${branch}`;
                              window.open(githubUrl, "_blank");
                            }}
                          >
                            Create PR
                          </button>
                        </div>
                      ))
                    ) : (
                      <span className="pr-empty-text">
                        No feature branches found.
                      </span>
                    )}
                  </div>
                </div>
              );
            })
          ) : (
            <p className="pr-empty-text" style={{ marginTop: "20px" }}>
              No apps linked to this story yet.
            </p>
          )}
        </div>
      </div>
    </div>
  );
};

export default ReleasePrModal;