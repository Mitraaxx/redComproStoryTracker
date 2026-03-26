import React from "react";
import { MdClose } from "react-icons/md";
import { repoConfig } from "../../utils/AppConfig";
import "../Modals/ReleasePrModal.css"; 

/**
 * Modal component that displays a list of apps slated for deployment.
 * Provides quick-action buttons to generate Master Pull Requests (rel ➔ master) on GitHub.
 */
const MasterPrModal = ({ isOpen, onClose, appsToBeDeployed, releaseName }) => {
  if (!isOpen) return null;

  const validApps = appsToBeDeployed?.filter((repoName) => {
    const branches = repoConfig[repoName]?.envBranches;
    return branches && branches.master && branches.rel;
  }) || [];

  return (
    <div className="modal-overlay">
      <div className="modal-content pr-modal-custom-content">
        <div className="modal-header">
          <h2>Master PRs {releaseName ? `for: ${releaseName}` : ""}</h2>
          <MdClose size={28} className="close-icon" onClick={onClose} />
        </div>

        <div className="pr-modal-body">
          {validApps.length > 0 ? (
            validApps.map((repoName, idx) => {
              const appConfig = repoConfig[repoName];
              const targetBranch = appConfig.envBranches.master; 
              const sourceBranch = appConfig.envBranches.rel; 
              const baseUrl = appConfig.baseUrl || `https://github.com/comprodls/${repoName}/compare/`;

              return (
                <div key={idx} className="pr-repo-card">
                  <div className="pr-repo-title-wrapper">
                    <strong className="pr-repo-title">{repoName}</strong>
                  </div>

                  <div className="pr-branch-list">
                    <div className="pr-branch-item">
                      <span className="pr-branch-name" style={{ color: "#2563eb" }}>
                        {sourceBranch} ➔ {targetBranch}
                      </span>
                      <button
                        className="pr-create-btn"
                        onClick={() => {
                          const githubUrl = `${baseUrl}${targetBranch}...${sourceBranch}`;
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
              No apps with both master and rel branches found for this release.
            </p>
          )}
        </div>
      </div>
    </div>
  );
};

export default MasterPrModal;