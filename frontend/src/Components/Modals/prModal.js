import React from "react";
import { MdClose } from "react-icons/md";
import { repoConfig } from "../../utils/AppConfig";
import "../Modals/ReleasePrModal.css";

/**
 * Universal PR Modal component.
 * Displays apps slated for deployment and provides buttons to generate Pull Requests.
 * Supports "alpha", "hfx", and "master" PR types.
 */
const PrModal = ({ isOpen, onClose, appsToBeDeployed, releaseName, prType }) => {
  if (!isOpen) return null;

  // Source and target branches are set according to the PR Type
  let titlePrefix = "";
  let targetBranchKey = "";
  let sourceBranchKey = "";

  if (prType === "alpha") {
    titlePrefix = "Alpha";
    targetBranchKey = "alpha";
    sourceBranchKey = "master";
  } else if (prType === "hfx") {
    titlePrefix = "HFX";
    targetBranchKey = "hotfix";
    sourceBranchKey = "master";
  } else if (prType === "master") {
    titlePrefix = "Master";
    targetBranchKey = "master";
    sourceBranchKey = "rel";
  }

  const validApps = appsToBeDeployed?.filter((repoName) => {
    const branches = repoConfig[repoName]?.envBranches;
    return branches && branches[targetBranchKey] && branches[sourceBranchKey];
  }) || [];

  return (
    <div
      className="modal show d-block"
      tabIndex="-1"
      style={{
        backgroundColor: "rgba(15, 23, 42, 0.6)",
        backdropFilter: "blur(4px)",
        zIndex: 1040,
      }}
    >
      <div
        className="modal-dialog modal-dialog-centered modal-dialog-scrollable modal-lg"
        style={{ maxWidth: "600px" }}
      >
        <div
          className="modal-content border-0"
          style={{
            borderRadius: "25px",
            boxShadow: "0 20px 25px -5px rgba(0,0,0,0.1)",
          }}
        >
          <div
            className="modal-header px-4 pt-4 pb-3"
            style={{
              borderBottom: "1px solid #e2e8f0",
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
            }}
          >
            <h2 style={{ margin: 0, color: "#1e293b", fontWeight: "500" }}>
              {titlePrefix} PRs 
            </h2>
            <MdClose 
              size={28} 
              className="close-icon" 
              onClick={onClose} 
              style={{ cursor: "pointer", color: "#ef4444" }} 
            />
          </div>

          <div className="modal-body px-4 pb-4">
            {validApps.length > 0 ? (
              validApps.map((repoName, idx) => {
                const appConfig = repoConfig[repoName];
                const targetBranch = appConfig.envBranches[targetBranchKey];
                const sourceBranch = appConfig.envBranches[sourceBranchKey];
                const baseUrl = appConfig.baseUrl || `https://github.com/comprodls/${repoName}/compare/`;

                return (
                  <div key={idx} className="pr-repo-card" style={{ marginBottom: "15px", padding: "15px", border: "1px solid #e2e8f0", borderRadius: "10px", backgroundColor: "#f8fafc" }}>
                    <div className="pr-repo-title-wrapper" style={{ marginBottom: "10px" }}>
                      <strong className="pr-repo-title" style={{ fontSize: "1.1rem", color: "#0f172a" }}>{repoName}</strong>
                    </div>

                    <div className="pr-branch-list">
                      <div className="pr-branch-item" style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                        <span className="pr-branch-name" style={{ color: "#2563eb", fontWeight: "500", padding: "4px 10px", backgroundColor: "#eff6ff", borderRadius: "6px", fontSize: "0.9rem" }}>
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
              <p className="pr-empty-text" style={{ marginTop: "20px", color: "#64748b", textAlign: "center", fontStyle: "italic" }}>
                No apps with both <strong>{targetBranchKey}</strong> and <strong>{sourceBranchKey}</strong> branches found for this release.
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default PrModal;