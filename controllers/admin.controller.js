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
const Order = require('../models/order.model'); //order schema

//decrypt
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
    try {
      const userId = req.params.userId;
      let { blocked } = req.body;
      blocked = JSON.parse(blocked);

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
      if (req.session.err) {
        err=req.session.err
        req.session.err=null
      }else{
        err=''
      }
      return res.render('categoryManagement', { Catagory: catagory, errorMessage: err })
    }
    catch (error) {
      console.log(error);
    }
  },


  //add new catergory
  addCategory: async (req, res) => {
    try {
      let data = req.body;
      let subName = data.subName
      let subDescription = data.subDescription
      const name = data.name.toUpperCase()
      const categories = await Catagory.find({});//fetching the data from the db
      const existingCategory = categories.filter((item) => {
        return item.name.toUpperCase() == name//checkign if the categoryu already exists in the db
      })

      if (existingCategory.length > 0) {
        // Category with the same name already exists
        return res.render('categoryManagement', { Catagory: categories, errorMessage: 'Category with this name already exists.' })

      }
      let subcategory = {}
      //checking if there is one subcategory or many 
      if (Array.isArray(subName)) {
        //joining the name and description of subcaegory
        subName=subName.filter(item => item !== '');
        subName = [...new Set(subName.map(item => item.toLowerCase()))];
        subDescription=subDescription.filter(item => item !== '');
        subcategory = subName.map((value, i) => {
          return { subName: value, subDescription: subDescription[i] }
        })
      } else {
        subcategory = { subName: subName, subDescription: subDescription }
      }
      data.subcategory = subcategory
      const imagePaths = req.files.map((file) => file.path.substring(6));//removing public/from adderees
      data.image = imagePaths;
      delete data.subDescription;
      delete data.subName;
      const category = await Catagory.create(data);//adding the data
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
      // checking wheather the category name already exists
      const name = updatedData.name.toUpperCase()
      const categories = await Catagory.find({});//fetching the data from the db
      const existingCategory = categories.filter((item) => {
        return item.name.toUpperCase() == name && !(item._id.equals(updatedData.id)) //checkign if the categoryu already exists in the db
      })

      if (existingCategory.length > 0) {
        // Category with the same name already exists
        return res.render('categoryManagement', { Catagory: categories, errorMessage: 'Category with this name already exists.' })

      }
      let subName = updatedData.subName //extracting subcategory data to make it one object
      let subDescription = updatedData.subDescription
      let subcategory = {}
      delete updatedData.subDescription;
      delete updatedData.subName;
      //cheking if the file exists
      if (req.file) {
        const imagePaths = req.files.map((file) => file.path.substring(6));//removing public/from adderees
        //removing public/from adderees
        updatedData.image = imagePaths;
      }
      let result
      //check if subcategory exists
      if (subName) {
        
        // checking if only one sub category awailable or many
        if (Array.isArray(subName)) {
          subName=subName.filter(item => item !== '');
          subName = [...new Set(subName.map(item => item.toLowerCase()))];
          subDescription=subDescription.filter(item => item !== '');
          //joining the name and description of subcaegory
          subcategory = subName.map((value, i) => {
            return { subName: value, subDescription: subDescription[i] }
          })
          updatedData.subcategory=subcategory;
          result = await Catagory.findOneAndUpdate(
            { _id: id },
            {
              // $set: { subcategory: { $each: subcategory } },//pushing to the existing array
              $set: { ...updatedData },
            },
            {
              new: true, // To return the updated document
              upsert: true, // Create a new document if it doesn't exist
            }
          );
        } else {
          subcategory = { subName: subName, subDescription: subDescription }//add oly one data
          updatedData.subcategory=subcategory;
          result = await Catagory.findOneAndUpdate(
            { _id: id },
            {
              // $push: { subcategory: subcategory },
              $set: { ...updatedData },
            },
            {
              new: true, // To return the updated document
              upsert: true, // Create a new document if it doesn't exist
            }
          );
        }

      } else {
        //if no sub awailaale
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
        console.log('category updated');
        return res.status(401).send("not found");
      } else {
        return res.redirect('../admin/categoryManagement');
      }
    } catch (err) { console.log(err) }

  },


  //delete category
  deleteCategory: async (req, res) => {
    try {
      console.log(req.params.id);
      const categoryId = req.params.id;
      const category = await Catagory.deleteOne({ _id: categoryId });
      const products = await Products.deleteMany({ category: categoryId })
      if (!category || !products) {
        return res.status(404).json({ error: 'category not found' });
      }
      return res.redirect('../../admin/categoryManagement');
    } catch (error) {
      console.error(error);
      return res.status(500).json({ error: 'Internal Server Error' });
    }
  },

  // productManagement
  productManagement: async (req, res) => {
    try {
      const products = await Products.find({}); // Fetch product data
      const category = await Catagory.find({});
      let err
      if (req.session.err) {
        err=req.session.err
        req.session.err=null
      }else{
        err=''
      }
      res.render('productManagement', { products: products, category: category,err:err })
    }
    catch {

    }
  },

  //get sub category
  getSubcategory: async (req, res) => {
    try {
      const categoryId = req.params.cId;

      const category = await Catagory.findOne({ _id: categoryId });
      if (!category) {
        return res.status(404).json({ error: 'Category not found' });
      }

      const subcategories = category.subcategory;
      return res.status(200).json({ subcategories });
    } catch (error) {
      console.error(error);
      return res.status(500).json({ error: 'Internal Server Error' });
    }
  },

  // add new product
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

  // edit the product
  editProduct: async (req, res) => {
    try {
      const data = req.body;
      const id = data.id
      delete data.id
      console.log(id);
      let product

      if (req.files && req.files.length > 0) {
        const imagePaths = req.files.map((file) => file.path.substring(6));
        product = await Products.updateOne(
          { _id: id },
          { $push: { images: { $each: imagePaths } }, $set: { ...data } },
          { new: true }
        );
      } else {
        product = await Products.updateOne(
          { _id: id },
          { $set: { ...data } },
          { new: true }
        );
      }
 


      if (product) {
        console.log('product added');
        return res.redirect('../admin/productManagement');
      }
    } catch (error) {
      console.log(error);
    }

  },

  // delete the products
  deleteProduct: async (req, res) => {
    try {
      console.log(req.params.id);
      const productId = req.params.id;

      const result = await Products.deleteOne({ _id: productId });
      if (!result) {
        return res.status(404).json({ error: 'Product not found' });
      }
      return res.redirect('../../admin/productManagement');
    } catch (error) {
      console.error(error);
      return res.status(500).json({ error: 'Internal Server Error' });
    }
  },

  // order management
  orderManagement: async (req, res) => {
    try {
      const order = await Order.find({});

      let products = []
      for (const ord of order) {
        for (const prod of ord.items) {
          try {
            const item = await Products.findById(prod.productId);

            if (item) {
              // Check if product already exists in the array
              const productExists = products.some(product => product._id.toString() === item._id.toString());

              // If product does not exist in the array, push it
              if (!productExists) {
                products.push(item);
              }
            } else {
              console.log(`Product not found for ID: ${prod.productId}`);
            }
          } catch (error) {
            console.error(`Error fetching product: ${error}`);
          }
        }
      }
      console.log(products);
      return res.render('orderManagement', { order: order, products: products })

    } catch (error) {
      console.log(error);
    }
  },


  //updata status
  updateStatus: async (req, res) => {
    try {
      const oId = req.body.oId
      const status = req.body.status
      const update = await Order.findByIdAndUpdate(oId, { $set: { status: status } })
      return
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
    res.redirect('/admin');
  },

}

module.exports = adminController