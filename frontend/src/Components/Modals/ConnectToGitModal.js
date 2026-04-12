// Connect to GitHub modal.
//
// Complete flow:
// 1) On open, read token from localStorage.
// 2) If token exists, show connected state.
// 3) Allow connect (save token) or disconnect (remove token).
// 4) Clear GitHub status cache so app re-fetches branch statuses.
import { useState, useEffect } from "react";
import { FaGithub, FaCheckCircle } from "react-icons/fa";
import { MdClose } from "react-icons/md";
import { clearAllCaches } from "../../Api/api";
import "./ConnectToGitModal.css";
import useModalScrollLock from "../../Components/Common/useModalScrollLock";

const ConnectToGitModal = ({ isOpen, onClose }) => {
  // ------------------------------
  // View State
  // ------------------------------
  // Token input control.
  const [tokenInput, setTokenInput] = useState("");

  // Connection mode toggle for UI branch.
  const [isConnected, setIsConnected] = useState(false);

  // Prevent background page scroll while modal is open.
  useModalScrollLock(isOpen);

  // Sync modal state from localStorage token whenever modal opens.
  useEffect(() => {
    if (isOpen) {
      // Read persisted PAT from browser storage.
      const existingToken = localStorage.getItem("github_pat");
      if (existingToken) {
        // Show connected view and prefill token field.
        setIsConnected(true);
        setTokenInput(existingToken);
      } else {
        // Show setup view with empty input.
        setIsConnected(false);
        setTokenInput("");
      }
    }
  }, [isOpen]);

  // Saves token and switches UI to connected state.
  const handleConnect = () => {
    // Guard empty token.
    if (!tokenInput.trim()) return;

    // Persist token for future sessions.
    localStorage.setItem("github_pat", tokenInput.trim());

    // Flip UI state and invalidate cached API responses.
    setIsConnected(true);
    clearAllCaches();
  };

  // Removes token and switches UI to setup state.
  const handleDisconnect = () => {
    localStorage.removeItem("github_pat");
    setTokenInput("");
    setIsConnected(false);
    clearAllCaches();
  };

  // Do not mount modal markup while closed.
  if (!isOpen) return null;

  // ------------------------------
  // Render
  // ------------------------------
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
            {/* Connected view: success state + disconnect action. */}
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
                {/* Setup view: token input + connect action. */}
                <p className="git-setup-text">
                  Enter your GitHub{" "}
                  <strong>Read-Only Personal Access Token</strong>
                </p>
                <input
                  type="password"
                  placeholder="Enter Token"
                  value={tokenInput}
                  onChange={(e) => setTokenInput(e.target.value)}
                  className="git-setup-input"
                />
                <button onClick={handleConnect} className="git-connect-btn">
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
