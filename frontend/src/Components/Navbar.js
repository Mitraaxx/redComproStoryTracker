import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import logo from "../assets/logo.png"
import './Navbar.css';
import { UserButton } from "@clerk/clerk-react"; 
import { FaGithub } from "react-icons/fa"; 
import ConnectToGitModal from './Modals/ConnectToGitModal';

const Navbar = () => {
  const navigate = useNavigate();
  const location = useLocation();

  const [isGitModalOpen, setIsGitModalOpen] = useState(false);
  const [isGitConnected, setIsGitConnected] = useState(false);

  const tabs = [
    { name: 'Sprint', path: '/sprints' },
    { name: 'Story', path: '/stories' },
    { name: 'App', path: '/apps' },
    { name: 'Release', path: '/releases' }
  ];

  const isActive = (path) => {
    if (path === '/sprints' && (location.pathname === '/' || location.pathname.startsWith('/sprints'))) {
      return true;
    }
    return location.pathname.startsWith(path);
  };

  useEffect(() => {
    setIsGitConnected(!!localStorage.getItem("github_pat"));
  }, [isGitModalOpen]);

  return (
    <>
      <nav className="navbar">
        <div className="nav-logo">
          <img src={logo} alt="logo" />
        </div>

        <div className="nav-tabs">
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

        <div className='nav-left-container'>
          <button 
            className={`git-connect-nav-btn ${isGitConnected ? 'connected' : ''}`}
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
              variables: { colorPrimary: "#3b82f6", colorText: "#1e3a8a" },
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
                  "&:hover": { backgroundColor: "#e0edff" }
                },
                userButtonPopoverActionButtonIcon: { color: "#3b82f6" }
              }
            }}
          />
        </div>
      </nav>

      <ConnectToGitModal 
        isOpen={isGitModalOpen} 
        onClose={() => setIsGitModalOpen(false)} 
      />
    </>
  );
};

export default Navbar;