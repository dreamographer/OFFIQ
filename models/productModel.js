const mongoose = require('mongoose');
const { Schema } = mongoose;

const productSchema = new Schema({
  name: {
    type: String,
    required: true
  },
  description: {
    type: String,
    required: true
  },
  category: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Category',
    required: true
  },
  price: {
    type: Number,
    required: true
  },
  quantity: {
    type: Number,
    required: true
  },
  rating: {
    type: Number,
    required: true
  },
  images: [{
    type: String,
    required: true
  }],
  offers: {
    type: String,
    required: false
  }
}, {
  timestamps: true
});


module.exports = mongoose.model('Products', productSchema,'products');
