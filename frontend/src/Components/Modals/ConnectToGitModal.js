import React, { useState, useEffect } from "react";
import { FaGithub, FaCheckCircle } from "react-icons/fa";
import { MdClose } from "react-icons/md";
import { clearGitHubCache } from "../../Api/api";
import "./ConnectToGitModal.css"; 

const ConnectToGitModal = ({ isOpen, onClose }) => {
  const [tokenInput, setTokenInput] = useState("");
  const [isConnected, setIsConnected] = useState(false);

  useEffect(() => {
    if (isOpen) {
      const existingToken = localStorage.getItem("github_pat");
      if (existingToken) {
        setIsConnected(true);
        setTokenInput(existingToken); 
      } else {
        setIsConnected(false);
        setTokenInput("");
      }
    }
  }, [isOpen]);

  const handleConnect = () => {
    if (!tokenInput.trim()) return;
    localStorage.setItem("github_pat", tokenInput.trim());
    setIsConnected(true);
    clearGitHubCache();
  };

  const handleDisconnect = () => {
    localStorage.removeItem("github_pat");
    setTokenInput("");
    setIsConnected(false);
    clearGitHubCache();
  };

  if (!isOpen) return null;

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
              alignItems: "center",
            }}
          >
          <h3 className="git-modal-title">
            <FaGithub size={24} /> GitHub Setup
          </h3>
          <button className="git-modal-close-btn" onClick={onClose}>
            <MdClose size={24} />
          </button>
        </div>

          <div className="modal-body px-4 pb-4">
          {isConnected ? (
            <div className="git-connected-container">
              <FaCheckCircle size={60} color="#16a34a" />
              <h3 className="git-connected-title">Connected!</h3>
              <p className="git-connected-text">
                You are successfully connected with GitHub.
              </p>
              <button
                onClick={handleDisconnect}
                className="git-disconnect-btn"
              >
                Disconnect GitHub
              </button>
            </div>
          ) : (
             <div className="git-setup-container">
              <p className="git-setup-text">
                Enter your GitHub <strong>Read-Only Personal Access Token</strong>       
              </p>
              <input
                type="password"
                placeholder="Enter Token"
                value={tokenInput}
                onChange={(e) => setTokenInput(e.target.value)}
                className="git-setup-input"
              />
              <button
                onClick={handleConnect}
                className="git-connect-btn"
              >
                Connect to GitHub
              </button>
            </div>
          )}
        </div>
      </div>
      </div>
    </div>
  );
};

export default ConnectToGitModal;