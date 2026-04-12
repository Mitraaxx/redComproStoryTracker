require('dotenv').config();
const express = require("express");
const cors = require("cors");
const {
  clerkMiddleware,
  requireAuth
} = require('@clerk/express');
const {
  db
} = require("./database/Db");


// Central router that contains all protected API endpoints.
const trackerRoutes = require("./Routes/Routes");

// Create Express application instance.
const app = express();

// Resolve runtime port from env, fallback to local default.
const PORT = process.env.PORT || 5000;

// CORS policy allows frontend origin and credentials (cookies/auth headers).
const corsOptions = {
  origin: process.env.FRONTEND_URL,
  methods: ["GET", "POST", "PUT", "DELETE"],
  credentials: true,
  optionsSuccessStatus: 200
};

// Register middleware in request processing order.
// 1) CORS negotiation
app.use(cors(corsOptions));
// 2) Parse JSON request bodies
app.use(express.json());

// Quick startup visibility to verify Clerk config is present.
console.log("Clerk Key Check:", process.env.CLERK_PUBLISHABLE_KEY ? "Pass" : "Fail");

// Attach Clerk auth context to every request before protected routes run.
app.use(clerkMiddleware());

// Protect all /api routes so only authenticated requests can access them.
app.use("/api", requireAuth(), trackerRoutes);

// Public health endpoint used for uptime/keep-alive checks.
app.get('/ping', (req, res) => {
  res.status(200).json({
    status: 'ok',
    message: 'Server is awake and running!'
  });
});

// Boot sequence: connect DB first, then start HTTP listener.
const server = () => {
  db();
  app.listen(PORT, () => {
    console.log('listening to port:', PORT);
  });
};

// Start application.
server();
