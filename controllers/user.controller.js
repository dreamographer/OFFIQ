const express = require('express');
const router = express.Router();
const User = require('../models/user.models'); //user schema
const crypto = require('crypto');  //encription module
router.use(express.json());
//keys
const algorithm = 'aes-256-cbc';
const key = process.env.KEY;
const iv = process.env.IV;
//encription function
function encrypt(text, key) {
  const cipher = crypto.createCipheriv(algorithm, key, iv);
  let encrypted = cipher.update(text, 'utf8', 'hex');
  encrypted += cipher.final('hex');
  return encrypted;
}
//decrypting function
function decrypt(encryptedText, key) {
  const decipher = crypto.createDecipheriv('aes-256-cbc', key, iv);
  let decrypted = decipher.update(encryptedText, 'hex', 'utf8');
  decrypted += decipher.final('utf8');
  return decrypted;
}


const userController = {
  //login of the user
  userLogin: async (req, res) => {
    const { email, password } = req.body;//data given by the user
    try {
      const user = await User.findOne({ email }); //data from the DB

      if (user && decrypt(user.password, key) === password) {
        req.session.user = user;
        console.log(user.fullname + ' logged in');
        return res.redirect('/');
      } else {
        req.session.err = true;
        return res.redirect('/login');
      }
    } catch (err) {
      console.log(err);
      return res.status(500).send('Error fetching user data');
    }
  },


  //user signUp
  userSignup: async (req, res) => {
    const data = req.body;//data given by the user
    data.password = encrypt(data.password, key);//encripting the password
    try {
      await User.create(data) //inserting the data
      console.log('user created');
        req.session.user = data; //setting value to the session
        console.log(data.fullname + ' logged in');
        return res.redirect('/');
    } catch (err) {
      console.log(err);
      return res.status(500).send('Error creating USER');
    }
  },


  //error in login
  loginErr: (req, res) => {
    if (req.session.user) {
      res.redirect('/');
    } else if (req.session.err) {
      req.session.err = false;
      // Pass an error message to the login view
      res.render('login', { errorMessage: 'Incorrect fullname or password' });
    } else {
      res.render('login', { errorMessage: '' });
    }
  },

  //rendering the home page
  home:(req, res) => {
    res.render('home');
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
