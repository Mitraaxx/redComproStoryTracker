import React from "react";
import { MdClose } from "react-icons/md";
import { FaGithub } from "react-icons/fa";
import { repoConfig } from "../../utils/AppConfig";
import "../Modals/EditStoryModal.css";

/**
 * Modal component used to generate and open a GitHub Pull Request link
 * for a specific feature branch against dynamically fetched base branches.
 */
const CreatePrModal = ({ isOpen, onClose, appName, featureBranch }) => {
  if (!isOpen) return null;

  const appConfig = repoConfig[appName] || {};
  const appBranches = appConfig.envBranches || {};
  
  const baseUrl = appConfig.baseUrl || `https://github.com/comprodls/${appName}/compare/`;

  /**
   * Common handle for all the buttons
   */
  const handleGeneratePR = (e, targetBranch) => {
    e.preventDefault();
    if (!targetBranch) return;

    const prUrl = `${baseUrl}${targetBranch}...${featureBranch}`;

    window.open(prUrl, "_blank");
    onClose();
  };

  return (
    <div className="custom-modal-overlay">
      <div className="custom-modal-content main-pr-modal">
        <div className="custom-modal-header">
          <h2>
            <FaGithub />
          </h2>
          <MdClose size={28} className="close-icon" onClick={onClose} />
        </div>

        <form className="custom-modal-form">
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

          <div className="custom-modal-actions" style={{ justifyContent: "center" }}>  
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
  );
};

export default CreatePrModal;