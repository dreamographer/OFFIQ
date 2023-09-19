module.exports = function sessionMangement(req, res, next) {
    if (req.session.admin) {
        // User is authenticated, continue to the next middleware or route
        next();
    } else {
        res.redirect('/admin');
        
    }
}
