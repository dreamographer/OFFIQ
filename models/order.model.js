const mongoose = require('mongoose');
const { Schema } = mongoose;
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
    price:{
        type: Number,
        required: true,
    },
    category:{
        type:String,
        required:true
    }
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
    pin: {
        type: Number,
        match: /^\d{6}$/,
    },
});
const orderSchema = new Schema({
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    paymentId: {
        type: String,
        required: true
    },
    items: [cartItemSchema],
    total: {
        type: Number,
        required: true
    },
    status: {
        type: String,
        required: true
    },
    invoice: {
        type: String,
        // required: true
    },
    offer:{
        type: String,
    },
    shippingAddress: addressSchema,
    paymentMode: {
        type: String,
        required: true
    }, 
}, {
    timestamps: true
});


module.exports = mongoose.model('Order', orderSchema, 'order');
