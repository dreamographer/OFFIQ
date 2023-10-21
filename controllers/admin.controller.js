require('dotenv').config();
const path=require('path'); 
//keys
const algorithm = 'aes-256-cbc';
const key = process.env.ENCRIPTION_KEY;
const iv = 'initialisation-#';
const crypto = require('crypto');  //encription module

//modals
const User = require('../models/user.models'); //user scheme
const Admin = require('../models/admin.models'); //admin schema
const Category = require('../models/categoryModel') //category schema
const Products = require('../models/productModel'); //products schema
const Order = require('../models/order.model'); //order schema
const Coupon = require('../models/couponModel');//coupon schema

// excel dependencies
const ExcelJS = require('exceljs');
const workbook = new ExcelJS.Workbook();
const worksheet = workbook.addWorksheet('Sales Data');

// pdf helper
const makePdf = require('../helpers/ReportPDF')

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
      // month total sale
      let currentMonth = new Date().getMonth() + 1; // Get the current date
      let monthSales = await Order.aggregate([
        {
          $match: {
            $expr: {
              $eq: [{ $month: "$createdAt" }, currentMonth]
            },
            status: "confirmed" // Optionally, you can filter by order status
          }
        },
        {
          $group: {
            _id: null,
            totalSales: { $sum: 1 } // Count the number of orders
          }
        },
        {
          $project: {
            _id: 0,
            totalSales: 1
          }
        }
      ]);
      const totalMonthSale = monthSales[0] ? monthSales[0].totalSales : 0

      // Day total sale
      const currentDate = new Date(); // Get the current date
      const currentDay = currentDate.getDate()

      const daySales = await Order.aggregate([
        {
          $match: {
            $expr: {
              $and: [
                { $eq: [{ $dayOfMonth: "$createdAt" }, currentDay] },
                { $eq: [{ $month: "$createdAt" }, currentMonth] }
              ]
            },
            status: "confirmed"
          }
        },
        {
          $group: {
            _id: null,
            totalSales: { $sum: 1 } // Count the number of orders
          }
        },
        {
          $project: {
            _id: 0,
            totalSales: 1
          }
        }
      ]);
      const totalDaySale = daySales[0] ? daySales[0].totalSales : 0

      // TOTAL PROFIT
      let monthProfit = await Order.aggregate([
        {
          $match: {
            $expr: {
              $eq: [{ $month: "$createdAt" }, currentMonth]
            },
            status: "confirmed"
          }
        },
        {
          $group: {
            _id: null,
            totalSales: { $sum: '$total' }
          }
        },
        {
          $project: {
            _id: 0,
            totalSales: 1
          }
        }
      ]);
      const Monthprofit = monthProfit[0] ? monthProfit[0].totalSales : 0

      res.render('admin', { totalDaySale, totalMonthSale, Monthprofit })
    } catch (err) {
      console.error(err);
      res.status(500).send('Error fetching user data');
    }
  },

  //giving data for chart
  chartData: async (req, res) => {
    const filter = req.body.filter
    let saleData
    let categoryData
    let profitData
    const targetYear = new Date().getFullYear(); //sets the result for one year 
    if (filter == 'MONTHLY') {
      // montly sales daty
      saleData = await Order.aggregate([
        {
          $match: {
            $expr: { $eq: [{ $year: "$createdAt" }, targetYear] },// Filter orders for the target year
            status: { $ne: 'cancelled' } //check the staus of the order
          }
        },
        {
          $project: {
            month: { $month: "$createdAt" },//projects the month from the time stamp
          }
        },
        {
          $group: { //grouping the order based on the month and finding the sum
            _id: "$month",
            count: { $sum: 1 }
          }
        },
        {
          $project: {
            _id: 0,//set the id to 0 for avoding id in the result
            month: {
              $switch: { //change the month to currsonding string 
                branches: [
                  { case: { $eq: ["$_id", 1] }, then: "Jan" },
                  { case: { $eq: ["$_id", 2] }, then: "Feb" },
                  { case: { $eq: ["$_id", 3] }, then: "Mar" },
                  { case: { $eq: ["$_id", 4] }, then: "Apr" },
                  { case: { $eq: ["$_id", 5] }, then: "May" },
                  { case: { $eq: ["$_id", 6] }, then: "Jun" },
                  { case: { $eq: ["$_id", 7] }, then: "Jul" },
                  { case: { $eq: ["$_id", 8] }, then: "Aug" },
                  { case: { $eq: ["$_id", 9] }, then: "Sep" },
                  { case: { $eq: ["$_id", 10] }, then: "Oct" },
                  { case: { $eq: ["$_id", 11] }, then: "Nov" },
                  { case: { $eq: ["$_id", 12] }, then: "Dec" }
                ],
                default: "Unknown"
              }
            },
            count: 1 //for showing the count
          }
        },
        {
          $sort: {
            month: 1
          }
        }
      ]);

      // montly category porffit data
      categoryData = await Order.aggregate([
        {
          $match: {
            $expr: { $eq: [{ $year: "$createdAt" }, targetYear] },// Filter orders for the target year
            status: { $ne: 'cancelled' } // check for only the confirmd order
          }
        },
        {
          $unwind: "$items" // Unwind the "items" array
        },
        {
          $group: {
            _id: {
              category: "$items.category"
            },
            itemCount: { $sum: "$items.quantity" }
          }
        },
        {
          $project: {
            category: "$_id.category",
            itemCount: 1,
            _id: 0
          }
        }
      ]);

      // monthlyu porfit data
      profitData = await Order.aggregate([
        {
          $match: {
            $expr: { $eq: [{ $year: "$createdAt" }, targetYear] },// Filter orders for the target year
            status: { $ne: 'cancelled' } //check the staus of the order
          }
        },
        {
          $project: {
            month: { $month: "$createdAt" },//projects the month from the time stamp
            total: 1
          }
        },
        {
          $group: { //grouping the order based on the month and finding the sum
            _id: "$month",
            totalSales: { $sum: '$total' }
          }
        },
        {
          $project: {
            _id: 0,
            month: {
              $switch: { //change the month to currsonding string 
                branches: [
                  { case: { $eq: ["$_id", 1] }, then: "Jan" },
                  { case: { $eq: ["$_id", 2] }, then: "Feb" },
                  { case: { $eq: ["$_id", 3] }, then: "Mar" },
                  { case: { $eq: ["$_id", 4] }, then: "Apr" },
                  { case: { $eq: ["$_id", 5] }, then: "May" },
                  { case: { $eq: ["$_id", 6] }, then: "Jun" },
                  { case: { $eq: ["$_id", 7] }, then: "Jul" },
                  { case: { $eq: ["$_id", 8] }, then: "Aug" },
                  { case: { $eq: ["$_id", 9] }, then: "Sep" },
                  { case: { $eq: ["$_id", 10] }, then: "Oct" },
                  { case: { $eq: ["$_id", 11] }, then: "Nov" },
                  { case: { $eq: ["$_id", 12] }, then: "Dec" }
                ],
                default: "Unknown"
              }
            },
            totalSales: 1
          }
        },
        {
          $sort: {
            month: 1
          }
        }
      ]);
    }
    else if (filter == "YERALY") {
      // total sale data
      saleData = await Order.aggregate([
        {
          $match: {
            status: { $ne: 'cancelled' } //check the staus of the order
          }
        },
        {
          $project: {
            year: { $year: "$createdAt" },//projects the month from the time stamp
          }
        },
        {
          $group: { //grouping the order based on the month and finding the sum
            _id: "$year",
            count: { $sum: 1 }
          }
        },
        {
          $project: {
            _id: 0,//set the id to 0 for avoding id in the result
            year: '$_id',
            count: 1 //for showing the count
          }
        },
        {
          $sort: {
            year: 1
          }
        }
      ]);

      // cataegroy dale data
      categoryData = await Order.aggregate([
        {
          $match: {
            status: { $ne: 'cancelled' } // check for only the confirmd order
          }
        },
        {
          $unwind: "$items" // Unwind the "items" array
        },
        {
          $group: {
            _id: {
              category: "$items.category"
            },
            itemCount: { $sum: "$items.quantity" }
          }
        },
        {
          $project: {
            category: "$_id.category",
            itemCount: 1,
            _id: 0
          }
        }
      ]);


      // Profit Data
      profitData = await Order.aggregate([
        {
          $match: {
            status: { $ne: 'cancelled' } //check the staus of the order
          }
        },
        {
          $project: {
            year: { $year: "$createdAt" },//projects the month from the time stamp
            total: 1
          }
        },
        {
          $group: { //grouping the order based on the month and finding the sum
            _id: "$year",
            totalSales: { $sum: '$total' }
          }
        },
        {
          $project: {
            _id: 0,//set the id to 0 for avoding id in the result
            year: '$_id',
            totalSales: 1 //for showing the count
          }
        },
        {
          $sort: {
            year: 1
          }
        }
      ]);

    }

    console.log(saleData);

    return res.status(200).json({ saleData: saleData, filter: filter, categoryData: categoryData, profitData })
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
      const category = await Category.find({}); // Fetch fdata
      if (req.session.err) {
        err = req.session.err
        req.session.err = null
      } else {
        err = ''
      }
      return res.render('categoryManagement', { Category: category, errorMessage: err })
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
      const categories = await Category.find({});//fetching the data from the db
      const existingCategory = categories.filter((item) => {
        return item.name.toUpperCase() == name//checkign if the categoryu already exists in the db
      })

      if (existingCategory.length > 0) {
        // Category with the same name already exists
        return res.render('categoryManagement', { Category: categories, errorMessage: 'Category with this name already exists.' })

      }
      let subcategory = {}
      //checking if there is one subcategory or many 
      if (Array.isArray(subName)) {
        //joining the name and description of subcaegory
        subName = subName.filter(item => item !== '');
        subName = [...new Set(subName.map(item => item.toLowerCase()))];
        subDescription = subDescription.filter(item => item !== '');
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
      const category = await Category.create(data);//adding the data
      if (category) {
   
        return res.redirect('/admin/categoryManagement');
      }
    } catch (error) {
      console.log(error);
    }
  },


  deleteCatImage: async (req, res) => {
    try {
      const imageIndex = req.body.imageIndex
      const cId = req.body.cId

      const category = await Category.findById(cId)
      category.image.splice(imageIndex, 1)
      category.save()
      return res.status(200).send()
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
      const categories = await Category.find({});//fetching the data from the db
      const existingCategory = categories.filter((item) => {
        return item.name.toUpperCase() == name && !(item._id.equals(updatedData.id)) //checkign if the categoryu already exists in the db
      })
      let imagePaths
      if (existingCategory.length > 0) {
        // Category with the same name already exists
        return res.render('categoryManagement', { Category: categories, errorMessage: 'Category with this name already exists.' })

      }
      let subName = updatedData.subName //extracting subcategory data to make it one object
      let subDescription = updatedData.subDescription
      let subcategory = {}
      delete updatedData.subDescription;
      delete updatedData.subName;

      //cheking if the file exists
      if (req.files) {

        imagePaths = req.files.map((file) => file.path.substring(6));//removing public/from adderees
      
        //removing public/from adderees

      }
      let result
      //check if subcategory exists
      if (subName) {

        // checking if only one sub category awailable or many
        if (Array.isArray(subName)) {
          subName = subName.filter(item => item !== '');
          subName = [...new Set(subName.map(item => item.toLowerCase()))];
          subDescription = subDescription.filter(item => item !== '');
          //joining the name and description of subcaegory
          subcategory = subName.map((value, i) => {
            return { subName: value, subDescription: subDescription[i] }
          })
          updatedData.subcategory = subcategory;
          let updateObject = {
            $set: { ...updatedData },
          };

          if (imagePaths && imagePaths.length > 0) {
            updateObject.$push = { image: { $each: imagePaths } };
          }
          result = await Category.findOneAndUpdate(
            { _id: id },
            updateObject,
            {
              new: true, // To return the updated document
              upsert: true, // Create a new document if it doesn't exist
            }
          );
        } else {
          subcategory = { subName: subName, subDescription: subDescription }//add oly one data
          updatedData.subcategory = subcategory;
          let updateObject = {
            $set: { ...updatedData },
          };

          if (imagePaths && imagePaths.length > 0) {
            updateObject.$push = { image: { $each: imagePaths } };
          }
          result = await Category.findOneAndUpdate(
            { _id: id },
            updateObject,
            {
              new: true, // To return the updated document
              upsert: true, // Create a new document if it doesn't exist
            }
          );
        }

      } else {
        //if no sub awailaale
        let updateObject = {
          $set: { ...updatedData },
        };

        if (imagePaths && imagePaths.length > 0) {
          updateObject.$push = { image: { $each: imagePaths } };
        }
        result = await Category.findOneAndUpdate(
          { _id: id },
          updateObject,
          {
            new: true, // To return the updated document
            upsert: true, // Create a new document if it doesn't exist
          }
        );
      }
      if (!result) {
        return res.status(401).send("not found");
      } else {
        console.log('category updated');
        return res.redirect('/admin/categoryManagement');
      }
    } catch (err) { console.log(err) }

  },


  //delete category
  deleteCategory: async (req, res) => {
    try {
  
      const categoryId = req.params.id;
      const category = await Category.deleteOne({ _id: categoryId });
      const products = await Products.deleteMany({ category: categoryId })
      if (!category || !products) {
        return res.status(404).json({ error: 'category not found' });
      }
      return res.redirect('/admin/categoryManagement');
    } catch (error) {
      console.error(error);
      return res.status(500).json({ error: 'Internal Server Error' });
    }
  },

  // productManagement
  productManagement: async (req, res) => {
    try {
      const products = await Products.find({}); // Fetch product data
      const category = await Category.find({});
      let err
      if (req.session.err) {
        err = req.session.err
        req.session.err = null
      } else {
        err = ''
      }
      res.render('productManagement', { products: products, category: category, err: err })
    }
    catch {

    }
  },

  //get sub category
  getSubcategory: async (req, res) => {
    try {
      const categoryId = req.params.cId;

      const category = await Category.findOne({ _id: categoryId });
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
      const imagePaths = req.files.map((file) => file.path.substring(6));
      data.images = imagePaths;
      const product = await Products.create(data);
      if (product) {
        
        return res.redirect('/admin/productManagement');
      }
    } catch (error) {
      console.log(error);
    }
  },

  // edit product Page
  editProductPage: async (req, res) => {
    try {
      const pId = req.params.pid
      const category = await Category.find({});
      const products = await Products.find({ _id: pId })
      const product = products[0]
      let err

      if (req.session.err) {
        err = req.session.err
        req.session.err = null
      } else {
        err = ''
      }
      return res.render('editProduct', { product: product, category: category, err: err })
    }
    catch (error) {
      console.log(error);
    }
  },

  // remove image from category
  removeImage: async (req, res) => {
    try {
      const imageUrl = req.body.imageName
      const pId = req.body.pId

      const product = await Products.findById(pId)
      product.images.splice(imageUrl, 1)
      product.save()
      return res.status(200).send()
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
    
        return res.redirect('/admin/productManagement');
      }
    } catch (error) {
      console.log(error);
    }

  },

  // delete the products
  deleteProduct: async (req, res) => {
    try {
   
      const productId = req.params.id;

      const result = await Products.deleteOne({ _id: productId });
      if (!result) {
        return res.status(404).json({ error: 'Product not found' });
      }
      return res.redirect('/admin/productManagement');
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
      return res.render('orderManagement', { order: order, products: products })

    } catch (error) {
      console.log(error);
    }
  },

  // oderpage
  orderPage: async (req, res) => {
    try {

      const oId = req.params.oId
      const order = await Order.find({ _id: oId });

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
      res.render('orderPageAdmin', { order: order[0], products: products })

    } catch (error) {
      console.log(error);
    }
  },

  //updata status
  updateStatus: async (req, res) => {
    try {
      const oId = req.body.oId
      const status = req.body.status
      const order = await Order.findById(oId);
      for (const item of order.items) {
        const productId = item.productId;
        const quantity = item.quantity;
        // Find the corresponding product and update its quantity
        await Products.findByIdAndUpdate(
          productId,
          { $inc: { quantity: quantity } },
        );
      }
      order.status = status
      order.save()
      return res.status(200).json("updated")
    } catch (error) {
      console.log(error);
    }
  },

  // coupon Mangement
  couponManagement: async (req, res) => {
    try {
      const coupons = await Coupon.find();
      if (req.app.locals.data) {
    
        err = req.app.locals.data
        req.app.locals.data = null
      } else {
        err = ''
      }
      return res.render('couponManagement', { coupons: coupons, errorMessage: err })

    } catch (error) {
      console.log(error);
    }
  },
  // add coupon
  addCoupon: async (req, res) => {
    try {

      let data = req.body
      const coupons = await Coupon.findOne({ couponCode: data.couponCode });
      if (coupons) {
        req.app.locals.data = 'Coupon Name already exist';
        return res.redirect(`/admin/couponManagement`)
      }
      let end = new Date(req.body.endDate);
      let start = new Date(req.body.startDate);

      if (start > end) {
        req.app.locals.data = 'The end date should be after the start date';
        return res.redirect(`/admin/couponManagement`)
      } else if (start == end) {
        req.app.locals.data = 'Minimun one day should be there';
        return res.redirect(`/admin/couponManagement`)
      }
      let newCoupon = new Coupon({
        couponCode: data.couponCode,
        description: data.description,
        discountType: data.discountType,
        discountValue: data.discountValue,
        minimumPurchase: data.minimumPurchase,
        startDate: data.startDate,
        endDate: data.endDate
      })

      const coupon = Coupon.create(newCoupon)

      return res.redirect(`/admin/couponManagement`)
    } catch (error) {

      console.log(error);
    }
  },
  // edit coupon
  editCoupon: async (req, res) => {
    try {
      const cId = req.body.id
      let data = req.body
      const coupons = await Coupon.findOne({ couponCode: data.couponCode });

      let end = new Date(req.body.endDate);
      let start = new Date(req.body.startDate);

      if (start > end) {
        req.app.locals.data = 'The end date should after start date';
        return res.redirect(`/admin/couponManagement`)
      } else if (start > end) {
        req.app.locals.data = 'Minimun one day should be there';
        return res.redirect(`/admin/couponManagement`)
      }
      delete data.id
      let coupon = await Coupon.findByIdAndUpdate(cId, data, { new: true })
      return res.redirect(`/admin/couponManagement`)
    } catch (error) {
      console.log(error);
    }
  },

  // delete the coupon
  deleteCoupon: async (req, res) => {
    try {
      const id = req.params.id;
      const deletedCoupon = await Coupon.deleteOne({ "_id": id })
     
      return res.redirect('back')
    } catch (error) {
      console.log(error);
    }
  },

  // report Management
  Report: async (req, res) => {
    res.render('Report')
  },

  // gernerate pdf report
  pdfReport: async (req, res) => {
    let result=await Order.find({status:'confirmed'},{items:0,invoice:0,offer:0,shippingAddress:0,updatedAt:0})
    makePdf(result,path.join(__dirname,`../public/Report/SalesData.pdf`))
    setTimeout(() => {
      return res.redirect('/Report/SalesData.pdf')
    }, 1000);
  },

  // Gernerate excel report
  excelReport: async (req, res) => {

    // Add Header Row
    worksheet.columns = [
      { header: 'Order ID', key: '_id', width: 30 },
      { header: 'User ID', key: 'userId', width: 30 },
      { header: 'Total Amount', key: 'total', width: 10 },
      { header: 'Payment ID', key: 'paymentId', width: 30 },
      { header: 'Date', key: 'createdAt', width: 30 },
      { header: 'Payment Mode', key: 'paymentMode', width: 15 },
      // Add other headers as needed
    ];

    let result=await Order.find({status:'confirmed'},{items:0,invoice:0,offer:0,shippingAddress:0,updatedAt:0})
   
    // Add Data Rows
    result.forEach(document => {
      worksheet.addRow(document);
    });

    // Write to File
    
    workbook.xlsx.writeFile(path.join(__dirname,`../public/Report/SalesData.xlsx`));
    setTimeout(()=>{

      return res.redirect('/Report/SalesData.xlsx')
    },1000)
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