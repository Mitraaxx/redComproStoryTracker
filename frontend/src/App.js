import React from "react";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";

import Navbar from "./Components/Navbar";
import SprintList from "./Components/SprintList";
import SprintStories from "./Components/SprintStories";
import StoryDetails from "./Components/StoryDetails";
import StoryList from "./Components/StoryList";
import ReleaseList from "./Components/ReleaseList";
import ReleaseStories from "./Components/ReleaseStories";
import AppList from "./Components/AppList";
import AppStories from "./Components/AppStories";

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
