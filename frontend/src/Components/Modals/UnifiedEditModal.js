import React, { useState, useEffect } from "react";
import { MdClose, MdAdd, MdDelete, MdEdit } from "react-icons/md";
import "../Modals/EditStoryModal.css";
import "../Modals/CreateStoryHalfModal.css";
import { APPS_CONFIG, TEAM_MEMBERS } from "../../utils/AppConfig";


const UnifiedEditModal = ({ isOpen, onClose, handleSave, saving, initialData, sprintsList = [], releasesList = [] }) => {
  const [formData, setFormData] = useState({});
  const [appsList, setAppsList] = useState([]);

  const [originalFormData, setOriginalFormData] = useState({});
  const [originalAppsList, setOriginalAppsList] = useState([]);

  // 👇 NAYA: Multiple Apps ke arrays
  const [deployAppsList, setDeployAppsList] = useState([]);
  const [originalDeployAppsList, setOriginalDeployAppsList] = useState([]);
  const [deployAppInput, setDeployAppInput] = useState("");

  const [isAppFormOpen, setIsAppFormOpen] = useState(false);
  const [appFormData, setAppFormData] = useState({});
  const [editingAppIndex, setEditingAppIndex] = useState(null);

  useEffect(() => {
    if (isOpen && initialData) {
      const formatDate = (dateString) => dateString ? new Date(dateString).toISOString().split("T")[0] : "";

      const formattedData = {
        storyId: initialData.storyId || "",
        storyName: initialData.storyName || "",
        sprintName: initialData.sprint?.name || initialData.sprintName || "", 
        status: initialData.status || "Pending",
        storyPoints: initialData.storyPoints || "",
        responsibility: initialData.responsibility || "",
        qaEnvRelDate: formatDate(initialData.qaEnvRelDate),
        liveEnvRelease: formatDate(initialData.liveEnvRelease),
        comments: initialData.comments || "",
        releaseTag: initialData.releaseTag || "",
        epic: initialData.epic || "",
        category: initialData.category || "",
        type: initialData.type || "",
        firstReview: initialData.firstReview || "",
      };

      let formattedApps = [];
      if (initialData.linkedApps && initialData.linkedApps.length > 0) {
        formattedApps = initialData.linkedApps.map(app => ({
          appName: app.appRef?.name || app.appName || "",
          featureBranches: Array.isArray(app.featureBranches) ? app.featureBranches.join(", ") : (app.featureBranches || ""),
          baseBranch: app.baseBranch || "",
          dependencies: app.dependencies || "",
          notes: app.notes || ""
        }));
      }

      // 👇 NAYA: Agar backend se pehle se array aayi hai toh load karo, warna empty rakho
      const initialDeployApps = Array.isArray(initialData.appsToBeDeployed) 
        ? initialData.appsToBeDeployed 
        : (initialData.appsToBeDeployed ? [initialData.appsToBeDeployed] : []);

      setFormData(formattedData);
      setOriginalFormData(formattedData);
      
      setAppsList(formattedApps);
      setOriginalAppsList(formattedApps);

      setDeployAppsList(initialDeployApps);
      setOriginalDeployAppsList(initialDeployApps);
      setDeployAppInput("");
    }
  }, [isOpen, initialData]);

  if (!isOpen) return null;

  const handleChange = (e) => setFormData({ ...formData, [e.target.name]: e.target.value });
  
  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && e.target.tagName !== 'TEXTAREA' && e.target.name !== 'appsToBeDeployedInput') {
      e.preventDefault();
    }
  };

  // 👇 NAYA: Deploy App Functions
  const addDeployApp = () => {
    if (deployAppInput.trim() && !deployAppsList.includes(deployAppInput.trim())) {
      setDeployAppsList([...deployAppsList, deployAppInput.trim()]);
    }
    setDeployAppInput("");
  };

  const removeDeployApp = (indexToRemove) => {
    setDeployAppsList(deployAppsList.filter((_, index) => index !== indexToRemove));
  };

  const handleDeployAppKeyDown = (e) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      addDeployApp();
    }
  };

  const submitMainForm = (e) => {
    e.preventDefault();

    const isFormUnchanged = JSON.stringify(formData) === JSON.stringify(originalFormData);
    const isAppsUnchanged = JSON.stringify(appsList) === JSON.stringify(originalAppsList);
    // 👇 NAYA: Deploy Apps compare check
    const isDeployAppsUnchanged = JSON.stringify(deployAppsList) === JSON.stringify(originalDeployAppsList);

    if (isFormUnchanged && isAppsUnchanged && isDeployAppsUnchanged) {
      console.log("No changes detected. Skipping API call.");
      onClose();
      return; 
    }
    
    let finalSprintId = null;

    if (formData.sprintName && formData.sprintName.trim() !== "") {
      const matchedSprint = sprintsList.find((s) => s.name === formData.sprintName.trim());
      
      if (!matchedSprint) {
        alert("Sprint not found! Please select a valid sprint from the list or leave it empty for backlog.");
        return; 
      }
      finalSprintId = matchedSprint._id;
    }

    // 👇 NAYA: Array pass kiya
    handleSave({ 
      ...formData, 
      sprint: finalSprintId, 
      sprintId: finalSprintId, 
      appsData: appsList,
      appsToBeDeployed: deployAppsList 
    });
  };

  const openAppForm = () => {
    setAppFormData({ appName: "", featureBranches: "", baseBranch: "", dependencies: "", notes: "" });
    setEditingAppIndex(null);
    setIsAppFormOpen(true);
  };
  
  const editApp = (index) => {
    setAppFormData(appsList[index]); 
    setEditingAppIndex(index); 
    setIsAppFormOpen(true); 
  };

  const handleAppChange = (e) => setAppFormData({ ...appFormData, [e.target.name]: e.target.value });

  const saveAppToList = () => {
    if (!appFormData.appName) return alert("Please select an App Name!");
    
    if (editingAppIndex !== null) {
      const updatedList = [...appsList];
      updatedList[editingAppIndex] = appFormData; 
      setAppsList(updatedList);
    } else {
      setAppsList([...appsList, appFormData]);
    }
    
    setIsAppFormOpen(false); 
    setEditingAppIndex(null); 
  };

  const removeApp = (index) => {
    const newList = [...appsList];
    newList.splice(index, 1);
    setAppsList(newList);
  };

  const availableApps = APPS_CONFIG.filter((appObj) => {
  const isAlreadyAdded = appsList?.some((addedApp) => addedApp.appName === appObj.repoName);
  const isCurrentlyEditing = editingAppIndex !== null && appsList[editingAppIndex]?.appName === appObj.repoName;
  return !isAlreadyAdded || isCurrentlyEditing;
  });

  const isAllAppsAdded = appsList.length >= APPS_CONFIG.length;

  return (
    <>
      <div className="modal-overlay">
        <div className="modal-content main-modal relative-modal">
          <div className="modal-header">
            <h2>Edit Story & Apps</h2>
            <MdClose size={28} className="close-icon" onClick={onClose} />
          </div>

          <form onSubmit={submitMainForm} onKeyDown={handleKeyDown} className="modal-form">
            <div className="form-grid">
              <label className="form-label">
                <span>Story Name <span className="required-asterisk">*</span></span>
                <input type="text" name="storyName" value={formData.storyName || ""} onChange={handleChange} required className="form-input" />
              </label>

              <label className="form-label">
                <span>Sprint Name</span>
                <input list="sprint-options" name="sprintName" value={formData.sprintName || ""} onChange={handleChange} className="form-input" placeholder="Select Sprint" autoComplete="off" />
                <datalist id="sprint-options">
                  {sprintsList && sprintsList.map((s) => <option key={s._id} value={s.name} />)}
                </datalist>
              </label>

              <label className="form-label">
                Status
                <input type="text" name="status" value={formData.status || ""} onChange={handleChange} className="form-input" />
              </label>

              <label className="form-label">
                <span>Story Points</span>
                <input type="number" name="storyPoints" value={formData.storyPoints || ""} onChange={handleChange} className="form-input" />
              </label>

              <label className="form-label">
                <span>Responsibility</span>
                <input list="team-options" type="text" name="responsibility" value={formData.responsibility || ""} onChange={handleChange} className="form-input" autoComplete="off" placeholder="Select Team Member" />
                <datalist id="team-options">
                  {TEAM_MEMBERS.map((member, i) => <option key={i} value={member} />)}
                </datalist>
              </label>

              <label className="form-label">
                <span>QA Release Date</span>
                <input type="date" name="qaEnvRelDate" value={formData.qaEnvRelDate || ""} onChange={handleChange} className="form-input" />
              </label>

              <label className="form-label">
                <span>Live Release Date</span>
                <input type="date" name="liveEnvRelease" value={formData.liveEnvRelease || ""} onChange={handleChange} className="form-input" />
              </label>

              <label className="form-label">
                <span>Release Tag</span>
                <input list="edit-story-release-options" type="text" name="releaseTag" value={formData.releaseTag || ""} onChange={handleChange} className="form-input" placeholder="Select release tag" autoComplete="off" />
                <datalist id="edit-story-release-options">
                  {releasesList && releasesList.map((r) => <option key={r._id} value={r.name} />)}
                </datalist>
              </label>

              <label className="form-label">
                <span>EPIC</span>
                <input type="text" name="epic" value={formData.epic || ""} onChange={handleChange} className="form-input" />
              </label>

              <label className="form-label">
                <span>Category</span>
                <input type="text" name="category" value={formData.category || ""} onChange={handleChange} className="form-input" />
              </label>

              <label className="form-label">
                <span>First Review</span>
                <input list="team-options" type="text" name="firstReview" value={formData.firstReview || ""} onChange={handleChange} className="form-input" autoComplete="off" placeholder="Select Team Member" />
              </label>

              <label className="form-label">
                <span>Type</span>
                <input list="type-options" name="type" value={formData.type || ""} onChange={handleChange} className="form-input" autoComplete="off" placeholder="Select Type" />
                <datalist id="type-options">
                  <option value="Feature" />
                  <option value="Bug" />
                  <option value="Spike" />
                </datalist>
              </label>

              <label className="form-label">
                <span>Apps to be deployed</span>
                <div style={{ display: "flex", gap: "6px" }}>
                  <input
                    list="deploy-apps-options"
                    type="text"
                    name="appsToBeDeployedInput"
                    value={deployAppInput}
                    onChange={(e) => setDeployAppInput(e.target.value)}
                    onKeyDown={handleDeployAppKeyDown}
                    className="form-input"
                    autoComplete="off"
                    placeholder="Select & press Add"
                  />
                  <button type="button" onClick={addDeployApp} style={{ padding: "0 12px", backgroundColor: "#3b82f6", color: "white", border: "none", borderRadius: "6px", cursor: "pointer", fontWeight: "600" }}>
                    Add
                  </button>
                </div>
                <datalist id="deploy-apps-options">
                  {APPS_CONFIG.map((app, i) => (
                    <option key={i} value={app.repoName}>{app.repoName}</option>
                  ))}
                </datalist>
                
                {/* Selected Apps Tags */}
                {deployAppsList.length > 0 && (
                  <div style={{ display: "flex", flexWrap: "wrap", gap: "6px", marginTop: "8px" }}>
                    {deployAppsList.map((app, index) => (
                      <span key={index} style={{ backgroundColor: "#eff6ff", color: "#2563eb", padding: "4px 8px", borderRadius: "6px", fontSize: "0.8rem", display: "flex", alignItems: "center", gap: "6px", border: "1px solid #bfdbfe" }}>
                        {app}
                        <MdClose size={14} style={{ cursor: "pointer" }} onClick={() => removeDeployApp(index)} />
                      </span>
                    ))}
                  </div>
                )}
              </label>
            </div>

            <label className="form-label full-width">
              <span>Comments</span>
              <textarea name="comments" value={formData.comments || ""} onChange={handleChange} rows="2" className="form-input textarea-input"></textarea>
            </label>

            {/* ================= APPS SECTION ================= */}
            <div className="apps-section">
              <div className="apps-header">
                <h3 className="apps-title">Linked Apps</h3>
                <button type="button" onClick={openAppForm} className="btn-add-app">
                  <MdAdd size={18} /> Add App
                </button>
              </div>

              {appsList.length > 0 ? (
                <ul className="apps-list">
                  {appsList.map((app, index) => (
                    <li key={index} className="app-item">
                      <div className="app-details">
                        <strong className="app-name-highlight">{app.appName}</strong>
                        <span className="app-branch">Branch: {app.featureBranches || "N/A"}</span>
                      </div>
                      <div className="app-actions">
                        <MdEdit size={22} className="edit-icon" onClick={() => editApp(index)} title="Edit App" />
                        <MdDelete size={22} className="delete-icon" onClick={() => removeApp(index)} title="Remove App" />
                      </div>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="no-apps-text">No apps linked yet. Click 'Add App' to attach one.</p>
              )}
            </div>

            <div className="modal-actions main-actions">
              <button type="submit" disabled={saving} className="btn-save primary">
                {saving ? "Saving..." : "Save Changes"}
              </button>
            </div>
          </form>
        </div>
      </div>

      {/* ================= NESTED APP OVERLAY ================= */}
      {isAppFormOpen && (
        <div className="modal-overlay nested-overlay">
          <div className="modal-content nested-modal-content">
            <div className="modal-header">
              <h2>{editingAppIndex !== null ? "Edit App Details" : "Add App Details"}</h2>
              <MdClose size={28} className="close-icon" onClick={() => { setIsAppFormOpen(false); setEditingAppIndex(null); }} />
            </div>

            <div className="modal-form">
              <label className="form-label full-width">
                <span>Select App <span className="required-asterisk">*</span></span>
                <input list="app-options" name="appName" value={appFormData.appName || ""} onChange={handleAppChange} className="form-input" placeholder="Type to search app..." autoComplete="off" />
                <datalist id="app-options">
                  {availableApps.map((app, i) => (
                    <option key={i} value={app.repoName}>{app.repoName}</option>
                  ))}
                </datalist>
              </label>
              <label className="form-label full-width">
                <span>Feature Branch</span>
                <input type="text" name="featureBranches" value={appFormData.featureBranches || ""} onChange={handleAppChange} className="form-input" />
              </label>
              <label className="form-label full-width">
                <span>Base Branch</span>
                <input type="text" name="baseBranch" value={appFormData.baseBranch || ""} onChange={handleAppChange} className="form-input" />
              </label>
              <label className="form-label full-width">
                <span>Dependencies</span>
                <input type="text" name="dependencies" value={appFormData.dependencies || ""} onChange={handleAppChange} className="form-input" />
              </label>
              <label className="form-label full-width">
                <span>Notes</span>
                <textarea name="notes" value={appFormData.notes || ""} onChange={handleAppChange} rows="2" className="form-input textarea-input"></textarea>
              </label>

              <div className="modal-actions nested-actions">
                <button type="button" onClick={saveAppToList} disabled={isAllAppsAdded && editingAppIndex === null} className="btn-save primary">
                  Save
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default UnifiedEditModal;