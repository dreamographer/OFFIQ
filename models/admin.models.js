const mongoose = require('mongoose');
const adminSchema = new mongoose.Schema( {
    fullname: {
        type: String,
        required: true
    },
    email: {
        type: String,
        required: true,
        unique: true,
        trim: true,
        match: /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/, // Regular expression for email validation
    },
    password: {
        type: String,
        required: true
    },
    otp: {
        type: String,
    },
    otpExpires: {
        type: Date,
    },
    profileUrl: {
        type: String,
    },
}, { timestamps: true });

module.exports = mongoose.model('Admin',adminSchema,'admin') 