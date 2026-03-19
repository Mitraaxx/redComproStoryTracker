import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { MdAdd } from "react-icons/md";
import logo from "../assets/logo.png"
import './Navbar.css';

// This is changed

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

      <button className="add-button" onClick={() => navigate("/add-entry")}>
        <MdAdd /> Add Entry
      </button>
    </nav>
  );
};

export default Navbar;