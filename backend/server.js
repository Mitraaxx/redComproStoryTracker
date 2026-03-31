require('dotenv').config()
const express = require("express");
const cors = require("cors");
const { clerkMiddleware } = require('@clerk/express');

const {db} = require("./database/db");
const trackerRoutes = require("../backend/Routes/routes")
const app = express();

const PORT = process.env.PORT || 5000;

app.use(cors());
app.use(express.json()); 

console.log("Clerk Key Check:", process.env.CLERK_PUBLISHABLE_KEY ? "Pass" : "Fail");

app.use(clerkMiddleware());

app.use("/api", trackerRoutes); 

// Simple Ping Route to keep Render server awake
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