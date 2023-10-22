const express = require('express');
const router = express.Router();

// controllers
const adminController = require('../controllers/admin.controller')
const productController = require('../controllers/product.controller')
const orderController = require('../controllers/order.controller')
const couponController = require('../controllers/coupon.controller')

//middlewares
const adminAuth = require('../middlewares/adminAuth')
const adminSession = require('../middlewares/adminSession')
const validateImage = require('../middlewares/validateImage')


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

  // Chart
  router.post('/getData', adminSession, adminController.chartData);

  //usermangement
  router.get('/userMangement', adminSession, adminController.userManagement);

  //update blocked
  router.put('/update-block-status/:userId', adminSession, adminController.updateBlock)


  // Product  Controllers

  //category managemetn 
  router.get('/categoryManagement', adminSession, productController.categoryManagement)

  //add category
  router.post('/addCategory', adminSession, validateCategoryImage, productController.addCategory)

  //update category
  router.post('/updateCategory', adminSession, validateCategoryImage, productController.updateCategory)

  // deleteCategory image
  router.post('/removeCatImage', adminSession, productController.deleteCatImage)

  //Delete Category
  router.get('/deleteCategory/:id', adminSession, productController.deleteCategory)

  // product management
  router.get('/productManagement', adminSession, productController.productManagement)

  // Add product
  router.post('/addProduct', adminSession, validateProductImage, productController.addProduct)

  // Edit product PAGE
  router.get('/editProduct/:pid', adminSession, productController.editProductPage)

  // delete imgage
  router.post('/removeImage', adminSession, productController.removeImage)

  // Edit product 
  router.post('/editProduct', adminSession, validateProductImage, productController.editProduct)


  //delete Product
  router.get('/deleteProduct/:id', adminSession, productController.deleteProduct)

  //get subcategories
  router.get('/getSubcategory/:cId', productController.getSubcategory)

  // order Controllers

  // order management
  router.get('/orderManagement', adminSession, orderController.orderManagement)

  // order Page 
  router.get('/orderPage/:oId', adminSession, orderController.orderPage)

  // update status
  router.post('/updateStatus', adminSession, orderController.updateStatus)

  // coupon Controllers

  // coupon Management
  router.get('/couponManagement', adminSession, couponController.couponManagement)

  // add coupon 
  router.post('/addCoupon', adminSession, couponController.addCoupon)

  // edit coupon
  router.post('/editCoupon', adminSession, couponController.editCoupon)

  // delete coupon
  router.get('/deleteCoupon/:id', adminSession, couponController.deleteCoupon)

  // Report Mangement
  router.get('/report', adminSession, adminController.Report)

  //get pdf report
  router.get('/getPdf', adminSession, adminController.pdfReport)

  // get excel report
  router.get('/getExcel', adminSession, adminController.excelReport)

  //logout
  router.get('/logout', adminController.logout);

  module.exports = router;


} catch (error) {
  console.log(error);
}