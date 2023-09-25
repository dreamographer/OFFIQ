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

  // update the blocj status
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
  categoryManagement: async (req, res) => {
    try {
      const catagory = await Catagory.find({}); // Fetch fdata
      res.render('categoryManagement', { Catagory: catagory })
    }
    catch {

    }
  },


  //add new catergory
  addCategory: async (req, res) => {
    try {
      let data = req.body;

      const subName = data.subName
      const subDescription = data.subDescription
      let subcategory={}
      if (Array.isArray(subName)) {
        subcategory = subName.map((value, i) => {
          return { subName: value, subDescription: subDescription[i] }
        })
      }else{
        subcategory = { subName: subName, subDescription: subDescription }
      }
      data.subcategory = subcategory
      const imagePaths = req.file.path.substring(6);
      data.image = imagePaths;
      delete data.subDescription;
      delete data.subName;
      const category = await Catagory.create(data);
      if (category) {
        console.log('category added');
        return res.redirect('../admin/categoryManagement');
      }
    } catch (error) {
      console.log(error);
    }
  },

  // update the category
  updateCategory: async (req, res) => {
    try {
      const id = req.body.id
      const updatedData = { ...req.body }
      const subName = updatedData.subName
      const subDescription = updatedData.subDescription
      let subcategory = {}
      delete updatedData.subDescription;
      delete updatedData.subName;

      if (req.file) {    
        const imagePaths = req.file.path.substring(6);
        updatedData.image = imagePaths;
        console.log(imagePaths);
      }
      let result
      if (subName) {
        if (Array.isArray(subName)) {
          subcategory = subName.map((value, i) => {
            return { subName: value, subDescription: subDescription[i] }
          })
          result = await Catagory.findOneAndUpdate(
            { _id: id },
            {
              $push: { subcategory: { $each: subcategory } },
              $set: { ...updatedData },
            },
            {
              new: true, // To return the updated document
              upsert: true, // Create a new document if it doesn't exist
            }
          );
        } else {
          subcategory = { subName: subName, subDescription: subDescription }
          result = await Catagory.findOneAndUpdate(
            { _id: id },
            {
              $push: { subcategory: subcategory },
              $set: { ...updatedData },
            },
            {
              new: true, // To return the updated document
              upsert: true, // Create a new document if it doesn't exist
            }
          );
        }

      } else {
        result = await Catagory.findOneAndUpdate(
          { _id: id },
          {
            $set: { ...updatedData },
          },
          {
            new: true, // To return the updated document
            upsert: true, // Create a new document if it doesn't exist
          }
        );
      }
      if (!result) {
        return res.status(401).send("not found");
      } else {
        return res.status(200).redirect('../admin/productManagement')
      }
    } catch (err) { console.log(err) }

  },

  // productManagement
  productManagement: async (req, res) => {
    try {
      const products = await Products.find({}); // Fetch product data
      const category = await Catagory.find({});

      res.render('productManagement', { products: products, category: category })
    }
    catch {

    }
  },
  addProduct: async (req, res) => {
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