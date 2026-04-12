// Component flow summary:
// 1) Build tab metadata and resolve active tab from current route.
// 2) Track GitHub token connection state.
// 3) Manage mobile nav collapse state across toggle and route changes.
// 4) Render navigation + profile controls and GitHub connect modal.
import { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import logo from "../assets/logo.png";
import "./Navbar.css";
import { UserButton } from "@clerk/clerk-react";
import { FaGithub } from "react-icons/fa";
import ConnectToGitModal from "./Modals/ConnectToGitModal";

const Navbar = () => {
  // Router helpers for tab navigation and route-aware UI state.
  const navigate = useNavigate();
  const location = useLocation();

  // Modal + status flags for GitHub PAT connection button.
  const [isGitModalOpen, setIsGitModalOpen] = useState(false);
  const [isGitConnected, setIsGitConnected] = useState(false);

  // Mobile navbar collapse state for Bootstrap responsive menu.
  const [isNavCollapsed, setIsNavCollapsed] = useState(true);

  // Primary navigation tabs.
  const tabs = [
    {
      name: "Sprint",
      path: "/sprints",
    },
    {
      name: "Story",
      path: "/stories",
    },
    {
      name: "App",
      path: "/apps",
    },
    {
      name: "Release",
      path: "/releases",
    },
  ];

  // Resolve active styling: / maps to Sprint and nested routes keep parent active.
  const isActive = (path) => {
    if (
      path === "/sprints" &&
      (location.pathname === "/" || location.pathname.startsWith("/sprints"))
    ) {
      return true;
    }
    return location.pathname.startsWith(path);
  };

  // Refresh Git connection state whenever config modal is opened/closed.
  useEffect(() => {
    setIsGitConnected(!!localStorage.getItem("github_pat"));
  }, [isGitModalOpen]);

  // Auto-collapse mobile menu after route change.
  useEffect(() => {
    setIsNavCollapsed(true);
  }, [location.pathname]);

  return (
    <>
      <nav className="navbar navbar-expand-lg custom-navbar-bg">
        <div className="container-fluid">
          {/* Brand logo navigates back to default landing route. */}
          <a
            className="navbar-brand nav-logo m-0 p-0 py-2"
            style={{
              cursor: "pointer",
              textDecoration: "none",
              color: "inherit",
            }}
            onClick={() => navigate("/")}
          >
            <img src={logo} alt="logo" />
          </a>

          {/* Mobile hamburger toggles collapsed nav content. */}
          <button
            className="navbar-toggler custom-toggler"
            type="button"
            onClick={() => setIsNavCollapsed(!isNavCollapsed)}
            aria-expanded={!isNavCollapsed}
            aria-label="Toggle navigation"
          >
            <span className="navbar-toggler-icon"></span>
          </button>

          <div
            className={`collapse navbar-collapse  ${!isNavCollapsed ? "show" : ""}`}
          >
            {/* Center tab group. */}
            <div className="navbar-nav mx-auto d-flex flex-lg-row flex-column align-items-center gap-2 mt-3 mt-lg-0">
              {tabs.map((tab) => (
                <button
                  key={tab.name}
                  onClick={() => navigate(tab.path)}
                  className={`nav-button ${isActive(tab.path) ? "active" : ""}`}
                >
                  {tab.name}
                </button>
              ))}
            </div>

            {/* Right controls: Git connect CTA + Clerk user profile menu. */}
            <div className="d-flex flex-lg-row flex-column align-items-center gap-3 mt-3 mt-lg-0 pb-3 pb-lg-0">
              <button
                className={`git-connect-nav-btn ${isGitConnected ? "connected" : ""}`}
                onClick={() => setIsGitModalOpen(true)}
                title="Configure GitHub Token"
              >
                <FaGithub size={18} />
                <span className="git-nav-text">
                  {isGitConnected ? "Connected" : "Connect GitHub"}
                </span>
              </button>

              <UserButton
                afterSignOutUrl="/"
                appearance={{
                  variables: {
                    colorPrimary: "#3b82f6",
                    colorText: "#1e3a8a",
                  },
                  elements: {
                    userButtonAvatarBox: {
                      width: "35px",
                      height: "35px",
                      border: "2px solid #bfdbfe",
                    },
                    userButtonPopoverCard: {
                      border: "1px solid #dbeafe",
                      boxShadow: "0 4px 12px rgba(59, 130, 246, 0.15)",
                    },
                    userButtonPopoverActionButton: {
                      "&:hover": {
                        backgroundColor: "#e0edff",
                      },
                    },
                    userButtonPopoverActionButtonIcon: {
                      color: "#3b82f6",
                    },
                  },
                }}
              />
            </div>
          </div>
        </div>
      </nav>

      {/* Token configuration modal opened from navbar action button. */}
      <ConnectToGitModal
        isOpen={isGitModalOpen}
        onClose={() => setIsGitModalOpen(false)}
      />
    </>
  );
};

export default Navbar;
