import React, { useState, useEffect } from "react";
import { MdClose } from "react-icons/md";
import "../Modals/EditStoryModal.css";

/**
 * Universal Modal for BOTH Creating and Editing a Release Tag.
 * Switches to "Edit Mode" if `initialData` is provided.
 */
const ReleaseModal = ({
  isOpen,
  onClose,
  handleSave, 
  saving,
  initialData = null, 
}) => {
  const [formData, setFormData] = useState({
    name: "",
    releaseDate: "",
    devCutoff: "",
    qaSignoff: "",
    category: "",
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
          releaseDate: formatDate(initialData.releaseDate),
          devCutoff: formatDate(initialData.devCutoff),
          qaSignoff: formatDate(initialData.qaSignoff),
          category: initialData.category || "",
        };

        setFormData(editData);
        setOriginalFormData(editData);
      } else {
        // --- CREATE MODE ---
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
        console.log("No release changes detected. Skipping API call.");
        onClose();
        return;
      }
    }

    handleSave(formData);
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
        style={{ maxWidth: "600px" }}
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
              {initialData ? "Edit Release Tag" : "Create Release Tag"}
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
              id="releaseForm"
              onSubmit={submitForm}
              onKeyDown={handleKeyDown}
              className="custom-modal-form"
              style={{
                overflowY: "auto",
                padding: "5px",
                margin: 0,
                display: "flex",
                flexDirection: "column",
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
            </form>
          </div>

          <div
            className="modal-footer px-4 py-3"
            style={{ borderTop: "1px solid #e2e8f0" }}
          >
            <button
              type="submit"
              disabled={saving}
              className="btn-save primary"
              form="releaseForm"
              style={{ padding: "8px 16px", width: "100%" }}
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