const mongoose = require('mongoose');

const couponSchema = new mongoose.Schema({
  couponCode: {
    type: String,
    required: true,
    unique: true, // Ensure coupon codes are unique
  },
  description: {
    type: String,
    required: true,
  },
  discountType: {
    type: String,
    enum: ['Percentage', 'Fixed Amount'], // Assuming two types of discounts
    required: true,
  },
  discountValue: {
    type: Number,
    required: true,
  },
  minimumPurchase: {
    type: Number,
    default: 0, // Assuming a default value of 0 if not provided
  },
  startDate: {
    type: Date,
    required: true,
  },
  endDate: {
    type: Date,
    required: true,
  },
});

module.exports = mongoose.model('Coupon', couponSchema);
