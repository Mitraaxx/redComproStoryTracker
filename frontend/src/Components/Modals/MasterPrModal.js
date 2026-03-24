import React from "react";
import { MdClose } from "react-icons/md";
import { APPS_CONFIG } from "../../utils/AppConfig";
import "../Modals/ReleasePrModal.css"; 

/**
 * Modal component that displays a list of apps slated for deployment.
 * Provides quick-action buttons to generate Master Pull Requests (env/rel ➔ master) on GitHub.
 */
const MasterPrModal = ({ isOpen, onClose, appsToBeDeployed, releaseName }) => {
  if (!isOpen) return null;

  return (
    <div className="modal-overlay">
      <div className="modal-content pr-modal-custom-content">
        <div className="modal-header">
          <h2>Master PRs {releaseName ? `for: ${releaseName}` : ""}</h2>
          <MdClose size={28} className="close-icon" onClick={onClose} />
        </div>

        <div className="pr-modal-body">
          {appsToBeDeployed && appsToBeDeployed.length > 0 ? (
            appsToBeDeployed.map((repoName, idx) => {
              
              const matchedApp = APPS_CONFIG.find((a) => a.repoName === repoName);
              const orgName = matchedApp?.orgName || "YOUR_ORG_NAME";

              return (
                <div key={idx} className="pr-repo-card">
                  
                  <div className="pr-repo-title-wrapper">
                    <strong className="pr-repo-title">{repoName}</strong>
                  </div>

                  <div className="pr-branch-list">
                    <div className="pr-branch-item">
                      <span className="pr-branch-name" style={{ color: "#2563eb" }}>
                        env/rel ➔ master
                      </span>
                      <button
                        className="pr-create-btn"
                        onClick={() => {
                          /**
                           * Constructs the GitHub URL to compare and create a PR 
                           * from 'env/release' into the 'master' branch.
                           */
                          const githubUrl = `https://github.com/${orgName}/${repoName}/compare/master...env/release`;
                          window.open(githubUrl, "_blank");
                        }}
                      >
                        Create PR
                      </button>
                    </div>
                  </div>
                </div>
              );
            })
          ) : (
            <p className="pr-empty-text" style={{ marginTop: "20px" }}>
              No apps to be deployed for this release yet.
            </p>
          )}
        </div>
      </div>
    </div>
  );
};

export default MasterPrModal;