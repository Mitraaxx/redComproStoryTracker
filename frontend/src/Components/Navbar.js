import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import logo from "../assets/logo.png"
import './Navbar.css';
import { UserButton } from "@clerk/clerk-react"; 

const Navbar = () => {
  const navigate = useNavigate();
  const location = useLocation();

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

  return (
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

      <div style={{ display: 'flex', alignItems: 'center', paddingRight: '15px' }}>
        {/* 👇 Yahan UserButton ko Navbar ki theme ke hisaab se style kiya hai */}
        <UserButton 
          afterSignOutUrl="/" 
          appearance={{
            variables: {
              colorPrimary: "#3b82f6", // Primary blue (active nav button wala)
              colorText: "#1e3a8a",    // Dark blue text
            },
            elements: {
              userButtonAvatarBox: {
                width: "35px",
                height: "35px",
                border: "2px solid #bfdbfe", // Avatar ke bahar light blue border
              },
              userButtonPopoverCard: {
                border: "1px solid #dbeafe", // Dropdown ka border
                boxShadow: "0 4px 12px rgba(59, 130, 246, 0.15)", // Soft blue shadow
              },
              userButtonPopoverActionButton: {
                "&:hover": {
                  backgroundColor: "#e0edff", // Hover karne pe pyara sa light blue
                }
              },
              userButtonPopoverActionButtonIcon: {
                color: "#3b82f6", // Icons ka color primary blue
              }
            }
          }}
        />
      </div>
    </nav>
  );
};

export default Navbar;