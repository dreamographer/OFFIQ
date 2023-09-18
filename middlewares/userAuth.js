module.exports=function userAuth(req, res, next) {
    if (req.session.user && req.session.user.verified) {
        next(); // User is authenticated, continue to the next middleware or route
    } else {
        // res.render('signup')
        res.render('login', { errorMessage: '' });
    }
}


