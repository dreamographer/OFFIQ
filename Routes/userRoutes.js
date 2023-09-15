const express = require('express');
const router = express.Router();
const userController = require('../controllers/user.controller');
const userAuth = require('../middlewares/userAuth');
//User sign IN
router.post('/login', userController.userLogin);
//user signUP
router.post('/signup', userController.userSignup);
//user login error
router.get('/login',userController.loginErr) 
//render home page
router.get('/',userAuth,userController.home);
//logout
router.get('/logout', userController.logout);
module.exports=router;
