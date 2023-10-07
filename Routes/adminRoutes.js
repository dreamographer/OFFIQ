const express = require('express');
const router = express.Router();
const adminController = require('../controllers/admin.controller')

//middlewares
const adminAuth = require('../middlewares/adminAuth')
const adminSession = require('../middlewares/adminSession')
const validateImage=require('../middlewares/validateImage')


router.use(express.urlencoded({ extended: true }));
router.use(express.json())

const validateCategoryImage = validateImage('categoryImage');
const validateProductImage = validateImage('productImage');

try {
  //admin login
  router.post('/login', adminController.adminLogin);
 
  //login  fot the admin
  router.get('/', adminAuth, adminController.adminDashboard);

  //dashboard of the admin
  router.get('/dashboard', adminSession, adminController.adminDashboard);

  //usermangement
  router.get('/userMangement', adminSession, adminController.userManagement);

  //update blocked
  router.put('/update-block-status/:userId', adminSession, adminController.updateBlock)

  //category managemetn 
  router.get('/categoryManagement', adminSession, adminController.categoryManagement)

  //add category
  router.post('/addCategory', adminSession,validateCategoryImage, adminController.addCategory)

  //update category
  router.post('/updateCategory', adminSession,validateCategoryImage, adminController.updateCategory)
  
  // deleteCategory image
  router.post('/removeCatImage', adminSession, adminController.deleteCatImage)

  //Delete Category
  router.get('/deleteCategory/:id', adminSession, adminController.deleteCategory)

  // product management
  router.get('/productManagement', adminSession, adminController.productManagement)

  // Add product
  router.post('/addProduct', adminSession, validateProductImage, adminController.addProduct)
 
  // Edit product PAGE
  router.get('/editProduct/:pid', adminSession,adminController.editProductPage)
  
  // delete imgage
  router.post('/removeImage', adminSession,adminController.removeImage)
  
  // Edit product
  router.post('/editProduct', adminSession, validateProductImage, adminController.editProduct)


  //delete Product
  router.get('/deleteProduct/:id', adminSession, adminController.deleteProduct)

  //get subcategories
  router.get('/getSubcategory/:cId', adminController.getSubcategory)

  // order management
  router.get('/orderManagement',adminSession,adminController.orderManagement)

  // order Page 
   router.get('/orderPage/:oId',adminSession,adminController.orderPage)

  // update status
  router.post('/updateStatus',adminSession, adminController.updateStatus)

  // coupon Management
  router.get('/couponManagement',adminSession,adminController.couponManagement)

  // add coupon 
  router.post('/addCoupon',adminSession,adminController.addCoupon)

  // edit coupon
  router.post('/editCoupon',adminSession,adminController.editCoupon)

  // delete coupon
  router.get('/deleteCoupon/:id',adminSession,adminController.deleteCoupon)

  //logout
  router.get('/logout', adminController.logout);

  module.exports = router;
} catch (error) {
  console.log(error);
}