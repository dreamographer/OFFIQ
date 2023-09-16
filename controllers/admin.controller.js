const User = require('../models/user.models'); //user scheme
const Admin = require('../models/admin.models'); //admin schema

const adminController = {
  //Admin sign IN
  adminLogin: async (req, res) => {
    const { email, password } = req.body;//data given by the client
    try {
      let admins = await Admin.find()
      const admin = admins.find(admin => admin.email === email && admin.password === password);
      if (admin) {
        req.session.admin = admin; //setting value to the session
        console.log(admin.fullname + ' logged in');
        return res.redirect('/admin');
      } else {
        req.session.aderr = true;//for sending error message
        return res.redirect('/adminLogin');
      }
    } catch (err) {
      console.log(err);
      return res.status(500).send('Error fetching user data');
    }
  },


  //admin dashboard
  adminDashboard: async (req, res) => {
    try {
      const users = await User.find({}, { _id: 1, fullname: 1, email: 1 }); // Fetch user data
      res.render('admin', { users }); // Render the admin EJS template with users data
    } catch (err) {
      console.error(err);
      res.status(500).send('Error fetching user data');
    }
  },


  //logout for the admin
  logout: (req, res) => {
    if (req.session.admin) {
      console.log(`${req.session.admin.fullname} logged out`);
    } 
    req.session.destroy(); // Destroy session on logout
    res.redirect('/');
  },

  //login page with error message
  loginErr:(req,res)=>{
    if (req.session.admin) {
        res.redirect('/admin'); 
    } else if (req.session.aderr) {
        req.session.aderr=false;
        // Pass an error message to the login view
        res.render('adminlog', { errorMessage: 'Incorrect fullname or password' });
    }else{
        res.render('adminlog', { errorMessage: '' });
    }
  }

}

module.exports = adminController