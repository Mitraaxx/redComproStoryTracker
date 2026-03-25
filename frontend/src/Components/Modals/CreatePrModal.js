import React, { useState } from "react";
import { MdClose } from "react-icons/md";
import { FaGithub } from "react-icons/fa";
import { PR_BASE_BRANCHES, APPS_CONFIG } from "../../utils/AppConfig";
import "../Modals//EditStoryModal.css";

/**
 * Modal component used to generate and open a GitHub Pull Request link
 * for a specific feature branch against a user-selected base branch.
 */
const CreatePrModal = ({ isOpen, onClose, appName, featureBranch }) => {
  const [baseBranch, setBaseBranch] = useState("");

  if (!isOpen) return null;

  /**
   * These are different functions to handle each 
   * button submit action
   */
  const handleThorSubmit = (e) => {
    e.preventDefault();

    const matchedApp = APPS_CONFIG.find((a) => a.repoName === appName);
    const orgName = matchedApp?.orgName || "YOUR_ORG_NAME";

    const prUrl = `https://github.com/${orgName}/${appName}/compare/env/thor...${featureBranch}`;

    window.open(prUrl, "_blank");
    onClose();
  };

  const handleQaSubmit = (e) => {
    e.preventDefault();

    const matchedApp = APPS_CONFIG.find((a) => a.repoName === appName);
    const orgName = matchedApp?.orgName || "YOUR_ORG_NAME";

    const prUrl = `https://github.com/${orgName}/${appName}/compare/env/qa...${featureBranch}`;

    window.open(prUrl, "_blank");
    onClose();
  };

  const handleRelSubmit = (e) => {
    e.preventDefault();

    const matchedApp = APPS_CONFIG.find((a) => a.repoName === appName);
    const orgName = matchedApp?.orgName || "YOUR_ORG_NAME";

    const prUrl = `https://github.com/${orgName}/${appName}/compare/env/release...${featureBranch}`;

    window.open(prUrl, "_blank");
    onClose();
  };

  return (
    <div className="modal-overlay">
      <div className="modal-content main-pr-modal">
        <div className="modal-header">
          <h2>
            <FaGithub />
          </h2>
          <MdClose size={28} className="close-icon" onClick={onClose} />
        </div>

        <form className="modal-form">
          <p>
            Generate a PR link for <strong>{appName}</strong>.
          </p>
          <label className="form-label full-width">
            Feature Branch
            <input
              type="text"
              value={featureBranch}
              readOnly
              className="form-input"
            />
          </label>

          <div className="modal-actions" style={{ justifyContent: "center" }}>
            <button
              className="storyDetails-modal-btn-pr"
              type="submit"
              onClick={handleThorSubmit}
            >
              PR Thor
            </button>

            <button
              className="storyDetails-modal-btn-pr"
              type="submit"
              onClick={handleQaSubmit}
            >
              PR Qa
            </button>

            <button
              className="storyDetails-modal-btn-pr"
              type="submit"
              onClick={handleRelSubmit}
            >
              PR Rel
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default CreatePrModal;
