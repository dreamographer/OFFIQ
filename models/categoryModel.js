const mongoose = require('mongoose');

const subcategorySchema = new mongoose.Schema({
  subName: {
    type: String,
    required: true,
  },
  subDescription: {
    type: String,
    required: true,
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
  image: {
    type: String,
    required: true
  },
  subcategory: [subcategorySchema], // Array of subcategory objects
});


module.exports = mongoose.model('Category', categorySchema,'category');