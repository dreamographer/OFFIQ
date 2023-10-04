module.exports = function sessionMangement(req, res, next) {
    if (req.session.user ) {
        res.redirect('/');
    } else {
        next(); // User is authenticated, continue to the next middleware or route
    }
}
