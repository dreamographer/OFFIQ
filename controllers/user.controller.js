require('dotenv').config();
const express = require('express');
const router = express.Router();
const crypto = require('crypto');  //encription module
router.use(express.json());
const path = require('path');

//modals
const User = require('../models/user.models'); //user schema
const googelUser = require('../models/emailUserModel');//schema for google auth users
const Products = require('../models/productModel'); //products schema
const Category = require('../models/categoryModel'); //category schema
const Order = require('../models/order.model'); //order schema
const Coupon = require('../models/couponModel');//coupon schema
const Wallet = require('../models/WalletModel')//Wallet schma

//keys
const algorithm = 'aes-256-cbc';
const key = process.env.ENCRIPTION_KEY;
const iv = 'initialisation-#';

// Razorpay
const { RAZORPAY_ID_KEY, RAZORPAY_SECRET_KEY } = process.env
const Razorpay = require('razorpay')
let instance = new Razorpay({ key_id: RAZORPAY_ID_KEY, key_secret: RAZORPAY_SECRET_KEY })

// Helpers
//pdf Generation
const makePdf = require('../helpers/PdfGenerator')
//Otp sending Function
const sendOTP = require('../helpers/otpSender')

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
    if (deleted) {
      console.log("user deleted");
    }
    return
  } catch (error) {
    console.error(err);
  }

}

