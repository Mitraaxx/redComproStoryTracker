const mongoose = require('mongoose');

// This connects the backend server with the mongoDb database
const db = async () => {
    try {
        await mongoose.connect(process.env.MONGO_URL)
        console.log('Db Connected')
    } catch(error){
        console.log('Db connection Error:', error.message); 
    }
}

module.exports = {db}