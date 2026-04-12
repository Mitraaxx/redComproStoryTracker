// Modal flow summary:
// 1) Lock page scroll while the modal is open.
// 2) Resolve PR direction (source -> target) from the selected PR type.
// 3) Keep only apps that have both required environment branches configured.
// 4) Render one "Create PR" action per valid app to open GitHub compare URL.
import { MdClose } from "react-icons/md";
import { repoConfig } from "../../utils/AppConfig";
import "../Modals/ReleasePrModal.css";
import useModalScrollLock from "../../Components/Common/useModalScrollLock";

const PrModal = ({ isOpen, onClose, appsToBeDeployed, prType }) => {
  // Prevent background page scrolling when modal is visible.
  useModalScrollLock(isOpen);

  // Skip rendering until the parent opens the modal.
  if (!isOpen) return null;

  // These values are derived from PR type and used across filtering + URL generation.
  let titlePrefix = "";
  let targetBranchKey = "";
  let sourceBranchKey = "";

  // Define branch direction for each PR mode.
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

  // Keep only repos that have both branches needed for this PR type.
  const validApps =
    appsToBeDeployed?.filter((repoName) => {
      // Branches are centrally configured in repoConfig per repository.
      const branches = repoConfig[repoName]?.envBranches;
      return branches?.[targetBranchKey] && branches?.[sourceBranchKey];
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
        style={{
          maxWidth: "600px",
        }}
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
            <h2
              style={{
                margin: 0,
                color: "#1e293b",
                fontWeight: "500",
              }}
            >
              {titlePrefix} PRs
            </h2>
            <MdClose
              size={28}
              className="close-icon"
              onClick={onClose}
              style={{
                cursor: "pointer",
                color: "#ef4444",
              }}
            />
          </div>

          <div className="modal-body px-4 pb-4">
            {/* Show PR actions when eligible apps exist, otherwise show guidance text. */}
            {validApps.length > 0 ? (
              validApps.map((repoName, idx) => {
                // Resolve branch names and compare URL parts for this repository.
                const appConfig = repoConfig[repoName];
                const targetBranch = appConfig.envBranches[targetBranchKey];
                const sourceBranch = appConfig.envBranches[sourceBranchKey];
                const baseUrl =
                  appConfig.baseUrl ||
                  `https://github.com/comprodls/${repoName}/compare/`;
                return (
                  <div key={idx} className="pr-repo-card">
                    <div className="pr-repo-title-wrapper">
                      <strong className="pr-repo-title">{repoName}</strong>
                    </div>

                    <div className="pr-branch-list">
                      <div className="pr-branch-item">
                        <span className="pr-branch-name">
                          {sourceBranch} ➔ {targetBranch}
                        </span>
                        {/* Build and open GitHub compare page in a new tab. */}
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
              <p className="pr-empty-text">
                No apps with both <strong>{targetBranchKey}</strong> and{" "}
                <strong>{sourceBranchKey}</strong> branches found for this
                release.
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default PrModal;
