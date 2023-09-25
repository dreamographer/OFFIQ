require('dotenv').config();
//keys
const algorithm = 'aes-256-cbc';
const key = process.env.ENCRIPTION_KEY;
const iv = 'initialisation-#';
const crypto = require('crypto');  //encription module

//modals
const User = require('../models/user.models'); //user scheme
const Admin = require('../models/admin.models'); //admin schema
const Catagory = require('../models/categoryModel') //category schema
const Products = require('../models/productModel'); //products schema




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
      const catagory = await Catagory.find({}); // Fetch fdata
      res.render('categoryManagement',{ Catagory: catagory })
    }
    catch{
      
    }
  },

  addCategory: async (req, res) => {
    try {
      let data = req.body;

      const subName=data.subName
      const subDescription=data.subDescription
      const subcategory= subName.map((value,i)=>{
        return {name : value , description : subDescription[i]}
      })
      console.log(subcategory);
      data.subcategory=subcategory
      const imagePaths = req.file.path.substring(6);
      data.image = imagePaths;
      delete data.subDescription;
      delete data.subName;
      console.log(data);
       
      // const product = await Products.create(data);
      // console.log(product);

      // if (product) {
      //   console.log('product added');
      //   return res.redirect('../admin/productManagement');
      // }
    } catch (error) {
      console.log(error);
    }
  },

  // productManagement
  productManagement: async (req, res) => {
    try {
      const products = await Products.find({}); // Fetch product data
      const category = await Catagory.find({});
    
      res.render('productManagement',{ products: products ,category:category})
    }
    catch{
      
    }
  },
  addProduct:async (req, res) => {
    try {
      const data = req.body;
      console.log(data);
      const imagePaths = req.files.map((file) => file.path.substring(6));
      data.images = imagePaths;
      const product = await Products.create(data);
      console.log(product);

      if (product) {
        console.log('product added');
        return res.redirect('../admin/productManagement');
      }
    } catch (error) {
      console.log(error);
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