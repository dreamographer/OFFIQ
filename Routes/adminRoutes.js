const express = require('express');
const router = express.Router();
const adminController = require('../controllers/admin.controller')
const adminAuth = require('../middlewares/adminAuth')
const adminSession=require('../middlewares/adminSession')
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

    // product management
    router.get('/productManagement',adminSession,adminController.productManagement)

    //update blocked
    router.put('/update-block-status/:userId',adminSession,adminController.updateBlock)

    //logout
    router.get('/logout', adminController.logout);

    module.exports = router;
} catch (error) {
    console.log(error);
}
