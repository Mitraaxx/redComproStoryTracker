// Modal flow summary:
// 1) Initialize/create or preload/edit release form data when modal opens.
// 2) Track original values to detect real edits in update mode.
// 3) Validate name (required + unique) and disable save when invalid/unchanged.
// 4) Submit either changed fields (edit) or full payload (create).
import { useState, useEffect } from "react";
import { MdClose } from "react-icons/md";
import "../Modals/EditStoryModal.css";
import useModalScrollLock from "../../Components/Common/UseModalScrollLock";

const ReleaseModal = ({
  isOpen,
  onClose,
  handleSave,
  saving,
  initialData = null,
  existingReleases = [],
}) => {
  // Current editable form state.
  const [formData, setFormData] = useState({
    name: "",
    releaseDate: "",
    devCutoff: "",
    qaSignoff: "",
    category: "",
  });

  // Snapshot of initial values for has-changed comparison in edit mode.
  const [originalFormData, setOriginalFormData] = useState({});

  // Prevent background scroll when modal is visible.
  useModalScrollLock(isOpen);

  // Whenever modal opens (or edit source changes), prepare form state.
  useEffect(() => {
    if (isOpen) {
      if (initialData) {
        // Convert backend date values into input[type=date] format: YYYY-MM-DD.
        const formatDate = (date) =>
          date && !isNaN(new Date(date).getTime())
            ? new Date(date).toISOString().split("T")[0]
            : "";

        // Edit mode starts with existing values.
        const editData = {
          name: initialData.name || "",
          releaseDate: formatDate(initialData.releaseDate),
          devCutoff: formatDate(initialData.devCutoff),
          qaSignoff: formatDate(initialData.qaSignoff),
          category: initialData.category || "",
        };
        setFormData(editData);
        setOriginalFormData(editData);
      } else {
        // Create mode starts with empty defaults.
        const createData = {
          name: "",
          releaseDate: "",
          devCutoff: "",
          qaSignoff: "",
          category: "",
        };
        setFormData(createData);
        setOriginalFormData(createData);
      }
    }
  }, [isOpen, initialData]);

  // Render nothing when closed.
  if (!isOpen) return null;

  // Generic controlled-input handler.
  const handleChange = (e) =>
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });

  // Block accidental form submission when pressing Enter in non-textarea fields.
  const handleKeyDown = (e) => {
    if (e.key === "Enter" && e.target.tagName !== "TEXTAREA")
      e.preventDefault();
  };

  // Normalize and validate name before enabling save.
  const currentName = (formData.name || "").trim();
  const isNameEmpty = currentName === "";
  const isDuplicateName = existingReleases.some(
    (r) =>
      r.name.toLowerCase() === currentName.toLowerCase() &&
      r.name.toLowerCase() !== (initialData?.name || "").toLowerCase(),
  );

  // Detect whether any field actually changed in edit mode.
  const hasChanges = Object.keys(formData).some(
    (key) => formData[key] !== originalFormData[key],
  );

  // Disable save when request is in progress, data is invalid, or nothing changed in edit mode.
  const isBtnDisabled =
    saving || isNameEmpty || isDuplicateName || (initialData && !hasChanges);

  // Submit handler dispatches either update payload or create payload.
  const submitForm = (e) => {
    e.preventDefault();
    if (isBtnDisabled) return;

    if (initialData) {
      // Send only modified fields when editing.
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
      // Send full form payload when creating.
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
            }}
          >
            <h2
              style={{
                margin: 0,
                color: "#1e293b",
                fontWeight: "500",
              }}
            >
              {initialData ? "Edit Release Tag" : "Create Release Tag"}
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
              id="releaseForm"
              onSubmit={submitForm}
              onKeyDown={handleKeyDown}
              className="custom-modal-form"
            >
              <label className="form-label full-width">
                <span>
                  Release Tag Name <span className="required-asterisk">*</span>
                </span>
                <input
                  type="text"
                  name="name"
                  value={formData.name || ""}
                  onChange={handleChange}
                  className="form-input"
                  placeholder="Enter release tag"
                />
                {isDuplicateName && (
                  <span
                    style={{
                      color: "#ef4444",
                      fontSize: "0.8rem",
                      marginTop: "4px",
                    }}
                  >
                    Release Tag already exists!
                  </span>
                )}
              </label>
              <label className="form-label full-width">
                <span>Release Date</span>
                <input
                  type="date"
                  name="releaseDate"
                  value={formData.releaseDate || ""}
                  onChange={handleChange}
                  className="form-input"
                />
              </label>
              <label className="form-label full-width">
                <span>Dev Cutoff Date</span>
                <input
                  type="date"
                  name="devCutoff"
                  value={formData.devCutoff || ""}
                  onChange={handleChange}
                  className="form-input"
                />
              </label>
              <label className="form-label full-width">
                <span>QA Signoff Date</span>
                <input
                  type="date"
                  name="qaSignoff"
                  value={formData.qaSignoff || ""}
                  onChange={handleChange}
                  className="form-input"
                />
              </label>
              <label className="form-label full-width">
                <span>Category</span>
                <select
                  name="category"
                  value={formData.category || ""}
                  onChange={handleChange}
                  className="form-input"
                >
                  <option value="">-- Select Category --</option>
                  <option value="Major">Major</option>
                  <option value="Minor">Minor</option>
                </select>
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
              form="releaseForm"
            >
              {saving
                ? initialData
                  ? "Saving..."
                  : "Creating..."
                : initialData
                  ? "Save Changes"
                  : "Create Release"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ReleaseModal;
