// Root application shell.
// Flow:
// 1) Wrap app in Router.
// 2) If user is signed out, show Clerk SignIn screen.
// 3) If user is signed in, show Navbar + protected app routes.
// 4) Keep one global ToastContainer for notifications across pages.
import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";
import { SignedIn, SignedOut, SignIn } from "@clerk/clerk-react";
import { ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
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
  // Route map for all feature areas: Sprints, Stories, Releases, and Apps.
  // Unknown paths are redirected to the default dashboard route.
  return <Router>
      <div>
        {/* Signed-out experience: render only the Clerk login card. */}
        <SignedOut>
          <div className="clerk-login-container">
            <SignIn appearance={{
            elements: {
              card: "clerk-card",
              headerTitle: "clerk-header-title",
              headerSubtitle: "clerk-header-subtitle",
              formFieldInput: "clerk-form-input",
              formFieldLabel: "clerk-form-label",
              formButtonPrimary: "clerk-primary-btn",
              footer: {
                display: "none"
              }
            }
          }} />
          </div>
        </SignedOut>

        {/* Signed-in experience: full application navigation + routes. */}
        <SignedIn>
          <Navbar />
          <div>
            <Routes>
              {/* Sprint module */}
              <Route path="/" element={<SprintList />} />
              <Route path="/sprints" element={<SprintList />} />

              <Route path="/sprints/:sprintId/stories" element={<SprintStories />} />
              <Route path="/sprints/:sprintId/stories/:storyId" element={<StoryDetails />} />

              {/* Story module */}
              <Route path="/stories" element={<StoryList />} />
              <Route path="/stories/:storyId" element={<StoryDetails />} />

              {/* Release module */}
              <Route path="/releases" element={<ReleaseList />} />
              <Route path="/releases/:releaseId/stories" element={<ReleaseStories />} />
              <Route path="/releases/:releaseId/stories/:storyId" element={<StoryDetails />} />

              {/* App module */}
              <Route path="/apps" element={<AppList />} /> 
              <Route path="/apps/:appName/stories" element={<AppStories />} />
              <Route path="/apps/:appName/stories/:storyId" element={<StoryDetails />} />
              
              {/* Safety fallback for unmatched URLs. */}
              <Route path="*" element={<Navigate to="/" />} />
            </Routes>
          </div>
          {/* Global toaster host for success/error messages from any page. */}
          <ToastContainer position="top-right" autoClose={3000} />
        </SignedIn>
      </div>
    </Router>;
};
export default App;
