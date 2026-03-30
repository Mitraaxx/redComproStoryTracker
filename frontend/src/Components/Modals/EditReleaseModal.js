import React from "react";
import { MdClose } from "react-icons/md";
import "../Modals/EditStoryModal.css";

/**
 * Modal component designed for editing the details of an existing release tag.
 * Allows users to update the release name, date, and category.
 */
const EditReleaseModal = ({
  isOpen,
  onClose,
  releaseFormData,
  handleReleaseChange,
  handleReleaseSave,
  saving,
}) => {
  if (!isOpen) return null;

  /**
   * Prevents accidental form submission when the user presses the Enter key.
   */
  const handleKeyDown = (e) => {
    if (e.key === "Enter") e.preventDefault();
  };

  return (
    <div className="modal-overlay">
      <div className="modal-content" style={{ width: "450px" }}>
        <div className="modal-header">
          <h2>Edit Release Tag</h2>
          <MdClose size={28} className="close-icon" onClick={onClose} />
        </div>

        <form
          onSubmit={handleReleaseSave}
          onKeyDown={handleKeyDown}
          className="modal-form"
        >
          <label className="form-label full-width">
            <span>
              Release Tag Name <span className="required-asterisk">*</span>
            </span>
            <input
              type="text"
              name="name"
              value={releaseFormData.name || ""}
              onChange={handleReleaseChange}
              required
              className="form-input"
            />
          </label>

          <label className="form-label full-width">
            <span>Release Date</span>
            <input
              type="date"
              name="releaseDate"
              value={releaseFormData.releaseDate || ""}
              onChange={handleReleaseChange}
              className="form-input"
            />
          </label>

          <label className="form-label full-width">
            <span>Dev Cutoff Date</span>
            <input
              type="date"
              name="devCutoff"
              value={releaseFormData.devCutoff || ""}
              onChange={handleReleaseChange}
              className="form-input"
            />
          </label>

          <label className="form-label full-width">
            <span>QA Signoff Date</span>
            <input
              type="date"
              name="qaSignoff"
              value={releaseFormData.qaSignoff || ""}
              onChange={handleReleaseChange}
              className="form-input"
            />
          </label>

          <label className="form-label full-width">
            <span>Category</span>
            <select
              name="category"
              value={releaseFormData.category || ""}
              onChange={handleReleaseChange}
              className="form-input"
            >
              <option value="">-- Select Category --</option>
              <option value="Major">Major</option>
              <option value="Minor">Minor</option>
            </select>
          </label>

          <div className="modal-actions" style={{ marginTop: "20px" }}>
            <button
              type="submit"
              disabled={saving}
              className="btn-save primary"
            >
              {saving ? "Saving..." : "Save Changes"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default EditReleaseModal;
