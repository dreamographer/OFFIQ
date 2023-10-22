module.exports = function adminAuth(req, res, next) {
  if (req.session.admin) {
    res.redirect('/admin/dashboard');
  } else if (req.session.aderr) {
    req.session.aderr = false
    // Pass an error message to the login view
    res.render('/admin/adminlog', { errorMessage: 'Incorrect email or password' });

  } else {
    res.render('/admin/adminlog', { errorMessage: '' });

  }
}
