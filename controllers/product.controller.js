require('dotenv').config();
const express = require('express');
const router = express.Router();
router.use(express.json());

//modals

const Products = require('../models/productModel'); //products schema
const Category = require('../models/categoryModel'); //category schema
const ObjectId = require('mongoose').Types.ObjectId;


const productController = {
  //ALL products 
  allProducts: async (req, res) => {
    try {
      res.header('Cache-Control', 'public, max-age=3600');
      let pageNo = Number(req.body.page) ?? parseInt(req.query.pageNo) ?? 1
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
      return res.render('/client/allProducts', { pageData: data, sortBy, price })


    } catch (error) {
      console.log(error);
    }

  },
  //render products view page
  products: async (req, res) => {
    try {
      const cId = req.params.id
      if (!ObjectId.isValid(cId)) {
        return res.redirect('/notfound')
      }
      const products = await Products.find({ category: cId, listed: true });
      if (products.length < 1) {
        return res.redirect('/notfound')
      }
      let category = await Category.find({ _id: cId, listed: true });

      return res.render('/client/products', { products: products, category: category });
    } catch (error) {
      console.log(error);
    }
  },
  // render category page
  category: async (req, res) => {
    const cId = req.params.id
    if (!ObjectId.isValid(cId)) {
      return res.redirect('/notfound')
    }
    const products = await Products.find({ subCategory: cId, listed: true });

    if (products.length < 1) {
      return res.redirect('/notfound')
    }
    const category = await Category.findOne({
      'subcategory._id': cId,
      listed: true
    }, { subcategory: 1 });
    let subcategory = category.subcategory.find(sub => sub._id.equals(cId));
    subcategory = subcategory.subName;
    return res.render('/client/category', { products, subcategory });
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
            'listed': 1
          }
        },
        {
          $match: {
            'name': { $regex: regex },
            'listed': true
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
      if (!ObjectId.isValid(ID)) {
        return res.redirect('/notfound')
      }
      const user = req.session.user
      const product = await Products.findOne({ '_id': ID, listed: true });
      if (!product) {
        return res.redirect('/notfound')
      }
      return res.render('/client/productView', { product: product, user: user });
    } catch (error) {
      console.log(error);
    }

  },

  // Admin Side  

  //categoryManagement
  categoryManagement: async (req, res) => {
    try {
      const category = await Category.find({}); // Fetch fdata
      if (req.session.err) {
        err = req.session.err
        req.session.err = null
      } else {
        err = ''
      }
      return res.render('/admin/categoryManagement', { Category: category, errorMessage: err })
    }
    catch (error) {
      console.log(error);
    }
  },


  //add new catergory
  addCategory: async (req, res) => {
    try {

      let data = req.body;
      let subName = data.subName
      let subDescription = data.subDescription
      const name = data.name.toUpperCase()
      const categories = await Category.find({});//fetching the data from the db
      const existingCategory = categories.filter((item) => {
        return item.name.toUpperCase() == name//checkign if the categoryu already exists in the db
      })

      if (existingCategory.length > 0) {
        // Category with the same name already exists
        return res.render('/admin/categoryManagement', { Category: categories, errorMessage: 'Category with this name already exists.' })

      }
      let subcategory = {}
      //checking if there is one subcategory or many 
      if (Array.isArray(subName)) {
        //joining the name and description of subcaegory
        subName = subName.filter(item => item !== '');
        subName = [...new Set(subName.map(item => item.toLowerCase()))];
        subDescription = subDescription.filter(item => item !== '');
        subcategory = subName.map((value, i) => {
          return { subName: value, subDescription: subDescription[i] }
        })
      } else {
        subcategory = { subName: subName, subDescription: subDescription }
      }
      data.subcategory = subcategory
      const imagePaths = req.files.map((file) => file.path.substring(6));//removing public/from adderees
      data.image = imagePaths;
      delete data.subDescription;
      delete data.subName;
      const category = await Category.create(data);//adding the data
      if (category) {

        return res.redirect('/admin/categoryManagement');
      }
    } catch (error) {
      console.log(error);
    }
  },


  deleteCatImage: async (req, res) => {
    try {
      const imageIndex = req.body.imageIndex
      const cId = req.body.cId

      const category = await Category.findById(cId)
      category.image.splice(imageIndex, 1)
      category.save()
      return res.status(200).send()
    } catch (error) {
      console.log(error);
    }
  },

  // update the category
  updateCategory: async (req, res) => {
    try {

      const id = req.body.id
      const updatedData = { ...req.body }
      // checking wheather the category name already exists
      const name = updatedData.name.toUpperCase()
      const categories = await Category.find({});//fetching the data from the db
      const existingCategory = categories.filter((item) => {
        return item.name.toUpperCase() == name && !(item._id.equals(updatedData.id)) //checkign if the categoryu already exists in the db
      })
      let imagePaths
      if (existingCategory.length > 0) {
        // Category with the same name already exists
        return res.render('/admin/categoryManagement', { Category: categories, errorMessage: 'Category with this name already exists.' })

      }
      let subName = updatedData.subName //extracting subcategory data to make it one object
      let subDescription = updatedData.subDescription
      let subcategory = {}
      delete updatedData.subDescription;
      delete updatedData.subName;

      //cheking if the file exists
      if (req.files) {

        imagePaths = req.files.map((file) => file.path.substring(6));//removing public/from adderees

        //removing public/from adderees

      }
      let result
      //check if subcategory exists
      if (subName) {

        // checking if only one sub category awailable or many
        if (Array.isArray(subName)) {
          subName = subName.filter(item => item !== '');
          subName = [...new Set(subName.map(item => item.toLowerCase()))];
          subDescription = subDescription.filter(item => item !== '');
          //joining the name and description of subcaegory
          subcategory = subName.map((value, i) => {
            return { subName: value, subDescription: subDescription[i] }
          })
          updatedData.subcategory = subcategory;
          let updateObject = {
            $set: { ...updatedData },
          };

          if (imagePaths && imagePaths.length > 0) {
            updateObject.$push = { image: { $each: imagePaths } };
          }
          result = await Category.findOneAndUpdate(
            { _id: id },
            updateObject,
            {
              new: true, // To return the updated document
              upsert: true, // Create a new document if it doesn't exist
            }
          );
        } else {
          subcategory = { subName: subName, subDescription: subDescription }//add oly one data
          updatedData.subcategory = subcategory;
          let updateObject = {
            $set: { ...updatedData },
          };

          if (imagePaths && imagePaths.length > 0) {
            updateObject.$push = { image: { $each: imagePaths } };
          }
          result = await Category.findOneAndUpdate(
            { _id: id },
            updateObject,
            {
              new: true, // To return the updated document
              upsert: true, // Create a new document if it doesn't exist
            }
          );
        }

      } else {
        //if no sub awailaale
        let updateObject = {
          $set: { ...updatedData },
        };

        if (imagePaths && imagePaths.length > 0) {
          updateObject.$push = { image: { $each: imagePaths } };
        }
        result = await Category.findOneAndUpdate(
          { _id: id },
          updateObject,
          {
            new: true, // To return the updated document
            upsert: true, // Create a new document if it doesn't exist
          }
        );
      }
      if (!result) {
        return res.status(401).send("not found");
      } else {
        console.log('category updated');
        return res.redirect('/admin/categoryManagement');
      }
    } catch (err) { console.log(err) }

  },


  //delete category
  deleteCategory: async (req, res) => {
    try {
      const categoryId = req.params.id;
      const category = await Category.updateOne({ _id: categoryId }, { $set: { listed: false } });
      const products = await Products.updateMany({ category: categoryId }, { $set: { quantity: 0, listed: false } });
      if (!category || !products) {
        return res.status(404).json({ error: 'category not found' });
      }
      return res.redirect('/admin/categoryManagement');
    } catch (error) {
      console.error(error);
      return res.status(500).json({ error: 'Internal Server Error' });
    }
  },

  // productManagement
  productManagement: async (req, res) => {
    try {
      const products = await Products.find({}); // Fetch product data
      const category = await Category.find({});
      let err
      if (req.session.err) {
        err = req.session.err
        req.session.err = null
      } else {
        err = ''
      }
      res.render('/admin/productManagement', { products: products, category: category, err: err })
    }
    catch (err) {
      console.log(err);
    }
  },

  //get sub category
  getSubcategory: async (req, res) => {
    try {
      const categoryId = req.params.cId;

      const category = await Category.findOne({ _id: categoryId });
      if (!category) {
        return res.status(404).json({ error: 'Category not found' });
      }

      const subcategories = category.subcategory;
      return res.status(200).json({ subcategories });
    } catch (error) {
      console.error(error);
      return res.status(500).json({ error: 'Internal Server Error' });
    }
  },

  // add new product
  addProduct: async (req, res) => {
    try {
      const data = req.body;
      const imagePaths = req.files.map((file) => file.path.substring(6));
      data.images = imagePaths;
      const product = await Products.create(data);
      if (product) {

        return res.redirect('/admin/productManagement');
      }
    } catch (error) {
      console.log(error);
    }
  },

  // edit product Page
  editProductPage: async (req, res) => {
    try {
      const pId = req.params.pid
      const category = await Category.find({});
      const products = await Products.find({ _id: pId })
      const product = products[0]
      let err

      if (req.session.err) {
        err = req.session.err
        req.session.err = null
      } else {
        err = ''
      }
      return res.render('/admin/editProduct', { product: product, category: category, err: err })
    }
    catch (error) {
      console.log(error);
    }
  },

  // remove image from category
  removeImage: async (req, res) => {
    try {
      const imageUrl = req.body.imageName
      const pId = req.body.pId

      const product = await Products.findById(pId)
      product.images.splice(imageUrl, 1)
      product.save()
      return res.status(200).send()
    } catch (error) {
      console.log(error);
    }
  },

  // edit the product
  editProduct: async (req, res) => {
    try {
      const data = req.body;
      const id = data.id
      delete data.id

      let product

      if (req.files && req.files.length > 0) {
        const imagePaths = req.files.map((file) => file.path.substring(6));
        product = await Products.updateOne(
          { _id: id },
          { $push: { images: { $each: imagePaths } }, $set: { ...data } },
          { new: true }
        );
      } else {


        product = await Products.updateOne(
          { _id: id },
          { $set: { ...data } },
          { new: true }
        );
      }



      if (product) {

        return res.redirect('/admin/productManagement');
      }
    } catch (error) {
      console.log(error);
    }

  },

  // delete the products
  deleteProduct: async (req, res) => {
    try {

      const productId = req.params.id;

      const result = await Products.updateOne({ _id: productId }, { $set: { quantity: 0, listed: false } });
      if (!result) {
        return res.status(404).json({ error: 'Product not found' });
      }
      return res.redirect('/admin/productManagement');
    } catch (error) {
      console.error(error);
      return res.status(500).json({ error: 'Internal Server Error' });
    }
  },

}

module.exports = productController