// genrate invoice Pdf
async function generatePdf(oId, uId) {
  const user = await User.findById(uId)
  const order = await Order.findOne({ _id: oId });
  let products = []

  for (const prod of order.items) {
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
  let invoice = {  //data given
    shipping: {
      name: user.fullname,
      address: order.shippingAddress.addressLine1,
      city: order.shippingAddress.city,
      postal_code: order.shippingAddress.pin
    },
    items: [],
    subtotal: order.total * 100,
    discount: order.offer,
    invoice_nr: order._id,
    payment_id: order.paymentId
  };

  products.forEach((product, i) => {
    invoice['items'].push({
      item: product.name,
      quantity: order.items[i].quantity,
      amount: order.items[i].price * 100,
    })
  });
  console.log("invoice", invoice)
  let path = 'test.pdf'
  makePdf(invoice, order.invoice)
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
    return res.render('forgotPassword')
  },

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
        console.log(send);
        return res.render('otpVerify', { email: email, need: need, error: '', minutes: 1, seconds: 10 })
      }

    } catch (err) {
      console.log(err);
      return res.status(500).send('Error creating USER');
    }

  },
  updatePassword: async (req, res) => {
    try {
      const { email, password } = req.body
      const hashPassword = encrypt(password, key)
      const update = await User.updateOne({ email: email }, { $set: { password: hashPassword } }) //updateing the data
      console.log("password updated");
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

    return res.render('signup');
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
          const send = await sendOTP(user.fullname, user.email, otp)
          const need = "userSignIN"
          return res.render('otpVerify', { email: user.email, need: need, error: '', minutes: 1, seconds: 10 })

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
          return res.render('newPassword', { email });
        }
      }
      else {
        const { minutes, seconds } = req.body;
        if (need == "userSignIN") {
          return res.render('otpVerify', { email: email, need: "userSignIN", error: 'WRONG OTP', minutes: minutes, seconds: seconds })
        } else {
          return res.render('otpVerify', { email: email, need: "forgotPassword", error: 'WRONG OTP', minutes: minutes, seconds: seconds })

        }

      }
    } catch (error) {
      console.log(error);
    }
  },

  resend: async (req, res) => {
    // const tenMinutesAgo = new Date(Date.now() - 0); // 600000 milliseconds is 10 minutes
    try {
      let { otp, expirationTime } = generateOTP();
      const email = req.query.email
      const need = req.query.need
      sendOTP("Resend", email, otp)
      otp = encrypt(otp, key)
      const user = await User.updateOne({ email }, { $set: { otp: otp, otpExpires: expirationTime } }) //inserting the data
      return res.render('otpVerify', { email: email, need: need, error: 'New OTP send', minutes: 1, seconds: 10 })
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
        return res.render('login', { errorMessage: 'Incorrect email or password' });
      } else if (req.session.exist) {
        req.session.exist = false;
        return res.render('login', { errorMessage: 'Email already registered , Please login' });

      } else if (req.session.block) {
        return res.render('login', { errorMessage: 'User account has been blocked by the admin' });
      }
      else {
        return res.render('login', { errorMessage: '' });
      }

    } catch (error) {
      console.log(error);
    }
  },

  //rendering the home page
  home: async (req, res) => {
    let category = await Category.find({});

    return res.render('home', { category: category });
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
  //ALL products 
  allProducts: async (req, res) => {
    try {
      let pageNo = parseInt(req.params.pageNo)
    let size = 10
    let query = {}
    if (pageNo < 0 || pageNo === 0) {
      response = { "error": true, "message": "invalid page number, should start with 1" };
      return res.json(response)
    }
    query.skip = size * (pageNo - 1)
    query.limit = size
    let data= await Products.paginate({}, { offset: query.skip, limit: query.limit })
      return res.render('allProducts', { pageData: data})
      
    } catch (error) {
      console.log(error);
    }
    
  },
  //render products view page
  products: async (req, res) => {
    try {
      const cId = req.params.id
      const products = await Products.find({ category: cId });
      let category = await Category.find({ _id: cId });

      return res.render('products', { products: products, category: category });
    } catch (error) {
      console.log(error);
    }
  },
  // render category page
  category: async (req, res) => {
    const cId = req.params.id
    console.log(cId);
    const products = await Products.find({ subCategory: cId });
    const category = await Category.findOne({
      'subcategory._id': cId
    }, { subcategory: 1 });
    let subcategory = category.subcategory.find(sub => sub._id.equals(cId));
    subcategory = subcategory.subName;
    return res.render('category', { products, subcategory });
  },

  // search for products
  productSearch: async (req, res) => {
    try {

      const search = req.body.search;

      const regex = new RegExp(search, 'i');
      const products = await Products.aggregate([
        {
          $project: {
            'name': 1,
          }
        },
        {
          $match: {
            'name': { $regex: regex }
          }

        },
        {
          $limit: 5
        }
      ]);
      const acceptHeader = req.get('Accept');
      if (req.body.fetchReq) {
        // If the request accepts JSON, return JSON response
        return res.json({ products: products });
      } else {

        return res.send("No result")
      }
    } catch (error) {
      console.log(error);
    }

  },

  //render product page
  productPage: async (req, res) => {
    try {
      const ID = req.params.id;
      const user = req.session.user
      const product = await Products.findOne({ '_id': ID });
      return res.render('productView', { product: product, user: user });
    } catch (error) {
      console.log(error);
    }

  },


  // user cart
  cart: async (req, res) => {
    try {
      let msg = ''
      const userId = req.session.user._id;
      if (!userId) {
        return res.redirect('/')
      }
      const user = await User.findOne({ _id: userId }, { cart: 1 });
      const cart = user.cart;
      const products = [];

      for (const prod of cart) {
        try {
          const item = await Products.findById(prod.productId);
          if (item) {
            products.push(item);
          } else {
            // Handle the case where a product with the given ID is not found
            console.log(`Product not found for ID: ${prod.productId}`);
          }
        } catch (error) {
          // Handle any errors that occur during product fetching
          console.error(`Error fetching product: ${error}`);
        }
      }
      if (req.app.locals.data) {
        msg = req.app.locals.data
        req.app.locals.data = null
      }

      return res.render('cart', { cart: cart, products: products, msg: msg });
    } catch (error) {
      console.log(error);
    }


  },

  // add to cart
  addToCart: async (req, res) => {
    try {
      const { productId, quantity } = req.body;
      const userId = req.session.user._id;


      if (!userId) {
        return res.status(401).json({ message: 'User not authenticated' });
      }
      const updatedProduct = await Products.findOne(
        { _id: productId, quantity: { $gte: quantity } },
        // { $inc: { quantity: -quantity } }, update the quantity
        { new: true }
      );

      if (!updatedProduct) {
        return res.status(204).json({ message: 'Product out of stock' });
      }
      const user = await User.findById(userId);
      if (user.googleAuth) {//for googlE aUTH USERS
        const gUser = await googelUser.findById(userId);
        // Find the user and update the cart
        const existingCartItemIndex = gUser.cart.findIndex(item => item.productId.equals(productId));
        if (existingCartItemIndex !== -1) {
          // Cart item with the same productId exists, update its quantity
          gUser.cart[existingCartItemIndex].quantity += Number(quantity);
        } else {
          // Cart item with the same productId doesn't exist, add a new item
          gUser.cart.push({ productId, quantity });
        }

        // Save the updated user document
        await gUser.save();
      } else {
        // Find the user and update the cart

        const existingCartItemIndex = user.cart.findIndex(item => item.productId.equals(productId));
        if (existingCartItemIndex !== -1) {
          // Cart item with the same productId exists, update its quantity
          user.cart[existingCartItemIndex].quantity += Number(quantity);
        } else {
          // Cart item with the same productId doesn't exist, add a new item
          user.cart.push({ productId, quantity });
        }
        // Save the updated user document
        await user.save();
      }
      return res.status(200).json({ message: 'Item added to cart' });

    } catch (error) {
      console.error(error);
      return res.status(500).json({ message: 'Internal server error' });
    }
  },

  // remove product from the cart
  removeProduct: async (req, res) => {
    try {
      const userId = req.session.user._id;
      const pId = req.params.id
      const status = await User.findByIdAndUpdate(
        userId,
        { $pull: { cart: { productId: pId } } }
      );


      if (status) {
        return res.status(200).redirect('/cart')
      }
    } catch (error) {
      console.log(error);
    }

  },


  //update the cart
  updateCart: async (req, res) => {
    try {
      const pId = req.body.itemId
      const userId = req.session.user._id
      const quantity = req.body.amount;

      const result = await User.updateOne(
        {
          _id: userId,
          'cart.productId': pId, // Match the product id in the user's cart
        },
        {
          $set: {
            'cart.$.quantity': quantity, // Update the quantity for the matched product
          },
        }

      );
      if (result.nModified === 0) {

        return res.status(200).json({ message: 'No documents were updated' });

      } else {
        return res.status(200).json({ message: 'Document updated successfully' });

      }

    } catch (error) {
      console.log(error);
    }
  },

  // applay promo code
  applyPromo: async (req, res) => {
    try {
      let code = req.body.code
      let total = req.body.total
      const coupon = await Coupon.findOne({ couponCode: code })
      if (total < coupon.minimumPurchase) {
        return res.send({ error: `Minimum purchase value is ${coupon.minimumPurchase}` })
      }
      console.log(coupon);
      if (coupon) {
        return res.send({ type: coupon.discountType, value: coupon.discountValue })
      } else {
        return res.send({ error: 'Invalid Code' })
      }



    } catch (error) {
      console.log(error);
    }
  },
  // genreate order id in razorpay
  GenerateOrder: async (req, res) => {
    try {
      const amount = Number(req.body.amount)
      //RaZor Pay
      instance.orders.create({
        amount: amount,
        currency: "INR",
        receipt: "receipt#1"
      }).then(order => {
        return res.send({ orderId: order.id })
      })


    } catch (error) {
      console.log(error);
    }
  },

  //checkout page
  checkOut: async (req, res) => {
    try {
      const sum = req.body.sum
      let offer = req.body.offer ?? ''
      const userId = req.session.user._id;
      if (!userId) {
        return res.redirect('/')
      }
      const user = await User.findOne({ _id: userId }, { cart: 1, addresses: 1, wallet: 1 });
      const addresses = user.addresses
      const cart = user.cart;

      const products = [];
      for (const prod of cart) {
        try {
          const item = await Products.findById(prod.productId);
          if (prod.quantity > item.quantity) {
            req.app.locals.data = "GIVEN QUANTITY NOT AVAILABLE"
            return res.redirect('/cart')
          }
          if (item) {
            products.push(item);
          } else {
            //  product with the given ID is not found
            console.log(`Product not found for ID: ${prod.productId}`);
          }
        } catch (error) {
          // Handle any errors that occur during product fetching
          console.error(`Error fetching product: ${error}`);
        }
      }
      const wallet = await Wallet.findOne({ user: userId })
      console.log(wallet);
      return res.render('checkout', { cart: cart, products: products, address: addresses, sum: sum, offer: offer, wallet: wallet.balance });
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
      // if (user.addresses.some(item => item.tag === tag)) {
      //   return res.send('Tag already exist please enter a new tag')
      // }
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

  // order
  order: async (req, res) => {
    try {
      const userId = req.session.user._id;
      let status
      let paymentId
      let total, address, paymentMode, offer

      if (req.body.razorpay_payment_id) {
        // online payment
        let order = await instance.payments.fetch(req.body.razorpay_payment_id)
        total = Number(order.amount) / 100
        if (order.notes.address == '') {
          return res.send('please select one address')
        }
        address = order.notes.address
        paymentMode = order.method
        status = 'confirmed'
        paymentId = order.id
        offer = order.notes.offer ?? ''
      } else {
        if (!req.body.address) {
          return res.send('please select one address')
        }
        if (req.body.paymentMode == 'Wallet') {
          total = Number(req.body.total.substring(1))
          const wallet = await Wallet.findOne({ user: userId })

          if (wallet.length <= 0) {
            const succes = Wallet.create({ user: userId }, { new: true })
          }
          else if (wallet.balance - total < 0) {
            return res.send("Not enough balance")
          } else {
            wallet.balance = wallet.balance - total
            wallet.save()
          }
        }
        // COD
        total = Number(req.body.total.substring(1))
        offer = req.body.offer ?? ''
        address = req.body.address
        paymentMode = req.body.paymentMode
        status = 'confirmed'
        paymentId = crypto.randomBytes(3).toString('hex')
      }
      const user = await User.findOne({ _id: userId }, { cart: 1, addresses: 1 });
      // Assuming items is an array of objects with productId and quantity properties

      // Use Promise.all to fetch prices for all products concurrently
      const pricePromises = user.cart.map(async (item) => {
        const product = await Products.findOne({ _id: item.productId }, { price: 1, category: 1 });
        return {
          productId: item.productId,
          quantity: item.quantity,
          category: product.category,
          price: product.price,
        };
      });

      let itemPrices = await Promise.all(pricePromises);

      const CategoryPromise = itemPrices.map(async (item) => {
        let category = await Category.findOne({ _id: item.category }, { name: 1, _id: 0 })
        return item.category = category.name
      });
      let category = await Promise.all(CategoryPromise);
      console.log(`catyegory is ${category}`);
      console.log(itemPrices);
      const items = itemPrices;
      const shippingAddress = user.addresses.find(addr => addr.tag == address)
      const invoice = path.join(__dirname, `../public/invoice/invoice_${paymentId}.pdf`)
      const data = { userId, paymentId, status, items, invoice, total, offer, shippingAddress, paymentMode }

      const result = await Order.create(data)
      let updatedProduct = []
      let promises = items.map(async (prod) => {
        updatedProduct = await Products.findOneAndUpdate(
          { _id: prod.productId },
          { $inc: { quantity: -prod.quantity } }, //update the quantity
          { new: true }
        );
        return updatedProduct;
      });

      await Promise.all(promises)

      let updatedCart = await User.findOneAndUpdate(
        { _id: userId },
        { $set: { cart: [] } }, //update the cart
        { new: true }
      );

      generatePdf(result._id, userId)
      return res.redirect(`/orderPage/${result._id}`)
    } catch (error) {
      console.log(error);
    }
  },


  // order managent
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

  // order Detail page
  orderPage: async (req, res) => {
    try {
      let msg = ''
      if (req.headers.referer == 'http://localhost:3000/checkout') {
        msg = "YOUR ORDER HAS BEEN PLACED"
      }
      const userId = req.session.user._id;
      const user = await User.findOne({ _id: userId });
      const oId = req.params.oId
      const order = await Order.findOne({ _id: oId });

      let products = []

      for (const prod of order.items) {
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
      res.render('orderPage', { order: order, products: products, user: user, msg: msg })

    } catch (error) {
      console.log(error);
    }
  },

  // render the user profile
  userProfile: async (req, res) => {
    try {
      const userId = req.session.user._id;
      const user = await User.findOne({ _id: userId });
      const order = await Order.find({ userId });

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
        wallet = await Wallet.create({ user: userId }, { new: true })
      }
      const balance = wallet.balance
      return res.render('user', { order: order, products: products, user: user, balance })

    } catch (error) {
      console.log(error.message);
    }
  },

  // cancell the order
  cancelOrder: async (req, res) => {
    try {
      const userId = req.session.user._id;
      const oId = req.body.oId
      const status = req.body.status
      const order = await Order.findById(oId);
      if (order.paymentMode != 'COD') {
        const wallet = await Wallet.findOne({ user: userId })
        wallet.balance += order.total
        wallet.save()
      }
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
      return res.status(200).send()
    } catch (error) {
      console.log(error);
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
