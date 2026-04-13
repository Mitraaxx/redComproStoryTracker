// Configure module imports and exports for this file.
const mongoose = require('mongoose');
const db = async () => {
  // Run db logic for this execution path.
  try {
    await mongoose.connect(process.env.MONGO_URL);
    console.log('Db Connected');
  } catch (error) {
    console.log('Db connection Error:', error.message);
  }
};
module.exports = {
  db
};
