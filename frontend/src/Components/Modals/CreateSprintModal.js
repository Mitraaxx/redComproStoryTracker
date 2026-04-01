import React from "react";
import { MdClose } from "react-icons/md";
import "../Modals/EditStoryModal.css";

/**
 * Modal component for creating a new sprint.
 * Captures sprint details like name, timeline (start/end dates), and custom notes.
 */
const CreateSprintModal = ({
  isOpen,
  onClose,
  formData,
  handleChange,
  handleSave,
  saving,
}) => {
  if (!isOpen) return null;

  /**
   * Prevents accidental form submission on Enter key press,
   * unless the user is actively typing inside a multi-line textarea.
   */
  const handleKeyDown = (e) => {
    if (e.key === "Enter" && e.target.tagName !== "TEXTAREA") {
      e.preventDefault();
    }
  };

  return (
    <div className="custom-modal-overlay">
      <div className="custom-modal-content" style={{ width: "500px" }}>
        <div className="custom-modal-header">
          <h2>Create New Sprint</h2>
          <MdClose size={28} className="close-icon" onClick={onClose} />
        </div>

        <form
          onSubmit={handleSave}
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
              required
              placeholder="Enter sprint name"
              className="form-input"
            />
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
              placeholder="Notes for this story.."
              className="form-input textarea-input"
            ></textarea>
          </label>

          <div className="custom-modal-actions">
            <button
              type="submit"
              disabled={saving}
              className="btn-save primary"
            >
              {saving ? "Creating..." : "Create Sprint"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default CreateSprintModal;
