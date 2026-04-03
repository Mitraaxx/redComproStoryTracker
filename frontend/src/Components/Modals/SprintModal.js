import React, { useState, useEffect } from "react";
import { MdClose } from "react-icons/md";
import "../Modals/EditStoryModal.css";

/**
 * Universal Modal for BOTH Creating and Editing a Sprint.
 * Switches to "Edit Mode" if `initialData` is provided.
 */
const SprintModal = ({
  isOpen,
  onClose,
  handleSave, 
  saving,
  initialData = null, 
}) => {
  const [formData, setFormData] = useState({
    name: "",
    startDate: "",
    endDate: "",
    sprintNotes: "",
  });

  const [originalFormData, setOriginalFormData] = useState({});

  useEffect(() => {
    if (isOpen) {
      if (initialData) {
        // --- EDIT MODE ---
        const formatDate = (dateString) => {
          if (!dateString) return "";
          const date = new Date(dateString);
          if (isNaN(date.getTime())) return ""; 
          return date.toISOString().split("T")[0];
        };

        const editData = {
          name: initialData.name || "",
          startDate: formatDate(initialData.startDate),
          endDate: formatDate(initialData.endDate),
          sprintNotes: initialData.sprintNotes || "",
        };

        setFormData(editData);
        setOriginalFormData(editData);
      } else {
        // --- CREATE MODE ---
        const createData = { name: "", startDate: "", endDate: "", sprintNotes: "" };
        setFormData(createData);
        setOriginalFormData(createData);
      }
    }
  }, [isOpen, initialData]);

  if (!isOpen) return null;

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleKeyDown = (e) => {
    if (e.key === "Enter" && e.target.tagName !== "TEXTAREA") {
      e.preventDefault();
    }
  };

  const submitForm = (e) => {
    e.preventDefault();

    if (initialData) {
      const isUnchanged = JSON.stringify(formData) === JSON.stringify(originalFormData);
      if (isUnchanged) {
        console.log("No sprint changes detected. Skipping API call.");
        onClose();
        return;
      }
    }

    // Sending updated data to parent
    handleSave(formData);
  };

  return (
    <div 
      className="modal show d-block" 
      tabIndex="-1" 
      style={{ backgroundColor: "rgba(15, 23, 42, 0.6)", backdropFilter: "blur(4px)", zIndex: 1040 }}
    >
      <div className="modal-dialog modal-dialog-centered modal-dialog-scrollable modal-lg" style={{ maxWidth: "500px" }}>
        
        <div className="modal-content border-0" style={{ borderRadius: "25px", boxShadow: "0 20px 25px -5px rgba(0,0,0,0.1)" }}>

          <div className="modal-header px-4 pt-4 pb-3" style={{ borderBottom: "1px solid #e2e8f0", display:"flex", justifyContent:"space-between" }}>
            <h2 style={{ margin: 0, color: "#1e293b", fontWeight: "500" }}>
              {initialData ? "Edit Sprint Details" : "Create New Sprint"}
            </h2>
            <MdClose size={28} className="close-icon" onClick={onClose} style={{ cursor: "pointer" }} />
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
                  placeholder="Notes for this sprint.."
                  className="form-input textarea-input"
                ></textarea>
              </label>
            </form>
          </div>

          <div className="modal-footer px-4 py-3" style={{ borderTop: "1px solid #e2e8f0" }}>
            <button
              type="submit"
              disabled={saving}
              className="btn-save primary"
              form="sprintForm"
            >
              {saving 
                ? (initialData ? "Saving..." : "Creating...") 
                : (initialData ? "Save Changes" : "Create Sprint")}
            </button>
          </div>

        </div>
      </div>
    </div>
  );
};

export default SprintModal;