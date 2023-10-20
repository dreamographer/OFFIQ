require('dotenv').config();
const express = require('express');
const router = express.Router();
router.use(express.json());

//modals

const Products = require('../models/productModel'); //products schema
const Category = require('../models/categoryModel'); //category schema



const productController = {
  //ALL products 
  allProducts: async (req, res) => {
    try {
      let pageNo =Number(req.body.page)??parseInt(req.query.pageNo)??1
      let size = 10
      let query = {}
      // let category = req.body.category
      let price = req.body.price ?? 0
      let sortBy = req.body.sort ?? "name"
      let data
      // price filter
      switch (price) {
        case '0': {
          query = {}

          break;
        }
        case '1': {
          query = {
            price: {
              $lte: 500
            }
          }

          break;
        }
        case '2': {
          query = {
            price: {
              $gte: 500,
              $lte: 1500
            }
          }
          break;
        }
        case '3': {
          query = {
            price: {
              $gte: 1500,
              $lte: 2000
            }
          }
          break;
        }
        case '4': {
          query = {
            price: {
              $gte: 2000,
            }
          }
          break;
        }
      }

      if (pageNo < 0 || pageNo === 0) {
        response = { "error": true, "message": "invalid page number, should start with 1" };
        return res.json(response)
      }
      let query1 = {}
      query1.skip = size * (pageNo - 1)
      query1.limit = size
      if (sortBy == 'name') {
        data = await Products.paginate(query, { offset: query1.skip, limit: query1.limit, sort: { 'name': 1 } })

      } else if (sortBy == 'price') {
        data = await Products.paginate(query, { offset: query1.skip, limit: query1.limit, sort: { 'price': 1 } })

      } else if (sortBy == 'date') {
        data = await Products.paginate(query, { offset: query1.skip, limit: query1.limit, sort: { 'createdAt': 1 } })

      }
      return res.render('allProducts', { pageData: data, sortBy, price })


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

  }

}

module.exports = productController