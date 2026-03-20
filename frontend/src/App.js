import React from "react";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";

import Navbar from "./Components/Navbar";
import SprintList from "./Components/Sprints/SprintList";
import SprintStories from "./Components/Sprints/SprintStories";
import StoryDetails from "./Components/Sprints/StoryDetails";
import StoryList from "./Components/Stories/StoryList";
import ReleaseList from "./Components/Release/ReleaseList";
import ReleaseStories from "./Components/Release/ReleaseStories";
import AppList from "./Components/App/AppList";
import AppStories from "./Components/App/AppStories";



const App = () => {
  return (
    <Router>
      <div>
        <Navbar />
        <div>
          <Routes>
            <Route path="/" element={<SprintList />} />
            <Route path="/sprints" element={<SprintList />} />

            <Route
              path="/sprints/:sprintId/stories"
              element={<SprintStories />}
            />
            <Route
              path="/sprints/:sprintId/stories/:storyId"
              element={<StoryDetails />}
            />

            <Route path="/stories" element={<StoryList />} />
            <Route path="/stories/:storyId" element={<StoryDetails />} />

            <Route path="/releases" element={<ReleaseList/>}/>
            <Route path="/releases/:releaseId/stories" element={<ReleaseStories />}/>
            <Route path="/releases/:releaseId/stories/:storyId" element={<StoryDetails />} />

            <Route path="/apps" element={<AppList/>} /> 
            <Route path="/apps/:appName/stories" element={<AppStories/>} />
            <Route path="/apps/:appName/stories/:storyId" element={<StoryDetails />} />
          </Routes>
        </div>
      </div>
    </Router>
  );
};

export default App;
