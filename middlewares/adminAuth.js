module.exports=function adminAuth(req, res, next) {
    if (req.session.admin) {
      next(); // User is authenticated, continue to the next middleware or route
    } else {
      res.render('adminlog', { errorMessage: '' });
    }
  }