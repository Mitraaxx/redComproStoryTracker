import React from "react";
import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";
import { SignedIn, SignedOut, SignIn } from "@clerk/clerk-react"; 

import Navbar from "./Components/Navbar";
import SprintList from "./Components/Sprints/SprintList";
import SprintStories from "./Components/Sprints/SprintStories";
import StoryDetails from "./Components/Sprints/StoryDetails";
import StoryList from "./Components/Stories/StoryList";
import ReleaseList from "./Components/Release/ReleaseList";
import ReleaseStories from "./Components/Release/ReleaseStories";
import AppList from "./Components/App/AppList";
import AppStories from "./Components/App/AppStories";
import './Login.css'; 

const App = () => {
  return (
    <Router>
      <div>
        
        {/* ==========================================
                        SIGNED OUT VIEW 
            ========================================== */}
        <SignedOut>
          <div className="clerk-login-container">
            <SignIn 
              appearance={{
                elements: {
                  card: "clerk-card",
                  headerTitle: "clerk-header-title",
                  headerSubtitle: "clerk-header-subtitle",
                  formFieldInput: "clerk-form-input",
                  formFieldLabel: "clerk-form-label",
                  formButtonPrimary: "clerk-primary-btn",
                  footer: { display: "none" } 
                }
              }} 
            />
          </div>
        </SignedOut>

        {/* ==========================================
                        SIGNED IN VIEW 
            ========================================== */}
        <SignedIn>
          <Navbar />
          <div>
            <Routes>
              <Route path="/" element={<SprintList />} />
              <Route path="/sprints" element={<SprintList />} />

              <Route path="/sprints/:sprintId/stories" element={<SprintStories />} />
              <Route path="/sprints/:sprintId/stories/:storyId" element={<StoryDetails />} />

              <Route path="/stories" element={<StoryList />} />
              <Route path="/stories/:storyId" element={<StoryDetails />} />

              <Route path="/releases" element={<ReleaseList />}/>
              <Route path="/releases/:releaseId/stories" element={<ReleaseStories />}/>
              <Route path="/releases/:releaseId/stories/:storyId" element={<StoryDetails />} />

              <Route path="/apps" element={<AppList/>} /> 
              <Route path="/apps/:appName/stories" element={<AppStories/>} />
              <Route path="/apps/:appName/stories/:storyId" element={<StoryDetails />} />
              
              <Route path="*" element={<Navigate to="/" />} />
            </Routes>
          </div>
        </SignedIn>

      </div>
    </Router>
  );
};

export default App;