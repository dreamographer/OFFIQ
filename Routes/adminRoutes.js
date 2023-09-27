const express = require('express');
const router = express.Router();
const adminController = require('../controllers/admin.controller')

//middlewares
const adminAuth = require('../middlewares/adminAuth')
const adminSession=require('../middlewares/adminSession')

const path=require('path');
router.use(express.urlencoded({ extended: true }));
router.use(express.json())
//multer
const multer  = require('multer')
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, 'public/uploads/');
  },
  filename: (req, file, cb) => {
    cb(null, file.fieldname + '-' + Date.now() + path.extname(file.originalname));
  },
});

const upload = multer({ storage: storage });

try {
    //admin login
    router.post('/login', adminController.adminLogin);

    //login  fot the admin
    router.get('/', adminAuth, adminController.adminDashboard);

    //dashboard of the admin
    router.get('/dashboard',adminSession, adminController.adminDashboard);

    //usermangement
    router.get('/userMangement',adminSession,adminController.userManagement);

    //catagory managemetn 
    router.get('/categoryManagement',adminSession,adminController.categoryManagement)

    //add category
    router.post('/addCategory',adminSession,upload.single('categoryImage'),adminController.addCategory)

    //update categoru
    router.post('/updateCategory',adminSession,upload.single('categoryImage'),adminController.updateCategory) 

    //Delete Category
    router.get('/deleteCategory/:id',adminSession,adminController.deleteCategory) 

    // product management
    router.get('/productManagement',adminSession,adminController.productManagement)

    // Add product
    router.post('/addProduct',adminSession,upload.array('productImage'),adminController.addProduct)

    // Edit product
    router.post('/editProduct',adminSession,upload.array('productImage'),adminController.editProduct)

    //delete Product
    router.get('/deleteProduct/:id',adminSession,adminController.deleteProduct)

    //get subcategories
    router.get('/getSubcategory/:cId',adminController.getSubcategory)
    //update blocked
    
    router.put('/update-block-status/:userId',adminSession,adminController.updateBlock)

    //logout
    router.get('/logout', adminController.logout);

    module.exports = router;
} catch (error) {
    console.log(error);
}
