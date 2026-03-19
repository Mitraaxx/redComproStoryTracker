import React, { useState } from "react";
import { MdClose } from "react-icons/md";
import { FaGithub } from "react-icons/fa";
import { PR_BASE_BRANCHES, APPS_CONFIG } from "../../utils/AppConfig";
import "../Modals//EditStoryModal.css"; 

const CreatePrModal = ({ isOpen, onClose, appName, featureBranch }) => {
  const [baseBranch, setBaseBranch] = useState("");

  if (!isOpen) return null;

  const handleGeneratePR = (e) => {
    e.preventDefault();
    if (!baseBranch) {
      alert("Please select a base branch!");
      return;
    }

    const matchedApp = APPS_CONFIG.find((a) => a.repoName === appName);
    const orgName = matchedApp?.orgName || "YOUR_ORG_NAME";

    const prUrl = `https://github.com/${orgName}/${appName}/compare/${baseBranch}...${featureBranch}`;
    
    window.open(prUrl, "_blank");
    onClose(); 
  };

  return (
    <div className="modal-overlay">
      <div className="modal-content main-pr-modal">
        <div className="modal-header">
          <h2><FaGithub /></h2>
          <MdClose size={28} className="close-icon" onClick={onClose} />
        </div>

        <form onSubmit={handleGeneratePR} className="modal-form">
          <p>Generate a PR link for <strong>{appName}</strong>.</p>
          <label className="form-label full-width">
            Feature Branch
            <input type="text" value={featureBranch} readOnly className="form-input" />
          </label>
          <label className="form-label full-width">
            Select Base Branch
            <select value={baseBranch} onChange={(e) => setBaseBranch(e.target.value)} required className="form-input">
              <option value="">-- Choose Base Branch --</option>
              {PR_BASE_BRANCHES.map((branch, idx) => (
                <option key={idx} value={branch.value}>{branch.label}</option>
              ))}
            </select>
          </label>
          <div className="modal-actions">
            <button type="submit" className="btn-save" style={{ backgroundColor: "#2ea44f" }}>Create PR</button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default CreatePrModal;