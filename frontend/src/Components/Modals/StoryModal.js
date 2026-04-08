import React, { useState, useEffect } from "react";
import { MdClose, MdAdd, MdDelete, MdEdit } from "react-icons/md";
import "../Modals/EditStoryModal.css";
import "../Modals/CreateStoryHalfModal.css";
import {
  repoConfig,
  TEAM_MEMBERS,
  STATUS_MEMBERS,
} from "../../utils/AppConfig";
import SearchableSelect from "../Tools/SeachableSelect";

/**
 * Universal Modal for BOTH Creating and Editing a Story.
 * Switches to "Edit Mode" if `initialData` is provided.
 */
const StoryModal = ({
  isOpen,
  onClose,
  handleSave,
  saving,
  initialData = null, 
  sprintsList = [],
  releasesList = [],
  initialSprintName = "",
  sprintId = null,
  hideSprintField = false,
}) => {
  const [formData, setFormData] = useState({});
  const [appsList, setAppsList] = useState([]);

  const [originalFormData, setOriginalFormData] = useState({});
  const [originalAppsList, setOriginalAppsList] = useState([]);

  const [deployAppsList, setDeployAppsList] = useState([]);
  const [originalDeployAppsList, setOriginalDeployAppsList] = useState([]);
  const [deployAppInput, setDeployAppInput] = useState("");

  const [isAppFormOpen, setIsAppFormOpen] = useState(false);
  const [appFormData, setAppFormData] = useState({});
  const [editingAppIndex, setEditingAppIndex] = useState(null);

  useEffect(() => {
    if (isOpen) {
      if (initialData) {
        // ================= EDIT MODE SETUP =================
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

        const initialDeployApps = Array.isArray(initialData.appsToBeDeployed) 
          ? initialData.appsToBeDeployed 
          : (initialData.appsToBeDeployed ? [initialData.appsToBeDeployed] : []);

        setFormData(formattedData);
        setOriginalFormData(formattedData);
        
        setAppsList(formattedApps);
        setOriginalAppsList(formattedApps);

        setDeployAppsList(initialDeployApps);
        setOriginalDeployAppsList(initialDeployApps);
      } else {
        // ================= CREATE MODE SETUP =================
        const resetData = { status: "", sprintName: initialSprintName || "", storyId: "", storyName: "" };
        setFormData(resetData);
        setOriginalFormData(resetData);
        setAppsList([]);
        setOriginalAppsList([]);
        setDeployAppsList([]);
        setOriginalDeployAppsList([]);
      }
      setDeployAppInput("");
      setEditingAppIndex(null);
    }
  }, [isOpen, initialData, initialSprintName]);

  if (!isOpen) return null;

  const handleChange = (e) => setFormData({ ...formData, [e.target.name]: e.target.value });

  const handleKeyDown = (e) => {
    if (e.key === "Enter" && e.target.tagName !== "TEXTAREA" && e.target.name !== "appsToBeDeployedInput") {
      e.preventDefault();
    }
  };

  const addDeployApp = () => {
    if (deployAppInput.trim() && !deployAppsList.includes(deployAppInput.trim())) {
      setDeployAppsList([...deployAppsList, deployAppInput.trim()]);
    }
    setDeployAppInput("");
  };

  const removeDeployApp = (indexToRemove) => {
    setDeployAppsList(deployAppsList.filter((_, index) => index !== indexToRemove));
  };

  const submitMainForm = (e) => {
    e.preventDefault();

    // No api call if the data is unchanged
    if (initialData) {
      const isFormUnchanged = JSON.stringify(formData) === JSON.stringify(originalFormData);
      const isAppsUnchanged = JSON.stringify(appsList) === JSON.stringify(originalAppsList);
      const isDeployAppsUnchanged = JSON.stringify(deployAppsList) === JSON.stringify(originalDeployAppsList);

      if (isFormUnchanged && isAppsUnchanged && isDeployAppsUnchanged) {
        console.log("No changes detected. Skipping API call.");
        onClose();
        return; 
      }
    }

    let finalSprintId = sprintId;

    if (!hideSprintField && formData.sprintName && formData.sprintName.trim() !== "") {
      const matchedSprint = sprintsList.find((s) => s.name === formData.sprintName.trim());
      if (!matchedSprint) {
        alert("Sprint not found! Please select a valid sprint from the list.");
        return;
      }
      finalSprintId = matchedSprint._id;
    } else if (!hideSprintField && (!formData.sprintName || formData.sprintName.trim() === "")) {
      finalSprintId = null; 
    }

    handleSave({
      ...formData,
      sprintId: finalSprintId,
      sprint: finalSprintId, 
      appsData: appsList,
      appsToBeDeployed: deployAppsList,
    });
  };

  // =============== NESTED APP LOGIC ===============
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

  const availableApps = Object.keys(repoConfig).filter((appName) => {
    const isAlreadyAdded = appsList?.some((addedApp) => addedApp.appName === appName);
    const isCurrentlyEditing = editingAppIndex !== null && appsList[editingAppIndex]?.appName === appName;
    return !isAlreadyAdded || isCurrentlyEditing;
  });

  const isAllAppsAdded = appsList.length >= Object.keys(repoConfig).length;
  const availableDeployApps = Object.keys(repoConfig).filter((appName) => !deployAppsList.includes(appName));

  return (
    <>
      {/* ================= MAIN STORY MODAL (Universal Bootstrap Layout) ================= */}
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
          style={{ maxWidth: "800px" }}
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
              }}
            >
              <h2 style={{ margin: 0, color: "#1e293b", fontWeight: "500" }}>
                {initialData ? "Edit Story & Apps" : "Create New Story"}
              </h2>
              <MdClose
                size={28}
                className="close-icon"
                onClick={onClose}
                style={{ cursor: "pointer" }}
              />
            </div>

            <div className="modal-body px-4 pb-4">
              <form
                id="storyForm"
                onSubmit={submitMainForm}
                onKeyDown={handleKeyDown}
              >
                <div className="row g-3">
                  <div className="col-12 col-md-6">
                    <label className="form-label w-100">
                      <span>
                        Story ID <span className="required-asterisk">*</span>
                      </span>
                      <input
                        type="text"
                        name="storyId"
                        value={formData.storyId || ""}
                        onChange={handleChange}
                        required
                        className="form-input"
                      />
                    </label>
                  </div>

                  <div className="col-12 col-md-6">
                    <label className="form-label w-100">
                      <span>
                        Story Name <span className="required-asterisk">*</span>
                      </span>
                      <input
                        type="text"
                        name="storyName"
                        value={formData.storyName || ""}
                        onChange={handleChange}
                        required
                        className="form-input"
                      />
                    </label>
                  </div>

                  {!hideSprintField && (
                    <div className="col-12 col-md-6">
                      <label className="form-label w-100">
                        <span>Sprint Name</span>
                        <SearchableSelect
                          name="sprintName"
                          value={formData.sprintName || ""}
                          onChange={handleChange}
                          options={sprintsList}
                          placeholder="Select Sprint"
                        />
                      </label>
                    </div>
                  )}

                  <div className="col-12 col-md-6">
                    <label className="form-label w-100">
                      <span>Currently With</span>
                      <SearchableSelect
                        name="status"
                        value={formData.status}
                        onChange={handleChange}
                        options={STATUS_MEMBERS}
                        placeholder="Story is with"
                      />
                    </label>
                  </div>

                  <div className="col-12 col-md-6">
                    <label className="form-label w-100">
                      <span>Story Points</span>
                      <input
                        type="number"
                        name="storyPoints"
                        value={formData.storyPoints || ""}
                        onChange={handleChange}
                        className="form-input"
                      />
                    </label>
                  </div>

                  <div className="col-12 col-md-6">
                    <label className="form-label w-100">
                      <span>Responsibility</span>
                      <SearchableSelect
                        name="responsibility"
                        value={formData.responsibility}
                        onChange={handleChange}
                        options={TEAM_MEMBERS}
                        placeholder="Select Team Member"
                      />
                    </label>
                  </div>

                  <div className="col-12 col-md-6">
                    <label className="form-label w-100">
                      <span>Qa Release Date</span>
                      <input
                        type="date"
                        name="qaEnvRelDate"
                        value={formData.qaEnvRelDate || ""}
                        onChange={handleChange}
                        className="form-input"
                      />
                    </label>
                  </div>

                  <div className="col-12 col-md-6">
                    <label className="form-label w-100">
                      <span>Live Release Date</span>
                      <input
                        type="date"
                        name="liveEnvRelease"
                        value={formData.liveEnvRelease || ""}
                        onChange={handleChange}
                        className="form-input"
                      />
                    </label>
                  </div>

                  <div className="col-12 col-md-6">
                    <label className="form-label w-100">
                      <span>Release Tag</span>
                      <SearchableSelect
                        name="releaseTag"
                        value={formData.releaseTag || ""}
                        onChange={handleChange}
                        options={releasesList}
                        placeholder="Select release tag"
                      />
                    </label>
                  </div>

                  <div className="col-12 col-md-6">
                    <label className="form-label w-100">
                      <span>EPIC</span>
                      <input
                        type="text"
                        name="epic"
                        value={formData.epic || ""}
                        onChange={handleChange}
                        className="form-input"
                      />
                    </label>
                  </div>

                  <div className="col-12 col-md-6">
                    <label className="form-label w-100">
                      <span>Category</span>
                      <input
                        type="text"
                        name="category"
                        value={formData.category || ""}
                        onChange={handleChange}
                        className="form-input"
                      />
                    </label>
                  </div>

                  <div className="col-12 col-md-6">
                    <label className="form-label w-100">
                      <span>First Review</span>
                      <SearchableSelect
                        name="firstReview"
                        value={formData.firstReview}
                        onChange={handleChange}
                        options={TEAM_MEMBERS}
                        placeholder="Select Team Member"
                      />
                    </label>
                  </div>

                  <div className="col-12 col-md-6">
                    <label className="form-label w-100">
                      <span>Type</span>
                      <SearchableSelect
                        name="type"
                        value={formData.type || ""}
                        onChange={handleChange}
                        options={["Feature", "Bug", "Spike"]}
                        placeholder="Select Type"
                      />
                    </label>
                  </div>

                  <div className="col-12 col-md-6">
                    <label className="form-label w-100">
                      <span>Apps to be deployed</span>
                      <div className="d-flex gap-2">
                        <div style={{ flex: 1 }}>
                          <SearchableSelect
                            name="appsToBeDeployedInput"
                            value={deployAppInput}
                            onChange={(e) => setDeployAppInput(e.target.value)}
                            options={availableDeployApps}
                            placeholder="Select App"
                          />
                        </div>
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

                      {deployAppsList.length > 0 && (
                        <div className="d-flex flex-wrap gap-2 mt-2">
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

                  <div className="col-12">
                    <label className="form-label w-100">
                      <span>Comments</span>
                      <textarea
                        name="comments"
                        value={formData.comments || ""}
                        onChange={handleChange}
                        rows="2"
                        className="form-input textarea-input"
                      ></textarea>
                    </label>
                  </div>
                </div>

                <div className="apps-section mt-4">
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
                        <li
                          key={index}
                          className="app-item flex-column flex-sm-row gap-2"
                        >
                          <div className="app-details flex-wrap">
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
              </form>
            </div>

            <div
              className="modal-footer px-4 py-3"
              style={{ borderTop: "1px solid #e2e8f0" }}
            >
              <button
                type="submit"
                form="storyForm"
                disabled={saving}
                className="btn-save primary"
              >
                {saving
                  ? "Saving..."
                  : initialData
                    ? "Save Changes"
                    : "Create Story"}
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* ================= NESTED APP MODAL ================= */}
      {isAppFormOpen && (
        <div
          className="modal show d-block"
          tabIndex="-1"
          style={{
            backgroundColor: "rgba(15, 23, 42, 0.75)",
            backdropFilter: "blur(4px)",
            zIndex: 1050,
          }}
        >
          <div
            className="modal-dialog modal-dialog-centered modal-dialog-scrollable"
            style={{ minWidth: "300px", maxWidth: "550px" }}
          >
            <div
              className="modal-content border-0"
              style={{ borderRadius: "25px" }}
            >
              <div
                className="modal-header px-4 pt-4 pb-3"
                style={{
                  borderBottom: "1px solid #e2e8f0",
                  display: "flex",
                  justifyContent: "space-between",
                }}
              >
                <h2 style={{ margin: 0, color: "#1e293b", fontWeight: "500" }}>
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
                  style={{ cursor: "pointer" }}
                />
              </div>

              <div className="modal-body px-4 pb-4">
                <div className="row g-3">
                  <div className="col-12">
                    <label className="form-label w-100">
                      <span>
                        Select App <span className="required-asterisk">*</span>
                      </span>
                      <SearchableSelect
                        name="appName"
                        value={appFormData.appName || ""}
                        onChange={handleAppChange}
                        options={availableApps}
                        placeholder="Select App"
                      />
                    </label>
                  </div>
                  <div className="col-12">
                    <label className="form-label w-100">
                      <span>Feature Branch</span>
                      <input
                        type="text"
                        name="featureBranches"
                        value={appFormData.featureBranches || ""}
                        onChange={handleAppChange}
                        className="form-input"
                      />
                    </label>
                  </div>
                  <div className="col-12">
                    <label className="form-label w-100">
                      <span>Base Branch</span>
                      <input
                        type="text"
                        name="baseBranch"
                        value={appFormData.baseBranch || ""}
                        onChange={handleAppChange}
                        className="form-input"
                      />
                    </label>
                  </div>
                  <div className="col-12">
                    <label className="form-label w-100">
                      <span>Dependencies</span>
                      <input
                        type="text"
                        name="dependencies"
                        value={appFormData.dependencies || ""}
                        onChange={handleAppChange}
                        className="form-input"
                      />
                    </label>
                  </div>
                  <div className="col-12">
                    <label className="form-label w-100">
                      <span>Notes</span>
                      <textarea
                        name="notes"
                        value={appFormData.notes || ""}
                        onChange={handleAppChange}
                        rows="2"
                        className="form-input textarea-input"
                      ></textarea>
                    </label>
                  </div>
                </div>
              </div>

              <div
                className="modal-footer px-4 py-3"
                style={{ borderTop: "1px solid #e2e8f0" }}
              >
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

export default StoryModal;