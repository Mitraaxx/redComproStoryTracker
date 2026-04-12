// Modal flow summary:
// 1) Bootstrap story form state for create/edit mode when modal opens.
// 2) Manage two linked datasets: linked apps and deploy-app chips.
// 3) Validate required fields + duplicate story ID + edit-change detection.
// 4) Save story payload from the main form and app payload from nested app form.
// 5) Render parent story modal and conditional child app modal.
import { useState, useEffect } from "react";
import { MdClose, MdAdd, MdDelete, MdEdit } from "react-icons/md";
import "../Modals/EditStoryModal.css";
import "../Modals/CreateStoryHalfModal.css";
import {
  repoConfig,
  TEAM_MEMBERS,
  STATUS_MEMBERS,
} from "../../utils/AppConfig";
import SearchableSelect from "../Tools/SeachableSelect";
import useModalScrollLock from "../Common/UseModalScrollLock";

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
  existingStories = [],
}) => {
  // Main story form state.
  const [formData, setFormData] = useState({});

  // Linked app entries shown under "Linked Apps" section.
  const [appsList, setAppsList] = useState([]);

  // Snapshots used to calculate "has changes" in edit mode.
  const [originalFormData, setOriginalFormData] = useState({});
  const [originalAppsList, setOriginalAppsList] = useState([]);

  // App chips for "Apps to be deployed" multi-select.
  const [deployAppsList, setDeployAppsList] = useState([]);
  const [originalDeployAppsList, setOriginalDeployAppsList] = useState([]);
  const [deployAppInput, setDeployAppInput] = useState("");

  // Nested app details modal state.
  const [isAppFormOpen, setIsAppFormOpen] = useState(false);
  const [appFormData, setAppFormData] = useState({});
  const [editingAppIndex, setEditingAppIndex] = useState(null);

  // Prevent background page scroll while modal is open.
  useModalScrollLock(isOpen);

  // Initialize all form buckets when modal opens or source data changes.
  useEffect(() => {
    if (isOpen) {
      if (initialData) {
        // Convert date values into YYYY-MM-DD expected by date inputs.
        const formatDate = (dateString) =>
          dateString ? new Date(dateString).toISOString().split("T")[0] : "";

        // Edit mode: preload existing story fields.
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

        // Edit mode: normalize linked apps into local app-form shape.
        let formattedApps = [];
        if (initialData.linkedApps && initialData.linkedApps.length > 0) {
          formattedApps = initialData.linkedApps.map((app) => ({
            appName: app.appName || "",
            featureBranch: app.featureBranch || "",
            baseBranch: app.baseBranch || "",
            dependencies: app.dependencies || "",
            notes: app.notes || "",
          }));
        }

        // Support string or array backend values and normalize to array.
        const initialDeployApps = Array.isArray(initialData.appsToBeDeployed)
          ? initialData.appsToBeDeployed
          : initialData.appsToBeDeployed
            ? [initialData.appsToBeDeployed]
            : [];

        setFormData(formattedData);
        setOriginalFormData(formattedData);
        setAppsList(formattedApps);
        setOriginalAppsList(formattedApps);
        setDeployAppsList(initialDeployApps);
        setOriginalDeployAppsList(initialDeployApps);
      } else {
        // Create mode: start from clean defaults.
        const resetData = {
          status: "",
          sprintName: initialSprintName || "",
          storyId: "",
          storyName: "",
        };
        setFormData(resetData);
        setOriginalFormData(resetData);
        setAppsList([]);
        setOriginalAppsList([]);
        setDeployAppsList([]);
        setOriginalDeployAppsList([]);
      }

      // Reset transient app-chip input and nested-modal edit pointer on each open.
      setDeployAppInput("");
      setEditingAppIndex(null);
    }
  }, [isOpen, initialData, initialSprintName]);

  // Do not mount modal tree while closed.
  if (!isOpen) return null;

  // Shared field updater for story form controls.
  const handleChange = (e) =>
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });

  // Prevent accidental submit when Enter is pressed in regular inputs.
  const handleKeyDown = (e) => {
    if (
      e.key === "Enter" &&
      e.target.tagName !== "TEXTAREA" &&
      e.target.name !== "appsToBeDeployedInput"
    )
      e.preventDefault();
  };

  // Add selected deploy app once, then clear selector field.
  const addDeployApp = () => {
    if (
      deployAppInput.trim() &&
      !deployAppsList.includes(deployAppInput.trim())
    ) {
      setDeployAppsList([...deployAppsList, deployAppInput.trim()]);
    }
    setDeployAppInput("");
  };

  // Remove one deploy app chip by index.
  const removeDeployApp = (indexToRemove) =>
    setDeployAppsList(deployAppsList.filter((_, i) => i !== indexToRemove));

  // Required-field and duplicate-ID checks.
  const currentStoryId = (formData.storyId || "").trim();
  const currentStoryName = (formData.storyName || "").trim();
  const isIdEmpty = currentStoryId === "";
  const isNameEmpty = currentStoryName === "";
  const isDuplicateId = existingStories.some(
    (s) =>
      s.storyId.toLowerCase() === currentStoryId.toLowerCase() &&
      s.storyId.toLowerCase() !== (initialData?.storyId || "").toLowerCase(),
  );

  // Compare all editable buckets to decide if edit mode has meaningful changes.
  const isStoryChanged = Object.keys(formData).some(
    (key) => formData[key] !== originalFormData[key],
  );
  const isAppsChanged =
    JSON.stringify(appsList) !== JSON.stringify(originalAppsList);
  const isDeployAppsChanged =
    JSON.stringify(deployAppsList) !== JSON.stringify(originalDeployAppsList);
  const hasChanges = isStoryChanged || isAppsChanged || isDeployAppsChanged;

  // Disable save while pending, invalid, duplicate, or unchanged in edit mode.
  const isBtnDisabled =
    saving ||
    isIdEmpty ||
    isNameEmpty ||
    isDuplicateId ||
    (initialData && !hasChanges);

  // Submit main story form: resolve sprint, clean app rows, then dispatch create/edit payload.
  const submitMainForm = (e) => {
    e.preventDefault();
    if (isBtnDisabled) return;

    // Use fixed sprintId when sprint field is hidden, otherwise resolve by sprint name.
    let finalSprintId = sprintId;
    if (
      !hideSprintField &&
      formData.sprintName &&
      formData.sprintName.trim() !== ""
    ) {
      const matchedSprint = sprintsList.find(
        (s) => s.name === formData.sprintName.trim(),
      );
      if (!matchedSprint)
        return alert(
          "Sprint not found! Please select a valid sprint from the list.",
        );
      finalSprintId = matchedSprint._id;
    } else if (
      !hideSprintField &&
      (!formData.sprintName || formData.sprintName.trim() === "")
    ) {
      finalSprintId = null;
    }

    // Keep only valid linked app rows and trim text fields before submit.
    const cleanedAppsData = appsList
      .filter((app) => app.appName && app.appName.trim() !== "")
      .map((app) => ({
        appName: app.appName.trim(),
        featureBranch: app.featureBranch ? app.featureBranch.trim() : "",
        baseBranch: app.baseBranch ? app.baseBranch.trim() : "",
        dependencies: app.dependencies ? app.dependencies.trim() : "",
        notes: app.notes ? app.notes.trim() : "",
      }));

    if (initialData) {
      // Edit mode: include only changed story fields.
      const changedStoryFields = {};
      Object.keys(formData).forEach((key) => {
        if (formData[key] !== originalFormData[key]) {
          changedStoryFields[key] =
            typeof formData[key] === "string"
              ? formData[key].trim()
              : formData[key];
        }
      });

      // Attach deploy apps only when this section changed.
      if (isDeployAppsChanged)
        changedStoryFields.appsToBeDeployed = deployAppsList;

      // Convert sprint-name change into sprint id update expected by backend.
      if (
        !hideSprintField &&
        formData.sprintName !== originalFormData.sprintName
      ) {
        changedStoryFields.sprint = finalSprintId;
      }

      handleSave({
        isEditMode: true,
        isStoryChanged: Object.keys(changedStoryFields).length > 0,
        changedStoryFields,
        isAppsChanged,
        linkedApps: cleanedAppsData,
        fullFormDataForState: {
          ...formData,
          sprintId: finalSprintId,
          appsToBeDeployed: deployAppsList,
        },
      });
    } else {
      // Create mode: submit full story payload.
      handleSave({
        isEditMode: false,
        ...formData,
        sprint: finalSprintId,
        linkedApps: cleanedAppsData,
        appsToBeDeployed: deployAppsList,
      });
    }
  };

  // Open nested app modal in "add" mode with blank app form.
  const openAppForm = () => {
    setAppFormData({
      appName: "",
      featureBranch: "",
      baseBranch: "",
      dependencies: "",
      notes: "",
    });
    setEditingAppIndex(null);
    setIsAppFormOpen(true);
  };

  // Open nested app modal in "edit" mode for selected index.
  const editApp = (index) => {
    setAppFormData(appsList[index]);
    setEditingAppIndex(index);
    setIsAppFormOpen(true);
  };

  // Shared updater for nested app form controls.
  const handleAppChange = (e) =>
    setAppFormData({
      ...appFormData,
      [e.target.name]: e.target.value,
    });

  // Save app row into list (replace when editing, append when adding).
  const saveAppToList = () => {
    if (!appFormData.appName) return alert("Please select an App Name!");
    if (editingAppIndex !== null) {
      const updatedList = [...appsList];
      updatedList[editingAppIndex] = appFormData;
      setAppsList(updatedList);
    } else setAppsList([...appsList, appFormData]);
    setIsAppFormOpen(false);
    setEditingAppIndex(null);
  };

  // Remove linked app row.
  const removeApp = (index) => {
    const newList = [...appsList];
    newList.splice(index, 1);
    setAppsList(newList);
  };

  // Available app choices for nested modal (avoid duplicates unless editing same app).
  const availableApps = Object.keys(repoConfig).filter((appName) => {
    const isAlreadyAdded = appsList?.some((a) => a.appName === appName);
    const isCurrentlyEditing =
      editingAppIndex !== null &&
      appsList[editingAppIndex]?.appName === appName;
    return !isAlreadyAdded || isCurrentlyEditing;
  });

  // Helper lists and flags used for button-disable logic.
  const isAllAppsAdded = appsList.length >= Object.keys(repoConfig).length;
  const availableDeployApps = Object.keys(repoConfig).filter(
    (appName) => !deployAppsList.includes(appName),
  );

  // When editing an app, disable save if no values changed.
  let isAppUnchanged = false;
  if (editingAppIndex !== null) {
    const originalApp = appsList[editingAppIndex];
    isAppUnchanged =
      appFormData.appName === originalApp.appName &&
      (appFormData.featureBranch || "") === (originalApp.featureBranch || "") &&
      (appFormData.baseBranch || "") === (originalApp.baseBranch || "") &&
      (appFormData.dependencies || "") === (originalApp.dependencies || "") &&
      (appFormData.notes || "") === (originalApp.notes || "");
  }

  // App modal save requires required fields and meaningful changes.
  const isAppBtnDisabled =
    !appFormData.appName?.trim() ||
    !appFormData.featureBranch?.trim() ||
    !appFormData.baseBranch?.trim() ||
    (isAllAppsAdded && editingAppIndex === null) ||
    isAppUnchanged;

  return (
    <>
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
            maxWidth: "800px",
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
              }}
            >
              <h2
                style={{
                  margin: 0,
                  color: "#1e293b",
                  fontWeight: "500",
                }}
              >
                {initialData ? "Edit Story & Apps" : "Create New Story"}
              </h2>
              <MdClose
                size={28}
                className="close-icon"
                onClick={onClose}
                style={{
                  cursor: "pointer",
                }}
              />
            </div>

            <div className="modal-body px-4 pb-4">
              {/* Main story form section. */}
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
                        className="form-input"
                      />
                      {isDuplicateId && (
                        <span
                          style={{
                            color: "#ef4444",
                            fontSize: "0.8rem",
                            marginTop: "4px",
                          }}
                        >
                          Story ID already exists!
                        </span>
                      )}
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
                      {/* Select + add pattern for deploy-app chips. */}
                      <div className="d-flex gap-2">
                        <div
                          style={{
                            flex: 1,
                          }}
                        >
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
                      {/* Display removable chips for currently selected deploy apps. */}
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
                              {app}{" "}
                              <MdClose
                                size={14}
                                style={{
                                  cursor: "pointer",
                                }}
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

                {/* Linked-app list and open-add-app action. */}
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
                              Branch: {app.featureBranch || "N/A"}
                            </span>
                          </div>
                          <div className="app-actions">
                            <MdEdit
                              size={22}
                              className="edit-icon"
                              onClick={() => editApp(index)}
                            />
                            <MdDelete
                              size={22}
                              className="delete-icon"
                              onClick={() => removeApp(index)}
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
              style={{
                borderTop: "1px solid #e2e8f0",
              }}
            >
              {/* Main create/edit submit button for story form. */}
              <button
                type="submit"
                form="storyForm"
                disabled={isBtnDisabled}
                className="btn-save primary"
              >
                {saving
                  ? initialData
                    ? "Saving..."
                    : "Creating..."
                  : initialData
                    ? "Save Changes"
                    : "Create Story"}
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Nested modal for adding/editing one linked app entry. */}
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
            style={{
              minWidth: "300px",
              maxWidth: "550px",
            }}
          >
            <div
              className="modal-content border-0"
              style={{
                borderRadius: "25px",
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
                <h2
                  style={{
                    margin: 0,
                    color: "#1e293b",
                    fontWeight: "500",
                  }}
                >
                  {editingAppIndex !== null
                    ? "Edit App Details"
                    : "Add App Details"}
                </h2>
                <MdClose
                  size={28}
                  className="close-icon"
                  onClick={() => {
                    // Closing nested app modal also clears current edit pointer.
                    setIsAppFormOpen(false);
                    setEditingAppIndex(null);
                  }}
                  style={{
                    cursor: "pointer",
                  }}
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
                      <span>
                        Feature Branch{" "}
                        <span className="required-asterisk">*</span>
                      </span>
                      <input
                        type="text"
                        name="featureBranch"
                        value={appFormData.featureBranch || ""}
                        onChange={handleAppChange}
                        className="form-input"
                      />
                    </label>
                  </div>
                  <div className="col-12">
                    <label className="form-label w-100">
                      <span>
                        Base Branch <span className="required-asterisk">*</span>
                      </span>
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
                style={{
                  borderTop: "1px solid #e2e8f0",
                }}
              >
                {/* Save one app row into linked-app list. */}
                <button
                  type="button"
                  onClick={saveAppToList}
                  disabled={isAppBtnDisabled}
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
