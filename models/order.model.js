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
    shippingAddress: {
        type: String, //chechk the data type
        required: false
    },
    paymentMode: {
        type: String,
        required: true
    }, 
}, {
    timestamps: true
});


module.exports = mongoose.model('Order', orderSchema, 'order');
