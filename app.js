require('dotenv').config();
require('./auth')
const passport=require('passport')
const express = require('express');
const connectDB=require('./dbConnect')  
const session = require('express-session');
const path=require('path');
const nocache = require('nocache');
const app = express();
const port = 3000; 
app.set('view engine', 'ejs'); 
app.use(express.urlencoded({ extended: true }));
//setting the static pages path
app.use(express.static(path.join(__dirname,'/public')));
//routes  
const userRouter=require('./Routes/userRoutes') 
const adminRouter=require('./Routes/adminRoutes')
const authRouter = require('./Routes/authRoutes');
//keys 
// Initialize session
const skey=process.env.session; 
app.use(session({ 
    secret:skey, // Generate a random secret 
    resave: false,
    saveUninitialized: true, 
    cookie: {
        maxAge: 60 * 60 * 1000 // Set the cookie to expire in 1 hour
    }
}));

//database connection 
connectDB().then(()=>{
    console.log("DatBAse connected");
}).catch((err)=>{
    console.log(`Error in connection :${err}`);
})

//Disable caching 
app.use(nocache()); 

//initializing passport
app.use(passport.initialize())
app.use(passport.session())


//setting up the  Routes
app.use('/',userRouter)  
app.use('/',authRouter)  
app.use('/admin',adminRouter)

// 404 error page
app.use((req, res) => {
    res.status(404).send('404');
});
app.listen(port, () => {
    console.log(`Server started on http://localhost:${port}`);
});

