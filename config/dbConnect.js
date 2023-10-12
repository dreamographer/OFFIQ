const mongoose=require('mongoose');
// Connect to the MongoDB database
const url=process.env.DB_CONNECT
module.exports=()=>{
   return mongoose.connect(url); 
}

