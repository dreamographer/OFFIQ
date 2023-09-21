const express = require('express');
const router = express.Router();
const userController = require('../controllers/user.controller');
const userAuth = require('../middlewares/userAuth');
const sessionMangement=require('../middlewares/session')
//User sign IN
router.post('/login', sessionMangement,userController.userLogin); 
//user signUP
router.get('/signup', sessionMangement,userController.signUp);
//user signUP
router.post('/signup',sessionMangement, userController.userSignup);
//verify email
router.post('/verify',sessionMangement,userController.emailVerify);
//resend mail
router.get('/resend',sessionMangement,userController.resend);
//resend mail
router.get('/forgot',sessionMangement,userController.forgotPassword);



//user login error
router.get('/login',sessionMangement,userController.loginErr) 
//render home page
router.get('/',userAuth,userController.home);



//all Product page
router.get('/products',userController.products)

//product view page
router.get('/productpage/:id',userController.productPage)


//logout
router.get('/logout', userController.logout);

module.exports=router;
