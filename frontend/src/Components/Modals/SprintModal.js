// Modal flow summary:
// 1) Initialize/create or preload/edit sprint form data when modal opens.
// 2) Keep original values for edit-mode change detection.
// 3) Validate sprint name (required + unique) and disable save when invalid.
// 4) Submit either changed fields (edit) or complete payload (create).
import { useState, useEffect } from "react";
import { MdClose } from "react-icons/md";
import "../Modals/EditStoryModal.css";
import useModalScrollLock from "../../Components/Common/useModalScrollLock";

const SprintModal = ({
  isOpen,
  onClose,
  handleSave,
  saving,
  initialData = null,
  existingSprints = [],
}) => {
  // Current editable sprint form state.
  const [formData, setFormData] = useState({
    name: "",
    startDate: "",
    endDate: "",
    sprintNotes: "",
  });

  // Snapshot of values loaded at modal-open time for change detection.
  const [originalFormData, setOriginalFormData] = useState({});

  // Lock background scrolling while modal is open.
  useModalScrollLock(isOpen);

  // Prepare form state whenever the modal opens or the source record changes.
  useEffect(() => {
    if (isOpen) {
      if (initialData) {
        // Normalize date values to YYYY-MM-DD for date inputs.
        const formatDate = (date) =>
          date && !isNaN(new Date(date).getTime())
            ? new Date(date).toISOString().split("T")[0]
            : "";

        // Edit mode: preload current sprint values.
        const editData = {
          name: initialData.name || "",
          startDate: formatDate(initialData.startDate),
          endDate: formatDate(initialData.endDate),
          sprintNotes: initialData.sprintNotes || "",
        };
        setFormData(editData);
        setOriginalFormData(editData);
      } else {
        // Create mode: reset to empty defaults.
        const createData = {
          name: "",
          startDate: "",
          endDate: "",
          sprintNotes: "",
        };
        setFormData(createData);
        setOriginalFormData(createData);
      }
    }
  }, [isOpen, initialData]);

  // Return null when modal is closed.
  if (!isOpen) return null;

  // Shared controlled-input updater.
  const handleChange = (e) =>
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });

  // Prevent Enter key from submitting early unless user is in textarea.
  const handleKeyDown = (e) => {
    if (e.key === "Enter" && e.target.tagName !== "TEXTAREA")
      e.preventDefault();
  };

  // Name validation values used by duplicate and disabled checks.
  const currentName = (formData.name || "").trim();
  const isNameEmpty = currentName === "";
  const isDuplicateName = existingSprints.some(
    (s) =>
      s.name.toLowerCase() === currentName.toLowerCase() &&
      s.name.toLowerCase() !== (initialData?.name || "").toLowerCase(),
  );

  // Determine whether the user changed anything in edit mode.
  const hasChanges = Object.keys(formData).some(
    (key) => formData[key] !== originalFormData[key],
  );

  // Disable save while pending, invalid, or unchanged in edit mode.
  const isBtnDisabled =
    saving || isNameEmpty || isDuplicateName || (initialData && !hasChanges);

  // Build submit payload based on create/edit mode.
  const submitForm = (e) => {
    e.preventDefault();
    if (isBtnDisabled) return;

    if (initialData) {
      // Send only changed values when editing an existing sprint.
      const changedFields = {};
      Object.keys(formData).forEach((key) => {
        if (formData[key] !== originalFormData[key])
          changedFields[key] = formData[key];
      });

      handleSave({
        isEditMode: true,
        changedFields,
      });
    } else {
      // Send full payload when creating a sprint.
      handleSave({
        isEditMode: false,
        ...formData,
      });
    }
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
        style={{
          maxWidth: "500px",
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
              {initialData ? "Edit Sprint Details" : "Create New Sprint"}
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
            <form
              id="sprintForm"
              onSubmit={submitForm}
              onKeyDown={handleKeyDown}
              className="custom-modal-form"
            >
              <label className="form-label full-width">
                <span>
                  Sprint Name <span className="required-asterisk">*</span>
                </span>
                <input
                  type="text"
                  name="name"
                  value={formData.name || ""}
                  onChange={handleChange}
                  placeholder="Enter sprint name"
                  className="form-input"
                />
                {isDuplicateName && (
                  <span
                    style={{
                      color: "#ef4444",
                      fontSize: "0.8rem",
                      marginTop: "4px",
                    }}
                  >
                    Sprint Name already exists!
                  </span>
                )}
              </label>
              <div className="form-grid">
                <label className="form-label">
                  Start Date
                  <input
                    type="date"
                    name="startDate"
                    value={formData.startDate || ""}
                    onChange={handleChange}
                    className="form-input"
                  />
                </label>
                <label className="form-label">
                  End Date
                  <input
                    type="date"
                    name="endDate"
                    value={formData.endDate || ""}
                    onChange={handleChange}
                    className="form-input"
                  />
                </label>
              </div>
              <label className="form-label full-width">
                Sprint Notes
                <textarea
                  name="sprintNotes"
                  value={formData.sprintNotes || ""}
                  onChange={handleChange}
                  rows="4"
                  placeholder="Notes for this sprint.."
                  className="form-input textarea-input"
                ></textarea>
              </label>
            </form>
          </div>
          <div
            className="modal-footer px-4 py-3"
            style={{
              borderTop: "1px solid #e2e8f0",
            }}
          >
            <button
              type="submit"
              disabled={isBtnDisabled}
              className="btn-save primary"
              form="sprintForm"
            >
              {saving
                ? initialData
                  ? "Saving..."
                  : "Creating..."
                : initialData
                  ? "Save Changes"
                  : "Create Sprint"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SprintModal;
