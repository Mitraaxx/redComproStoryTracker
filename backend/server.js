require('dotenv').config()
const express = require("express");
const cors = require("cors");
const {db} = require("./database/db");
const trackerRoutes = require("../backend/Routes/routes")
const app = express();

const PORT = process.env.PORT || 5000;

app.use(cors());
app.use(express.json()); 
app.use("/api", trackerRoutes); 

const server = () => {
    db()
    app.listen(PORT, ()=>{
        console.log('listening to port:', PORT)
    })
}

server()