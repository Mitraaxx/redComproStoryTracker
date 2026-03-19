import React from "react";
import { MdClose } from "react-icons/md";
import "../Modals/EditStoryModal.css";

const EditSprintModal = ({
  isOpen,
  onClose,
  sprintFormData,
  handleSprintChange,
  handleSprintSave,
  saving,
}) => {
  if (!isOpen) return null;

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && e.target.tagName !== 'TEXTAREA') {
      e.preventDefault();
    }
  };

  return (
    <div className="modal-overlay">
      <div className="modal-content" style={{ width: '500px' }}>
        <div className="modal-header">
          <h2>Edit Sprint Details</h2>
          <MdClose size={28} className="close-icon" onClick={onClose} />
        </div>

        <form onSubmit={handleSprintSave} onKeyDown={handleKeyDown} className="modal-form">
          <label className="form-label full-width">
            Sprint Name
            <input 
              type="text" 
              name="name" 
              value={sprintFormData.name || ''} 
              onChange={handleSprintChange} 
              required 
              className="form-input" 
            />
          </label>

          <div className="form-grid">
            <label className="form-label">
              Start Date
              <input 
                type="date" 
                name="startDate" 
                value={sprintFormData.startDate || ''} 
                onChange={handleSprintChange} 
                className="form-input" 
              />
            </label>

            <label className="form-label">
              End Date
              <input 
                type="date" 
                name="endDate" 
                value={sprintFormData.endDate || ''} 
                onChange={handleSprintChange} 
                className="form-input" 
              />
            </label>
          </div>

          <label className="form-label full-width">
            Sprint Notes
            <textarea 
              name="sprintNotes" 
              value={sprintFormData.sprintNotes || ''} 
              onChange={handleSprintChange} 
              rows="4" 
              className="form-input textarea-input"
            ></textarea>
          </label>

          <div className="modal-actions">
            <button type="submit" disabled={saving} className="btn-save primary">
              {saving ? "Saving..." : "Save Changes"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default EditSprintModal;