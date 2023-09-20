require('dotenv').config();
//keys
const algorithm = 'aes-256-cbc';
const key = process.env.KEY;
const iv = process.env.IV;
const crypto = require('crypto');  //encription module
const User = require('../models/user.models'); //user scheme
const Admin = require('../models/admin.models'); //admin schema
const catagory = require('../models/categoryModel')
const { render } = require('ejs');


function decrypt(encryptedText, key) {
  const decipher = crypto.createDecipheriv(algorithm, key, iv);
  let decrypted = decipher.update(encryptedText, 'hex', 'utf8');
  decrypted += decipher.final('utf8');
  return decrypted;
}

const adminController = {
  //Admin sign IN
  adminLogin: async (req, res) => {
    const { email, password } = req.body;
    //data given by the client
    try {
      let admins = await Admin.find()
      const admin = admins.find(admin => admin.email === email && decrypt(admin.password, key) === password);
      if (admin) {
        req.session.admin = admin; //setting value to the session
        console.log(admin.fullname + ' logged in');
        return res.redirect('/admin');
      } else {
        req.session.aderr = true;//for sending error message
        return res.redirect('/admin');
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

  //user management
  userManagement: async (req, res) => {
    try {
      const users = await User.find({}, { _id: 1, fullname: 1, email: 1, phone: 1, blocked: 1 }); // Fetch fdata
      // Render the admin EJS template with users data
      res.render('userManagement', { userData: users })
    } catch (err) {
      console.error(err);
      res.status(500).send('Error fetching user data');
    }
  },

  updateBlock: async (req, res) => {
    const userId = req.params.userId;
    let { blocked } = req.body;
    blocked = JSON.parse(blocked);
    try {
      await User.updateOne({ _id: userId }, { blocked: !blocked });//updating the data
      res.json({ success: true, isBlocked: !blocked });

    } catch (error) {
      res.json({ success: false });

    }

  },

  //categoryManagement
  categoryManagement:  async (req, res) => {
    try {
      const Catagory = await catagory.find({}); // Fetch fdata
      res.render('categoryManagement',{ Catagory: Catagory })
    }
    catch{
      
    }
  },

  addCategory: async (req, res) => {
    try {
      const { name, description, subcategory } = req.body;

      // Create a new category document
      const newCategory = new category({
        name,
        description,
        subcategory,
      });

      // Save the category to the database
      const savedCategory = await newCategory.save();
     
      res.status(201).json(savedCategory); // Respond with the saved category data
    } catch (error) {
      res.status(500).json({ error: 'Error adding category' });
    }

  },

  // productManagement
  productManagement: async (req, res) => {
    try {
      const users = await User.find({}, { _id: 1, fullname: 1, email: 1, phone: 1, blocked: 1 }); // Fetch fdata
      res.render('productManagement',{ userData: users })
    }
    catch{
      
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

}

module.exports = adminController