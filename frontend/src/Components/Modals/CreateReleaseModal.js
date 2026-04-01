import React from "react";
import { MdClose } from "react-icons/md";
import "../Modals/EditStoryModal.css";

/**
 * Modal component designed to handle the creation of a new release tag.
 * Captures the release name, date, and category.
 */
const CreateReleaseModal = ({
  isOpen,
  onClose,
  formData,
  handleChange,
  handleSave,
  saving,
}) => {
  if (!isOpen) return null;

  /**
   * Prevents accidental form submission when the Enter key is pressed.
   */
  const handleKeyDown = (e) => {
    if (e.key === "Enter") e.preventDefault();
  };

  return (
    <div className="custom-modal-overlay">
      <div 
        className="custom-modal-content" 
        style={{ 
          width: "600px", 
          padding: 0, 
          maxHeight: "85vh", 
          display: "flex", 
          flexDirection: "column",
          overflow: "hidden" 
        }}
      >
        <div 
          className="custom-modal-header" 
          style={{ 
            padding: "20px 20px 15px 20px", 
            margin: 0, 
            borderBottom: "1px solid #e2e8f0", 
            backgroundColor: "#fff", 
            zIndex: 10 
          }}
        >
          <h2>Create Release Tag</h2>
          <MdClose size={24} className="close-icon" onClick={onClose} style={{ cursor: "pointer" }} />
        </div>

        <form
          onSubmit={handleSave}
          onKeyDown={handleKeyDown}
          className="custom-modal-form"
          style={{ 
            overflowY: "auto", 
            padding: "20px", 
            margin: 0,
            display: "flex",
            flexDirection: "column"
          }}
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
              required
              className="form-input"
            />
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

          <div className="custom-modal-actions" style={{ marginTop: "10px" }}>
            <button
              type="submit"
              disabled={saving}
              className="btn-save primary"
              style={{ padding: "8px 16px", width: "100%" }}
            >
              {saving ? "Creating..." : "Create Release"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default CreateReleaseModal;