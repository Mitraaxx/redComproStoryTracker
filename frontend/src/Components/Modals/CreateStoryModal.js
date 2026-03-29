import React, { useState, useEffect } from "react";
import { MdClose, MdAdd, MdDelete, MdEdit } from "react-icons/md";
import "../Modals/EditStoryModal.css";
import "../Modals/CreateStoryHalfModal.css";
import {
  repoConfig,
  TEAM_MEMBERS,
  STATUS_MEMBERS,
} from "../../utils/AppConfig";

/**
 * A comprehensive modal component for creating a new story.
 * Handles story metadata, assigning a sprint, managing a list of apps to be deployed,
 * and linking multiple application repositories with their branch details via a nested modal.
 */
const CreateStoryModal = ({
  isOpen,
  onClose,
  handleSave,
  saving,
  sprintsList = [],
  releasesList = [],
  initialSprintName = "",
  sprintId = null,
  hideSprintField = false,
}) => {
  const [formData, setFormData] = useState({
    status: "",
    sprintName: "",
  });
  const [appsList, setAppsList] = useState([]);

  const [deployAppsList, setDeployAppsList] = useState([]);
  const [deployAppInput, setDeployAppInput] = useState("");

  const [isAppFormOpen, setIsAppFormOpen] = useState(false);
  const [appFormData, setAppFormData] = useState({});
  const [editingAppIndex, setEditingAppIndex] = useState(null);

  useEffect(() => {
    if (isOpen) {
      setFormData({ status: "", sprintName: initialSprintName || "" });
      setAppsList([]);
      setDeployAppsList([]);
      setDeployAppInput("");
      setEditingAppIndex(null);
    }
  }, [isOpen, initialSprintName]);

  if (!isOpen) return null;

  /**
   * Captures general input changes for the main story form.
   */
  const handleChange = (e) =>
    setFormData({ ...formData, [e.target.name]: e.target.value });

  /**
   * Prevents default form submission on Enter key, 
   * except when typing in textareas or the specific deploy app input field.
   */
  const handleKeyDown = (e) => {
    if (
      e.key === "Enter" &&
      e.target.tagName !== "TEXTAREA" &&
      e.target.name !== "appsToBeDeployedInput"
    ) {
      e.preventDefault();
    }
  };

  /**
   * Validates and adds a new app name to the `deployAppsList` state.
   * Ensures no duplicates are added and clears the input field afterward.
   */
  const addDeployApp = () => {
    if (
      deployAppInput.trim() &&
      !deployAppsList.includes(deployAppInput.trim())
    ) {
      setDeployAppsList([...deployAppsList, deployAppInput.trim()]);
    }
    setDeployAppInput("");
  };

  /**
   * Removes an application from the `deployAppsList` based on its index.
   */
  const removeDeployApp = (indexToRemove) => {
    setDeployAppsList(
      deployAppsList.filter((_, index) => index !== indexToRemove),
    );
  };

  /**
   * Triggers the `addDeployApp` function when the Enter key is pressed inside the deploy app input.
   */
  const handleDeployAppKeyDown = (e) => {
    if (e.key === "Enter") {
      e.preventDefault();
      addDeployApp();
    }
  };

  /**
   * Handles the final submission of the main story form.
   * Validates the sprint selection and compiles all data (form data, linked apps, deploy apps) 
   * before sending it to the parent component's save handler.
   */
  const submitMainForm = (e) => {
    e.preventDefault();

    let finalSprintId = sprintId;

    if (
      !hideSprintField &&
      formData.sprintName &&
      formData.sprintName.trim() !== ""
    ) {
      const matchedSprint = sprintsList.find(
        (s) => s.name === formData.sprintName.trim(),
      );

      if (!matchedSprint) {
        alert(
          "Sprint not found! Please select a valid sprint from the list or leave it empty.",
        );
        return;
      }
      finalSprintId = matchedSprint._id;
    }

    handleSave({
      ...formData,
      sprintId: finalSprintId,
      appsData: appsList,
      appsToBeDeployed: deployAppsList,
    });
  };

  /**
   * Opens the nested application form modal and resets its state to link a new app.
   */
  const openAppForm = () => {
    setAppFormData({
      appName: "",
      featureBranches: "",
      baseBranch: "",
      dependencies: "",
      notes: "",
    });
    setEditingAppIndex(null);
    setIsAppFormOpen(true);
  };

  /**
   * Opens the nested application form modal and populates it with the details of an existing linked app for editing.
   */
  const editApp = (index) => {
    setAppFormData(appsList[index]);
    setEditingAppIndex(index);
    setIsAppFormOpen(true);
  };

  /**
   * Captures input changes specifically for the nested application form.
   */
  const handleAppChange = (e) =>
    setAppFormData({ ...appFormData, [e.target.name]: e.target.value });

  /**
   * Validates and saves the application details from the nested form.
   * Updates an existing entry if editing, or adds a new entry to the `appsList`.
   */
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

  /**
   * Removes a linked application from the `appsList` based on its index.
   */
  const removeApp = (index) => {
    const newList = [...appsList];
    newList.splice(index, 1);
    setAppsList(newList);
  };

  
  const availableApps = Object.keys(repoConfig).filter((appName) => {
    const isAlreadyAdded = appsList?.some(
      (addedApp) => addedApp.appName === appName,
    );
    const isCurrentlyEditing =
      editingAppIndex !== null &&
      appsList[editingAppIndex]?.appName === appName;
    return !isAlreadyAdded || isCurrentlyEditing;
  });

  const isAllAppsAdded = appsList.length >= Object.keys(repoConfig).length;

  const availableDeployApps = Object.keys(repoConfig).filter(
    (appName) => !deployAppsList.includes(appName),
  );

  return (
    <>
      <div className="modal-overlay">
        <div className="modal-content main-modal relative-modal">
          <div className="modal-header">
            <h2>Create New Story</h2>
            <MdClose size={28} className="close-icon" onClick={onClose} />
          </div>

          <form
            onSubmit={submitMainForm}
            onKeyDown={handleKeyDown}
            className="modal-form"
          >
            <div className="form-grid">
              <label className="form-label">
                <span>
                  Story ID <span className="required-asterisk">*</span>
                </span>
                <input
                  type="text"
                  name="storyId"
                  onChange={handleChange}
                  required
                  className="form-input"
                />
              </label>

              <label className="form-label">
                <span>
                  Story Name <span className="required-asterisk">*</span>
                </span>
                <input
                  type="text"
                  name="storyName"
                  onChange={handleChange}
                  required
                  className="form-input"
                />
              </label>

              {!hideSprintField && (
                <label className="form-label">
                  <span>Sprint Name</span>
                  <input
                    list="new-story-sprint-options"
                    name="sprintName"
                    value={formData.sprintName || ""}
                    onChange={handleChange}
                    className="form-input"
                    placeholder="Select Sprint"
                    autoComplete="off"
                  />
                  <datalist id="new-story-sprint-options">
                    {sprintsList.map((s) => (
                      <option key={s._id} value={s.name} />
                    ))}
                  </datalist>
                </label>
              )}

              <label className="form-label">
                <span>Currently With</span>
                <input
                  list="team-option"
                  type="text"
                  name="status"
                  value={formData.status || ""}
                  onChange={handleChange}
                  className="form-input"
                  autoComplete="off"
                  placeholder="Story is with"
                />
                <datalist id="team-option">
                  {STATUS_MEMBERS.map((member, i) => (
                    <option key={i} value={member} />
                  ))}
                </datalist>
              </label>

              <label className="form-label">
                <span>Story Points</span>
                <input
                  type="number"
                  name="storyPoints"
                  onChange={handleChange}
                  className="form-input"
                />
              </label>
              <label className="form-label">
                <span>Responsibility</span>
                <input
                  list="team-options"
                  type="text"
                  name="responsibility"
                  onChange={handleChange}
                  className="form-input"
                  autoComplete="off"
                  placeholder="Select Team Member"
                />
                <datalist id="team-options">
                  {TEAM_MEMBERS.map((member, i) => (
                    <option key={i} value={member} />
                  ))}
                </datalist>
              </label>
              <label className="form-label">
                <span>Qa Release Date</span>
                <input
                  type="date"
                  name="qaEnvRelDate"
                  onChange={handleChange}
                  className="form-input"
                />
              </label>
              <label className="form-label">
                <span>Live Release Date</span>
                <input
                  type="date"
                  name="liveEnvRelease"
                  onChange={handleChange}
                  className="form-input"
                />
              </label>
              <label className="form-label">
                <span>Release Tag</span>
                <input
                  list="new-story-release-options"
                  type="text"
                  name="releaseTag"
                  onChange={handleChange}
                  className="form-input"
                  placeholder="Select release tag"
                  autoComplete="off"
                />
                <datalist id="new-story-release-options">
                  {releasesList.map((r) => (
                    <option key={r._id} value={r.name} />
                  ))}
                </datalist>
              </label>
              <label className="form-label">
                <span>EPIC</span>
                <input
                  type="text"
                  name="epic"
                  onChange={handleChange}
                  className="form-input"
                />
              </label>
              <label className="form-label">
                <span>Category</span>
                <input
                  type="text"
                  name="category"
                  onChange={handleChange}
                  className="form-input"
                />
              </label>
              <label className="form-label">
                <span>First Review</span>
                <input
                  list="team-options"
                  type="text"
                  name="firstReview"
                  onChange={handleChange}
                  className="form-input"
                  autoComplete="off"
                  placeholder="Select Team Member"
                />
              </label>

              <label className="form-label">
                <span>Type</span>
                <input
                  list="type-options"
                  name="type"
                  value={formData.type || ""}
                  onChange={handleChange}
                  className="form-input"
                  autoComplete="off"
                  placeholder="Select Type"
                />
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
                  <button
                    type="button"
                    onClick={addDeployApp}
                    style={{
                      padding: "0 12px",
                      backgroundColor: "#3b82f6",
                      color: "white",
                      border: "none",
                      borderRadius: "6px",
                      cursor: "pointer",
                      fontWeight: "600",
                    }}
                  >
                    Add
                  </button>
                </div>
                <datalist id="deploy-apps-options">
                  {availableDeployApps.map((appName, i) => (
                    <option key={i} value={appName}>
                      {appName}
                    </option>
                  ))}
                </datalist>

                {deployAppsList.length > 0 && (
                  <div
                    style={{
                      display: "flex",
                      flexWrap: "wrap",
                      gap: "6px",
                      marginTop: "8px",
                    }}
                  >
                    {deployAppsList.map((app, index) => (
                      <span
                        key={index}
                        style={{
                          backgroundColor: "#eff6ff",
                          color: "#2563eb",
                          padding: "4px 8px",
                          borderRadius: "6px",
                          fontSize: "0.8rem",
                          display: "flex",
                          alignItems: "center",
                          gap: "6px",
                          border: "1px solid #bfdbfe",
                        }}
                      >
                        {app}
                        <MdClose
                          size={14}
                          style={{ cursor: "pointer" }}
                          onClick={() => removeDeployApp(index)}
                        />
                      </span>
                    ))}
                  </div>
                )}
              </label>
            </div>

            <label className="form-label full-width">
              <span>Comments</span>
              <textarea
                name="comments"
                onChange={handleChange}
                rows="2"
                className="form-input textarea-input"
              ></textarea>
            </label>

            <div className="apps-section">
              <div className="apps-header">
                <h3 className="apps-title">Linked Apps</h3>
                <button
                  type="button"
                  onClick={openAppForm}
                  className="btn-add-app"
                >
                  <MdAdd size={18} /> Add App
                </button>
              </div>

              {appsList.length > 0 ? (
                <ul className="apps-list">
                  {appsList.map((app, index) => (
                    <li key={index} className="app-item">
                      <div className="app-details">
                        <strong className="app-name-highlight">
                          {app.appName}
                        </strong>
                        <span className="app-branch">
                          Branch: {app.featureBranches || "N/A"}
                        </span>
                      </div>
                      <div className="app-actions">
                        <MdEdit
                          size={22}
                          className="edit-icon"
                          onClick={() => editApp(index)}
                          title="Edit App"
                        />
                        <MdDelete
                          size={22}
                          className="delete-icon"
                          onClick={() => removeApp(index)}
                          title="Remove App"
                        />
                      </div>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="no-apps-text">
                  No apps linked yet. Click 'Add App' to attach one.
                </p>
              )}
            </div>

            <div className="modal-actions main-actions">
              <button
                type="submit"
                disabled={saving}
                className="btn-save primary"
              >
                {saving ? "Saving..." : "Create Story"}
              </button>
            </div>
          </form>
        </div>
      </div>

      {isAppFormOpen && (
        <div className="modal-overlay nested-overlay">
          <div className="modal-content nested-modal-content">
            <div className="modal-header">
              <h2>
                {editingAppIndex !== null
                  ? "Edit App Details"
                  : "Add App Details"}
              </h2>
              <MdClose
                size={28}
                className="close-icon"
                onClick={() => {
                  setIsAppFormOpen(false);
                  setEditingAppIndex(null);
                }}
              />
            </div>

            <div className="modal-form">
              <label className="form-label full-width">
                <span>
                  Select App <span className="required-asterisk">*</span>
                </span>
                <input
                  list="app-options"
                  name="appName"
                  value={appFormData.appName || ""}
                  onChange={handleAppChange}
                  className="form-input"
                  placeholder="Type to search app..."
                  autoComplete="off"
                />
                <datalist id="app-options">
                  {availableApps.map((appName, i) => (
                    <option key={i} value={appName}>
                      {appName}
                    </option>
                  ))}
                </datalist>
              </label>
              <label className="form-label full-width">
                <span>Feature Branch</span>
                <input
                  type="text"
                  name="featureBranches"
                  value={appFormData.featureBranches || ""}
                  onChange={handleAppChange}
                  className="form-input"
                />
              </label>
              <label className="form-label full-width">
                <span>Base Branch</span>
                <input
                  type="text"
                  name="baseBranch"
                  value={appFormData.baseBranch || ""}
                  onChange={handleAppChange}
                  className="form-input"
                />
              </label>
              <label className="form-label full-width">
                <span>Dependencies</span>
                <input
                  type="text"
                  name="dependencies"
                  value={appFormData.dependencies || ""}
                  onChange={handleAppChange}
                  className="form-input"
                />
              </label>
              <label className="form-label full-width">
                <span>Notes</span>
                <textarea
                  name="notes"
                  value={appFormData.notes || ""}
                  onChange={handleAppChange}
                  rows="2"
                  className="form-input textarea-input"
                ></textarea>
              </label>

              <div className="modal-actions nested-actions">
                <button
                  type="button"
                  onClick={saveAppToList}
                  disabled={isAllAppsAdded && editingAppIndex === null}
                  className="btn-save primary"
                >
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

export default CreateStoryModal;