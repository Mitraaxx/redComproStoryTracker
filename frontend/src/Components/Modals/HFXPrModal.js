import React from "react";
import { MdClose } from "react-icons/md";
import { APPS_CONFIG } from "../../utils/AppConfig";
import "../Modals/ReleasePrModal.css"; 

/**
 * Modal component that displays a list of apps to be deployed for a Hotfix (HFX) release.
 * Provides direct buttons to easily generate Hotfix Pull Requests (master ➔ env/hotfix) on GitHub.
 */
const HFXPrModal = ({ isOpen, onClose, appsToBeDeployed, releaseName }) => {
  if (!isOpen) return null;

  return (
    <div className="modal-overlay">
      <div className="modal-content pr-modal-custom-content">
        <div className="modal-header">
          <h2>HFX PRs {releaseName ? `for: ${releaseName}` : ""}</h2>
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
                        master ➔ HFX
                      </span>
                      <button
                        className="pr-create-btn"
                        onClick={() => {
                          /**
                           * Constructs the GitHub comparison URL for creating a Pull Request
                           * from the 'master' branch into the 'env/hotfix' branch.
                           */
                          const githubUrl = `https://github.com/${orgName}/${repoName}/compare/env/hotfix...master`;
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

export default HFXPrModal;