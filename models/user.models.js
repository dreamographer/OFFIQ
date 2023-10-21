const mongoose = require('mongoose');
const wishlistSchema = new mongoose.Schema({
    productId: {
      type: mongoose.Schema.Types.ObjectId, 
      ref: 'Product', // Reference to the Product model
      required: true,
      
    }
  });
const cartItemSchema = new mongoose.Schema({
    productId: {
      type: mongoose.Schema.Types.ObjectId, 
      ref: 'Product', // Reference to the Product model
      required: true,
    }, 
    quantity: {
      type: Number,
      required: true,
      min: 1, // Ensure quantity is at least 1
    },
  });
const addressSchema = new mongoose.Schema({
    addressLine1: {
        type: String,
        required: true
    },
    city: {
        type: String,
        required: true
    },
    tag: {
        type: String,
        required: true
    },
    pin: {
        type: Number,
        match: /^\d{6}$/,
    },
});
const userSchema = new mongoose.Schema({
    fullname: {
        type: String,
        required: true
    },
    otp: {
        type: String,
    },
    otpExpires: {
        type: Date,
    },
    verified: {
        type: Boolean,
        default: false
    },
    blocked: {
        type: Boolean,
        default: false
    },
    googleAuth: {
        type: Boolean,
        default: false
    },
    email: {
        type: String,
        required: true,
        unique: true,
        trim: true,
        match: /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/, // Regular expression for email validation
    },
    phone: {
        type: Number,
        required: true,
        match: /^\d{10}$/,
    },
    password: {
        type: String,
        required: true
    },
    profileUrl: {
        type: String,
    },
    addresses: [addressSchema], // Array of embedded address objects
    cart:[cartItemSchema],
    wishlist:[wishlistSchema],
},{ timestamps: true });
module.exports = mongoose.model('User', userSchema, 'user') 
