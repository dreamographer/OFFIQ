const mongoose = require('mongoose');

const subcategorySchema = new mongoose.Schema({
  subName: {
    type: String,

  },
  subDescription: {
    type: String,

  },
  parentCategory: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Category',
  },
});

const categorySchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
  },
  description: {
    type: String,
    required: true,
  },
  image: [{
    type: String,
    required: true
  }],
  listed: {
    type: Boolean,
    required: true,
    default: true
  },
  subcategory: [subcategorySchema], // Array of subcategory objects
});


module.exports = mongoose.model('Category', categorySchema, 'category');