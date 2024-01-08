require('dotenv').config();
const path = require('path');
//keys
const algorithm = 'aes-256-cbc';
const key = process.env.ENCRIPTION_KEY;
const iv = 'initialisation-#';
const crypto = require('crypto');  //encription module

//modals
const User = require('../models/user.models'); //user scheme
const Admin = require('../models/admin.models'); //admin schema
const Order = require('../models/order.model'); //order schema
const Banner = require('../models/banner.model');//banner Schema

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
            status: { $ne: 'cancelled' } // Optionally, you can filter by order status
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
            status: { $ne: 'cancelled' }
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
            status: { $ne: 'cancelled' }
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
      // Banner
      let banner = await Banner.find({})


      res.render('admin/admin', { totalDaySale, totalMonthSale, Monthprofit, banner })
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

    return res.status(200).json({ saleData: saleData, filter: filter, categoryData: categoryData, profitData })
  },

  //user management
  userManagement: async (req, res) => {
    try {
      const users = await User.find({}, { _id: 1, fullname: 1, email: 1, phone: 1, blocked: 1 }); // Fetch fdata
      // Render the admin EJS template with users data
      res.render('admin/userManagement', { userData: users })
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

  // add banner imgae
  addBanner: async (req, res) => {
    const imageUrl = req.files.map((file) => file.path.substring(6));
    const banner = await Banner.create({ imageUrl: imageUrl })
    return res.redirect('/admin/')
  },

  // remove banner image
  removeBannerImage: async (req, res) => {
    try {
      const imageUrl = req.body.imageName
      const bId = req.body.bId

      const banner = await Banner.findByIdAndDelete(bId)
      return res.status(200).send()
    } catch (error) {
      console.log(error);
    }
  },
  // report Management
  Report: async (req, res) => {
    res.render('admin/Report')
  },

  // gernerate pdf report
  pdfReport: async (req, res) => {
    let result = await Order.find({ status: 'confirmed' }, { items: 0, invoice: 0, offer: 0, shippingAddress: 0, updatedAt: 0 })
    makePdf(result, path.join(__dirname, `../public/Report/SalesData.pdf`))
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

    let result = await Order.find({ status: 'confirmed' }, { items: 0, invoice: 0, offer: 0, shippingAddress: 0, updatedAt: 0 })

    // Add Data Rows
    result.forEach(document => {
      worksheet.addRow(document);
    });

    // Write to File

    workbook.xlsx.writeFile(path.join(__dirname, `../public/Report/SalesData.xlsx`));
    setTimeout(() => {

      return res.redirect('/Report/SalesData.xlsx')
    }, 1000)
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