// Frontend bootstrap entry point.
// Flow:
// 1) Load global CSS dependencies.
// 2) Validate required Clerk publishable key from environment.
// 3) Mount React root and wrap app with ClerkProvider for auth context.
import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App";
import 'bootstrap/dist/css/bootstrap.min.css';
import "./index.css";
import { ClerkProvider } from '@clerk/clerk-react';
const PUBLISHABLE_KEY = process.env.REACT_APP_CLERK_PUBLISHABLE_KEY;

// Fail fast at startup so missing auth config is obvious in development/deployments.
if (!PUBLISHABLE_KEY) {
  throw new Error("Missing Publishable Key");
}
const root = ReactDOM.createRoot(document.getElementById("root"));

// StrictMode helps surface unsafe patterns during development.
// ClerkProvider makes authentication/session utilities available app-wide.
root.render(<React.StrictMode>
    <ClerkProvider publishableKey={PUBLISHABLE_KEY}>
      <App />
    </ClerkProvider>
  </React.StrictMode>);
