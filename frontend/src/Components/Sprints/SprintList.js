import React, { useEffect, useState, useContext } from "react";
import { fetchAllSprints,createSprint, clearAllCaches } from "../../Api/api";
import { HashLoader } from "react-spinners";
import { useNavigate } from "react-router-dom";
import "../Sprints/SprintList.css";
import CreateSprintModal from "../Modals/CreateSprintModal";
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

const SprintList = () => {
  const [sprints, setSprints] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const navigate = useNavigate();

  const [isCreateSprintModalOpen, setCreateIsSprintModalOpen] = useState(false);
  const [newSprintData, setNewSprintData] = useState({ name: "", startDate: "", endDate: "", sprintNotes: "" });
  const [savingSprint, setSavingSprint] = useState(false);


  
    const openCreateSprintModal = () => {
      setNewSprintData({
        name: "",
        startDate: "",
        endDate: "",
        sprintNotes: "",
      });
      setCreateIsSprintModalOpen(true);
    };
  
    const handleSprintChange = (e) => {
      setNewSprintData({ ...newSprintData, [e.target.name]: e.target.value });
    };
  
    const handleSprintSave = async (e) => {
      e.preventDefault();
      setSavingSprint(true);
      try {
        await createSprint(newSprintData)
  
        setCreateIsSprintModalOpen(false);
        clearAllCaches();
        const data = await fetchAllSprints();
        setSprints(data);
        toast.success("Sprint updated successfully");
      } catch (error) {
        console.error("Sprint Save error:", error);
        toast.error("Sprint Name exists");
      } finally {
        setSavingSprint(false);
      }
    };

  useEffect(() => {
    const getSprints = async () => {
      try {
        setLoading(true);
        const data = await fetchAllSprints();
        setSprints(data);
      } catch (err) {
        console.log(err);
      } finally {
        setLoading(false);
      }
    };
    getSprints();
  }, []);

  if (loading) {
    return (
      <div
        style={{
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          height: "100vh",
        }}
      >
        <HashLoader color="#007bff" size={80} />
      </div>
    );
  }

  const handleSprintClick = (sprintId) => {
    navigate(`/sprints/${sprintId}/stories`);
  };

  const filtered =
    sprints?.filter((item) => {
      const search = searchTerm.toLowerCase();
      const sprintName = item.name?.toLowerCase() || "";
      return sprintName.includes(search);
    })
    .sort((a, b) => {
      const nameA = a.name || "";
      const nameB = b.name || "";
      return nameB.localeCompare(nameA, undefined, { numeric: true, sensitivity: 'base' });
    }) || [];

  return (
    <div className="sprint-container">
       <ToastContainer position="top-right" autoClose={3000} />
      <div className="sprint-container2">
        <h2 className="sprint-title">Sprint List</h2>
        <div className="sprint-search-header">
          <input
            type="text"
            className="sprint-search-input"
            placeholder="Search"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
          <button className="create-sprint-button" onClick={openCreateSprintModal}>Add Sprint</button>
        </div>
      </div>

      <div className="sprint-grid">
        {filtered.map((sprint) => (
          <div
            key={sprint._id}
            onClick={() => handleSprintClick(sprint._id)}
            className="sprint-card"
          >
            {sprint.name}
          </div>
        ))}
      </div>

      <CreateSprintModal
        isOpen={isCreateSprintModalOpen}
        onClose={() => setCreateIsSprintModalOpen(false)}
        formData={newSprintData}
        handleChange={handleSprintChange}
        handleSave={handleSprintSave}
        saving={savingSprint}
      />
    </div>
  );
};

export default SprintList;