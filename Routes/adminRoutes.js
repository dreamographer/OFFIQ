const express = require('express');
const router = express.Router();
const adminController=require('../controllers/admin.controller')
const adminAuth=require('../middlewares/adminAuth')

//admin login
router.post('/login', adminController.adminLogin);

//dashboard of the admin
router.get('/', adminAuth,adminController.adminDashboard );

//logout
router.get('/logout', adminController.logout);

//error in login
router.get('/login',adminController.loginErr);

module.exports=router;