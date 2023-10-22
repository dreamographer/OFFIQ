require('dotenv').config();
const express = require('express');
const router = express.Router();
router.use(express.json());
const crypto = require('crypto');  //encription module

//modals
const User = require('../models/user.models'); //user schema
const googelUser = require('../models/emailUserModel');//schema for google auth users
const Products = require('../models/productModel'); //products schema
const Category = require('../models/categoryModel'); //category schema
const Order = require('../models/order.model'); //order schema
const Wallet = require('../models/WalletModel')//Wallet schma

//keys
const algorithm = 'aes-256-cbc';
const key = process.env.ENCRIPTION_KEY;
const iv = 'initialisation-#';


// Helpers
const sendOTP = require('../helpers/otpSender') //Otp sending Function

//encription function
function encrypt(text, key) {
  try {
    const cipher = crypto.createCipheriv(algorithm, key, iv);
    let encrypted = cipher.update(text, 'utf8', 'hex');
    encrypted += cipher.final('hex');
    return encrypted;
  } catch (error) {
    console.log(error);
  }
}
//decrypting function
function decrypt(encryptedText, key) {
  const decipher = crypto.createDecipheriv('aes-256-cbc', key, iv);
  let decrypted = decipher.update(encryptedText, 'hex', 'utf8');
  decrypted += decipher.final('utf8');
  return decrypted;
}


//generate OTP
function generateOTP() {
  const expirationTime = new Date();
  expirationTime.setMinutes(expirationTime.getMinutes() + 10);//set 10 minutes as expiry
  // Generate a 6 digit number as OTP
  let otp = crypto.randomBytes(3).toString('hex')
  return { otp, expirationTime }
}


//verification of otp
async function verifyOTP(email, otp) {
  const user = await User.findOne({ email: email }, { addresses: 0, cart: 0, wishlist: 0 });
  if (user && otp === decrypt(user.otp, key) && Date.now() <= user.otpExpires) {
    user.verified = true;
    user.otp = undefined;
    user.otpExpires = undefined;
    await user.save();
    return { status: true, user };
  }
  return { status: false }
}

//deletion of data when email is unverified
async function deleteUnverifiedDocs() {// 600000 milliseconds is 10 minutes
  try {
    const deleted = await User.deleteMany({ verified: false })
    if (deleted.deletedCount > 0) {
      console.log("user deleted");
    }
    return
  } catch (error) {
    console.error(error);
  }

}


