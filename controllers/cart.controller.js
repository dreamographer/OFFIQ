require('dotenv').config();
const express = require('express');
const router = express.Router();
router.use(express.json());


//modals
const User = require('../models/user.models'); //user schema
const googelUser = require('../models/emailUserModel');//schema for google auth users
const Products = require('../models/productModel'); //products schema
const Coupon = require('../models/couponModel');//coupon schema

const cartController = {
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
          const pId = prod.productId
          const item = await Products.findOne({ _id: pId, listed: true });
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

      return res.render('client/cart', { cart: cart, products: products, msg: msg });
    } catch (error) {
      console.log(error);
    }
  },

  // add to cart
  addToCart: async (req, res) => {
    try {
      const productId = req.body.productId;
      const quantity = req.body.quantity ?? 1;
      const userId = req.session.user._id;
      if (!userId) {
        return res.status(401).json({ message: 'User not authenticated' });
      }
      const updatedProduct = await Products.findOne(
        { _id: productId, quantity: { $gte: quantity }, listed: true },
        // { $inc: { quantity: -quantity } }, update the quantity
        { new: true }
      );
      if (!updatedProduct) {
        return res.status(400).json({ message: 'Product out of stock' });
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
      if (coupon) {
        if (total < coupon.minimumPurchase) {
          return res.send({ error: `Minimum purchase value is ${coupon.minimumPurchase}` })
        }
        return res.send({ type: coupon.discountType, value: coupon.discountValue ,id:coupon._id})
      } else {
        return res.send({ error: 'Invalid Code' })
      }



    } catch (error) {
      console.log(error);
    }
  },



}
module.exports = cartController