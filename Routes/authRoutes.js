const express = require('express');
const router = express.Router();
const passport = require('passport')
// Google Auth
router.get('/auth/google',
    passport.authenticate('google', { scope: ['profile', 'email'] }));

router.get('/auth/google/callback',
    passport.authenticate('google', {
        failureRedirect: '/login'
    }),
    function (req, res) {
        const user=req.user
        req.session.user = user
        console.log(user.fullname + ' logged in');
        // Successful authentication, redirect home.
        res.redirect('/');
    });

module.exports = router;    