const userController = {
  //login of the user
  userLogin: async (req, res) => {
    deleteUnverifiedDocs()
    const { email, password } = req.body;//data given by the user
    try {
      const user = await User.findOne({ email }, { addresses: 0, cart: 0, wishlist: 0 });
      if (user != null) {//data from the DB
        if (!(user.googleAuth) && decrypt(user.password, key) === password && !(user.blocked)) {
          req.session.user = user;
          console.log(user.fullname + ' logged in');
          return res.redirect('/');
        } else if (user.blocked) {
          req.session.block = true;
          return res.redirect('/login');
        } else {
          req.session.err = true;
          return res.redirect('/login');
        }
      } else {
        req.session.err = true;
        return res.redirect('/login');
      }

    } catch (err) {
      console.log(err);
      return res.status(500).send('Error fetching user data');
    }
  },


  // forogot password page
  forgotPage: (req, res) => {
    return res.render('client/forgotPassword')
  },

  // otp for forgot password
  forgotPassword: async (req, res) => {
    try {
      let { otp, expirationTime } = generateOTP();
      let email = req.body.email


      const user = await User.findOne({ email })//inserting the data

      if (user) {
        let data = {}
        data.otp = encrypt(otp, key)
        data.otpExpires = expirationTime
        const update = await User.updateOne({ email }, { $set: { otp: data.otp, otpExpires: data.otpExpires } }) //updating the data

        const need = "forgotPassword"

        const send = await sendOTP(user.fullname, email, otp)

        return res.render('client/otpVerify', { email: email, need: need, error: '', minutes: 1, seconds: 10 })
      }

    } catch (err) {
      console.log(err);
      return res.status(500).send('Error creating USER');
    }

  },

  // updation of password
  updatePassword: async (req, res) => {
    try {
      const { email, password } = req.body
      const hashPassword = encrypt(password, key)
      const update = await User.updateOne({ email: email }, { $set: { password: hashPassword } }) //updateing the data

      return res.redirect('/')
    } catch (error) {
      console.log(error);
    }
  },

  //render signup page
  signUp: (req, res) => {
    setTimeout(() => {
      deleteUnverifiedDocs()
    }, 1000 * 60 * 10);
    return res.render('client/signup');
  },


  //user signUp
  userSignup: async (req, res) => {
    try {
      const data = req.body;//data given by the user
      const email = data.email
      const user = await User.findOne({ email });
      if (user) {
        req.session.exist = true
        return res.redirect('/login')
      } else {
        data.password = encrypt(data.password, key);//encripting the password
        try {
          let { otp, expirationTime } = generateOTP();
          data.otp = encrypt(otp, key)
          data.otpExpires = expirationTime
          const user = await User.create(data) //inserting the data
          const wallet = await Wallet.create({ user: user._id }) //creating wallet
          const send = await sendOTP(user.fullname, user.email, otp)
          const need = "userSignIN"
          return res.render('client/otpVerify', { email: user.email, need: need, error: '', minutes: 1, seconds: 10 })

        } catch (err) {
          console.log(err);
          return res.status(500).send('Error creating USER');
        }
      }

    } catch (error) {
      console.log(error);
    }

  },

  //email verification
  emailVerify: async (req, res) => {
    try {
      const { otp, email, need } = req.body
      const { status, user } = await verifyOTP(email, otp)
      if (status) { //setting value to the session
        if (need == "userSignIN") {
          req.session.user = user;
          console.log(user.fullname + ' logged in');
          return res.redirect('/');
        }
        else {
          return res.render('client/newPassword', { email });
        }
      }
      else {
        const { minutes, seconds } = req.body;
        if (need == "userSignIN") {
          return res.render('client/otpVerify', { email: email, need: "userSignIN", error: 'WRONG OTP', minutes: minutes, seconds: seconds })
        } else {
          return res.render('client/otpVerify', { email: email, need: "forgotPassword", error: 'WRONG OTP', minutes: minutes, seconds: seconds })

        }

      }
    } catch (error) {
      console.log(error);
    }
  },

  // resend OTP
  resend: async (req, res) => {
    // const tenMinutesAgo = new Date(Date.now() - 0); // 600000 milliseconds is 10 minutes
    try {
      let { otp, expirationTime } = generateOTP();
      const email = req.query.email
      const need = req.query.need
      sendOTP("Resend", email, otp)
      otp = encrypt(otp, key)
      const user = await User.updateOne({ email }, { $set: { otp: otp, otpExpires: expirationTime } }) //inserting the data
      return res.render('client/otpVerify', { email: email, need: need, error: 'New OTP send', minutes: 1, seconds: 10 })
    } catch (error) {
      console.error(error);
    }
  },

  //error in login
  loginErr: (req, res) => {
    try {
      if (req.session.user) {
        return res.redirect('/');
      }
      else if (req.session.err) {
        req.session.err = false;
        // Pass an error message to the login view
        return res.render('client/login', { errorMessage: 'Incorrect email or password' });
      } else if (req.session.exist) {
        req.session.exist = false;
        return res.render('client/login', { errorMessage: 'Email already registered , Please login' });

      } else if (req.session.block) {
        return res.render('client/login', { errorMessage: 'User account has been blocked by the admin' });
      }
      else {
        return res.render('client/login', { errorMessage: '' });
      }

    } catch (error) {
      console.log(error);
    }
  },

  //rendering the home page
  home: async (req, res) => {
    let category = await Category.find({ listed: true });

    return res.render('client/home', { category: category });
  },

  //home page search route 
  homeSearch: async (req, res) => {
    try {

      const search = req.body.search;

      const regex = new RegExp(search, 'i');
      const subcategories = await Category.aggregate([
        {
          $unwind: '$subcategory'
        },
        {
          $match: {
            'subcategory.subName': { $regex: regex }
          }
        }
      ]);
      const matchingSubcategories = subcategories.map(category => category.subcategory);

      return res.json({ subcategories: matchingSubcategories });
    } catch (error) {
      console.log(error);
    }

  },


  // add new address
  addAddress: async (req, res) => {
    try {
      const { addressLine1, city } = req.body
      let { pin } = req.body
      let { tag } = req.body
      pin = Number(pin)
      tag = tag.toUpperCase()
      let data = { addressLine1, city, tag, pin }
      const userId = req.session.user._id;
      const user = await User.findById(userId)

      if (user.addresses.some(item => item.tag === tag)) {
        return res.send('Tag already exist please enter a new tag')
      }
      if (user.googleAuth) {//for googlE aUTH USERS
        const gUser = await googelUser.findById(userId);
        gUser.addresses.push(data)
        gUser.save()
      } else {
        user.addresses.push(data)
        user.save()
      }
      return res.redirect('back')
    } catch (error) {
      console.log(error);
    }
  },

  //edit the address
  editAddress: async (req, res) => {
    try {
      const { addrId, addressLine1, city } = req.body
      let { pin } = req.body
      pin = Number(pin)
      let { tag } = req.body
      tag = tag.toUpperCase()
      const userId = req.session.user._id;
      const user = await User.findById(userId)
      if (user.googleAuth) { //for googlE aUTH USERS
        const gUser = await googelUser.findById(userId);
        const addrIndex = gUser.addresses.findIndex((item) => item._id == addrId);  //finding the index of the array if address be updated
        if (addrIndex !== -1) {
          const addr = gUser.addresses.splice(addrIndex, 1)[0];//getting the data which nee dto be updated 
          // modyfying the data
          addr.addressLine1 = addressLine1;
          addr.city = city;
          addr.tag = tag;
          addr.pin = pin;
          gUser.addresses.splice(addrIndex, 0, addr); //adding the modified data to the array
          const update = await googelUser.updateOne({ _id: userId }, { $set: { "addresses": gUser.addresses } }); //updatingthe address
        }
      } else {  //for other users
        const user = await User.findById(userId);
        const addrIndex = user.addresses.findIndex((item) => item._id == addrId);
        if (addrIndex !== -1) {
          const addr = user.addresses.splice(addrIndex, 1)[0];

          addr.addressLine1 = addressLine1;
          addr.city = city;
          addr.tag = tag;
          addr.pin = pin;
          user.addresses.splice(addrIndex, 0, addr);
          const update = await User.updateOne({ _id: userId }, { $set: { "addresses": user.addresses } });
        }
      }
      return res.redirect('back')
    } catch (error) {
      console.log(error);
    }
  },


  // render the user profile
  userProfile: async (req, res) => {
    try {
      const userId = req.session.user._id;
      const user = await User.findOne({ _id: userId });
      const order = (await Order.find({ userId })).reverse();

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
      let wallet = await Wallet.findOne({ user: userId })

      if (!wallet) {
        wallet = await Wallet.create({ user: userId })
      }
      const balance = wallet.balance
      return res.render('client/user', { order: order, products: products, user: user, balance })

    } catch (error) {
      console.log(error.message);
    }
  },

  //logout the user
  logout: (req, res) => {
    if (req.session.user) {
      console.log(`${req.session.user.fullname} logged out`);
    }
    req.session.destroy(); // Destroy session on logout
    return res.redirect('/');
  }


}
module.exports = userController;
