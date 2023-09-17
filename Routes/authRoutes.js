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
        // Successful authentication, redirect home.
        res.redirect('/success');
    });

router.get('/success', (req, res) => {

    let count=1
    res.send("hey there")
})

module.exports = router;