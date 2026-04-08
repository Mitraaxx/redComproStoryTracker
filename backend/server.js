require('dotenv').config()
const express = require("express");
const cors = require("cors");
const { clerkMiddleware, requireAuth } = require('@clerk/express'); 

const {db} = require("./database/db");
const trackerRoutes = require("../backend/Routes/routes")
const app = express();

const PORT = process.env.PORT || 5000;

const corsOptions = {
  origin: process.env.FRONTEND_URL, 
  methods: ["GET", "POST", "PUT", "DELETE"],
  credentials: true, 
  optionsSuccessStatus: 200 
};

app.use(cors(corsOptions));

app.use(express.json());; 

console.log("Clerk Key Check:", process.env.CLERK_PUBLISHABLE_KEY ? "Pass" : "Fail");

app.use(clerkMiddleware());

// RequireAuth() is allowing any api to pass without token
app.use("/api", requireAuth(), trackerRoutes); 

// Simple Ping Route to keep Render server awake (Ispe auth nahi lagaya taaki server awake reh sake)
app.get('/ping', (req, res) => {
  res.status(200).json({ status: 'ok', message: 'Server is awake and running!' });
});

const server = () => {
    db()
    app.listen(PORT, ()=>{
        console.log('listening to port:', PORT)
    })
}

server()