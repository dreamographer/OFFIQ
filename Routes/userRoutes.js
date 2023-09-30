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
//forgot password form
router.get('/forgot',sessionMangement,userController.forgotPage);
// send mail 
router.post('/forgotPassword',sessionMangement,userController.forgotPassword)
// update the password
router.post('/updatePassword',sessionMangement,userController.updatePassword);
//user login error
router.get('/login',sessionMangement,userController.loginErr) 
//render home page
router.get('/',userController.home);
//all Product page
router.get('/products/:id',userController.products)
//product view page
router.get('/productpage/:id',userController.productPage)
// cart
router.get('/cart',userAuth,userController.cart) 
// add to cart
router.post('/addToCart',userAuth,userController.addToCart)
//remove from the cart
router.get('/removeProduct/:id',userAuth,userController.removeProduct)
//update Cart
router.post('/updateCart',userAuth,userController.updateCart)
//checkout
router.get('/checkout',userAuth,userController.checkOut) 
//add address
router.post('/addAddress',userAuth ,userController.addAddress ) 
//Edit address
router.post('/editAddress',userAuth ,userController.editAddress )   //address Add
// order
router.post('/order',userAuth,userController.order)
// user profile
router.get('/myAccout',userAuth,userController.userProfile)
// cancel order
router.post('/cancelOrder',userAuth,userController.cancelOrder)
//logout
router.get('/logout', userController.logout);

module.exports=router;
