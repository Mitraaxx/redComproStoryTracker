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
          <h2>
            <FaGithub />
          </h2>
          <MdClose size={28} className="close-icon" onClick={onClose} />
        </div>
        
        <div className="modal-body px-4 pb-4">
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
      </div>
    </div>
  );
};

export default CreatePrModal;