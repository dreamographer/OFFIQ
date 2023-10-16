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
// home page search
router.post('/homeSearch',userController.homeSearch)
//all Product page
router.get('/allProducts/:pageNo',userController.allProducts)
// products Page
router.get('/products/:id',userController.products)
//Category Page
router.get('/category/:id',userController.category)
//serch product
router.post('/productSearch',userController.productSearch)
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
// applay promocode
router.post('/applyPromo',userAuth,userController.applyPromo)
// Generate Order
router.post('/genOrder',userAuth,userController.GenerateOrder)
//checkoutt
router.post('/checkout',userAuth,userController.checkOut) 
//add address
router.post('/addAddress',userAuth ,userController.addAddress ) 
//Edit address
router.post('/editAddress',userAuth ,userController.editAddress )  
// order
router.post('/order',userAuth,userController.order)
// user profile
router.get('/myAccout',userAuth,userController.userProfile)
// Order Page
router.get('/orderPage/:oId',userAuth,userController.orderPage)
// cancel order
router.post('/cancelOrder',userAuth,userController.cancelOrder)
//logout
router.get('/logout', userController.logout);

module.exports=router;
