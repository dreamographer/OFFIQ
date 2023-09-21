require('dotenv').config();
const express = require('express');
const router = express.Router();
const nodemailer = require('nodemailer')
const crypto = require('crypto');  //encription module
router.use(express.json());

//modals
const User = require('../models/user.models'); //user schema
const Products = require('../models/productModel'); //products schema
const Category = require('../models/categoryModel') //category schema


//keys
const algorithm = 'aes-256-cbc';
const key = process.env.KEY;
const iv = process.env.IV;

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
  const otp = crypto.randomBytes(3).toString('hex')
  return { otp, expirationTime }
}


//sending OTP through mail
const sendOTP = async (name, email, otp) => {
  try {
    const transporter = nodemailer.createTransport({
      service: 'gmail',
      port: 587,
      secure: false,
      requireTLS: true,
      host: 'smtp.gmail.com',
      auth: {
        user: 'eatables.bitdrag@gmail.com',
        pass: process.env.SMTP_KEY
      }
    });
    let info = await transporter.sendMail({
      from: 'eatables.bitdrag@gmail.com',
      to: `${email}`,
      subject: 'OTP for verification',
      html: `<h1>Hy ${name}</h1><br><p>Your OTP for the verification is <h2>${otp}</h2></p>`,
    });

  } catch (error) {
    console.log(error);
  }
}

//verification of otp
async function verifyOTP(email, otp) {
  const user = await User.findOne({ email: email });
  if (user && otp === decrypt(user.otp, key) && Date.now() <= user.otpExpires) {
    user.verified = true;
    user.otp = undefined;
    user.otpExpires = undefined;
    await user.save();
    return { status: true, user };
  }
  return false;
}

//deletion of data when email is unverified
async function deleteUnverifiedDocs() {
  const tenMinutesAgo = new Date(Date.now() - 600000); // 600000 milliseconds is 10 minutes
  try {
    const deleted = await User.deleteMany({ verified: false, createdAt: { $lt: tenMinutesAgo } })
    console.log(`Deleted ${deleted.deletedCount} documents.`);
  } catch (error) {
    console.error(err);
  }

}

const userController = {
  //login of the user
  userLogin: async (req, res) => {
    const { email, password } = req.body;//data given by the user
    try {
      const user = await User.findOne({ email }); //data from the DB
      if (!(user.googleAuth) && user && decrypt(user.password, key) === password && !(user.blocked)) {
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

    } catch (err) {
      console.log(err);
      return res.status(500).send('Error fetching user data');
    }
  },


  //render signup page
  signUp: (req, res) => {
    res.render('signup');
  },


  //user signUp
  userSignup: async (req, res) => {
    try {
      const data = req.body;//data given by the user
      const email = data.email
      const user = await User.findOne({ email });
      if (user) {
        return res.json("Email already exist") //update this section
      } else {
        data.password = encrypt(data.password, key);//encripting the password
        try {
          let { otp, expirationTime } = generateOTP();
          data.otp = encrypt(otp, key)
          data.otpExpires = expirationTime
          const user = await User.create(data) //inserting the data

          sendOTP(user.fullname, user.email, otp)
          setInterval(deleteUnverifiedDocs, 600000);
          // have to bulid the logic of work flow
          return res.render('otpVerify', { email: user.email })

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
      const { otp, email } = req.body
      const { status, user } = await verifyOTP(email, otp)
      if (status) { //setting value to the session
        req.session.user = user;
        console.log(user.fullname + ' logged in');
        return res.redirect('/');
      }
      else {
        console.log("something went wrong while verification");
      }
    } catch (error) {
      console.log(error);
    }
  },

  //error in login
  loginErr: (req, res) => {
    try {
      if (req.session.user) {
        res.redirect('/');
      } else if (req.session.block) {
        res.render('login', { errorMessage: 'User account has been blocked by the admin' });
      }
      else if (req.session.err) {
        req.session.err = false;
        // Pass an error message to the login view
        res.render('login', { errorMessage: 'Incorrect email or password' });
      } else {
        res.render('login', { errorMessage: '' });
      }

    } catch (error) {
      console.log(error);
    }
  },

  //rendering the home page
  home: (req, res) => {
    res.render('home');
  },

  //render products view page
  products: async (req, res) => {
    try {
      const products = await Products.find({});
      let category = await Category.find({});
      res.render('products', { products: products, category: category });
    } catch (error) {
      console.log(error);
    }

  },

  productPage: async (req, res) => {
    try {
      const ID = req.params.id;
      console.log({'_id':ID});
      const product = await Products.findOne({'id':ID});
      console.log(product);
    } catch (error) {
      console.log(error);
    }
   
  },

  //logout the user
  logout: (req, res) => {
    if (req.session.admin) {
      console.log(`${req.session.admin.fullname} logged out`);
    }
    req.session.destroy(); // Destroy session on logout
    res.redirect('/');
  }


}
module.exports = userController;
