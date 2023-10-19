const express = require('express');
const router = express.Router();
const userController = require('../controllers/user.controller');
const orderController = require('../controllers/order.controller');
const cartController = require('../controllers/cart.controller');
const productController = require('../controllers/product.controller');
const userAuth = require('../middlewares/userAuth');
const sessionMangement=require('../middlewares/session')

// ROUtes for user Controlls
//User sign IN
router.post('/login', sessionMangement,userController.userLogin); 
//user signUP
router.get('/signup', sessionMangement,userController.signUp);
//user signUP
router.post('/signup',sessionMangement, userController.userSignup);
//verify email
router.post('/verify',sessionMangement,userController.emailVerify);
//resend product
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
//add address
router.post('/addAddress',userAuth ,userController.addAddress ) 
//Edit address
router.post('/editAddress',userAuth ,userController.editAddress )  
// user profile
router.get('/myAccout',userAuth,userController.userProfile)


// Routes for the product Controlls

//all Product page
router.get('/allProducts/:pageNo',productController.allProducts)
// add filteter
router.post('/filter',productController.filterResult)
// products Page
router.get('/products/:id',productController.products)
//Category Page
router.get('/category/:id',productController.category)
//serch product
router.post('/productSearch',productController.productSearch)
//product view page
router.get('/productpage/:id',productController.productPage)


// Routes for the Cart Controlls
// cart
router.get('/cart',userAuth,cartController.cart) 
// add to cart
router.post('/addToCart',userAuth,cartController.addToCart)
//remove from the cart
router.get('/removeProduct/:id',userAuth,cartController.removeProduct)
//update Cart
router.post('/updateCart',userAuth,cartController.updateCart)
// applay promocode
router.post('/applyPromo',userAuth,cartController.applyPromo)
// Generate Order
router.post('/genOrder',userAuth,orderController.GenerateOrder)
//checkoutt
router.post('/checkout',userAuth,orderController.checkOut) 


// Routes for order Controlls
// order
router.post('/order',userAuth,orderController.order)
// Order Page
router.get('/orderPage/:oId',userAuth,orderController.orderPage)
// cancel order
router.post('/cancelOrder',userAuth,orderController.cancelOrder)
//logout
router.get('/logout', userController.logout);


module.exports=router;
