const User = require('../models/user.models'); //user schema
module.exports = async function userAuth(req, res, next) {
    if (req.session.user && req.session.user.verified) {
        const id = req.session.user._id
        const user = await User.findOne({ _id: id }, { _id: 0, blocked: 1 });
        if (user.blocked) {
            req.session.user = null
            res.redirect('/login');
        } else {
            next(); // User is authenticated, continue to the next middleware or route
        }
    } else {
        res.redirect('/login');
    }
}


