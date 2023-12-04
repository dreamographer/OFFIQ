const mongoose = require('mongoose');
// Connect to the MongoDB database
const url = process.env.DB_CONNECT
console.log("db url"+url);
module.exports = () => {
   return mongoose.connect(url);
}

