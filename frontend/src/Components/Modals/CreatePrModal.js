// Create PR modal.
//
// Complete flow:
// 1) Receive appName + featureBranch context from parent.
// 2) Read branch targets from repoConfig.
// 3) Build compare URL for selected target branch.
// 4) Open GitHub compare page in a new tab and close modal.
import { MdClose } from "react-icons/md";
import { FaGithub } from "react-icons/fa";
import { repoConfig } from "../../utils/AppConfig";
import "../Modals/EditStoryModal.css";

const CreatePrModal = ({ isOpen, onClose, appName, featureBranch }) => {
  // Skip render entirely when modal is closed.
  if (!isOpen) return null;

  // Resolve selected app config.
  const appConfig = repoConfig[appName] || {};

  // Branch map (thor/qa/rel) for this app.
  const appBranches = appConfig.envBranches || {};

  // Base compare URL fallback when custom baseUrl is absent.
  const baseUrl =
    appConfig.baseUrl || `https://github.com/comprodls/${appName}/compare/`;

  // Opens GitHub compare page for selected target branch.
  const handleGeneratePR = (e, targetBranch) => {
    // Prevent form submit refresh behavior.
    e.preventDefault();

    // Guard invalid branch.
    if (!targetBranch) return;

    // Format compare URL as: target...feature.
    const prUrl = `${baseUrl}${targetBranch}...${featureBranch}`;

    // Open GitHub page and close this modal.
    window.open(prUrl, "_blank");
    onClose();
  };

  // ------------------------------
  // Render
  // ------------------------------
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
            <h2>
              <FaGithub />
            </h2>
            <MdClose size={28} className="close-icon" onClick={onClose} />
          </div>

          <div className="modal-body px-4 pb-4">
            <form className="custom-modal-form">
              {/* Context summary for current app target. */}
              <p>
                Generate a PR link for <strong>{appName}</strong>.
              </p>

              {/* Read-only source branch that will be compared into target branch. */}
              <label className="form-label full-width">
                Feature Branch
                <input
                  type="text"
                  value={featureBranch}
                  readOnly
                  className="form-input"
                />
              </label>

              {/* Render buttons only for branch targets that exist in app config. */}
              <div
                className="custom-modal-actions"
                style={{
                  justifyContent: "center",
                }}
              >
                {appBranches.thor && (
                  <button
                    className="storyDetails-modal-btn-pr"
                    type="button"
                    onClick={(e) => handleGeneratePR(e, appBranches.thor)}
                  >
                    PR Thor
                  </button>
                )}

                {appBranches.qa && (
                  <button
                    className="storyDetails-modal-btn-pr"
                    type="button"
                    onClick={(e) => handleGeneratePR(e, appBranches.qa)}
                  >
                    PR Qa
                  </button>
                )}

                {appBranches.rel && (
                  <button
                    className="storyDetails-modal-btn-pr"
                    type="button"
                    onClick={(e) => handleGeneratePR(e, appBranches.rel)}
                  >
                    PR Rel
                  </button>
                )}
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
};
export default CreatePrModal;
