require('dotenv').config();
const express = require('express');
const router = express.Router();
router.use(express.json());
const path = require('path');
const crypto = require('crypto');  //encription module

//modals
const User = require('../models/user.models'); //user schema
const Products = require('../models/productModel'); //products schema
const Category = require('../models/categoryModel'); //category schema
const Order = require('../models/order.model'); //order schema
const Wallet = require('../models/WalletModel')//Wallet schma

// helpers
const makePdf = require('../helpers/PdfGenerator') //pdf Generation

// Razorpay
const { RAZORPAY_ID_KEY, RAZORPAY_SECRET_KEY } = process.env
const Razorpay = require('razorpay')
let instance = new Razorpay({ key_id: RAZORPAY_ID_KEY, key_secret: RAZORPAY_SECRET_KEY })

// genrate invoice Pdf
async function generatePdf(oId, uId) {
    const user = await User.findById(uId)
    const order = await Order.findOne({ _id: oId });
    let products = []

    for (const prod of order.items) {
        try {
            const item = await Products.findById(prod.productId);

            if (item) {
                // Check if product already exists in the array
                const productExists = products.some(product => product._id.toString() === item._id.toString());

                // If product does not exist in the array, push it
                if (!productExists) {
                    products.push(item);
                }
            } else {
                console.log(`Product not found for ID: ${prod.productId}`);
            }
        } catch (error) {
            console.error(`Error fetching product: ${error}`);
        }
    }
    let invoice = {  //data given
        shipping: {
            name: user.fullname,
            address: order.shippingAddress.addressLine1,
            city: order.shippingAddress.city,
            postal_code: order.shippingAddress.pin
        },
        items: [],
        subtotal: order.total * 100,
        discount: order.offer,
        invoice_nr: order._id,
        payment_id: order.paymentId
    };

    products.forEach((product, i) => {
        invoice['items'].push({
            item: product.name,
            quantity: order.items[i].quantity,
            amount: order.items[i].price * 100,
        })
    });

    let path = 'test.pdf'
    makePdf(invoice, order.invoice)
}

const orderController = {

    // genreate order id in razorpay
    GenerateOrder: async (req, res) => {
        try {
            const amount = Number(req.body.amount)
            //RaZor Pay
            instance.orders.create({
                amount: amount,
                currency: "INR",
                receipt: "receipt#1"
            }).then(order => {
                return res.send({ orderId: order.id })
            })


        } catch (error) {
            console.log(error);
        }
    },

    //checkout page
    checkOut: async (req, res) => {
        try {
            const sum = req.body.sum
            let offer = req.body.offer ?? ''
            const userId = req.session.user._id;
            if (!userId) {
                return res.redirect('/')
            }
            const user = await User.findOne({ _id: userId }, { cart: 1, addresses: 1, wallet: 1 });
            const addresses = user.addresses
            const cart = user.cart;

            const products = [];
            for (const prod of cart) {
                try {
                    const item = await Products.findById(prod.productId);
                    if (prod.quantity > item.quantity) {
                        req.app.locals.data = "GIVEN QUANTITY NOT AVAILABLE"
                        return res.redirect('/cart')
                    }
                    if (item) {
                        products.push(item);
                    } else {
                        //  product with the given ID is not found
                        console.log(`Product not found for ID: ${prod.productId}`);
                    }
                } catch (error) {
                    // Handle any errors that occur during product fetching
                    console.error(`Error fetching product: ${error}`);
                }
            }
            const wallet = await Wallet.findOne({ user: userId })
            return res.render('/client/checkout', { cart: cart, products: products, address: addresses, sum: sum, offer: offer, wallet: wallet.balance, errorMessage: '' });
        } catch (error) {
            console.log(error);
        }
    },

    // order
    order: async (req, res) => {
        try {
            const userId = req.session.user._id;
            let status
            let paymentId
            let total, address, paymentMode, offer

            if (req.body.razorpay_payment_id) {
                // online payment
                let order = await instance.payments.fetch(req.body.razorpay_payment_id)
                total = Number(order.amount) / 100
                if (order.notes.address == '') {
                    return res.send('please select one address')
                }
                address = order.notes.address
                paymentMode = order.method
                status = 'confirmed'
                paymentId = order.id
                offer = order.notes.offer ?? ''
            } else {
                if (!req.body.address) {
                    return res.send('please select one address')
                }
                if (req.body.paymentMode == 'Wallet') {
                    total = Number(req.body.total.substring(1))
                    const wallet = await Wallet.findOne({ user: userId })

                    if (wallet.length <= 0) {
                        const succes = Wallet.create({ user: userId }, { new: true })
                    }
                    else if (wallet.balance - total < 0) {
                        return res.send("Not enough balance")
                    } else {
                        wallet.balance = wallet.balance - total
                        wallet.save()
                    }
                }
                // COD
                total = Number(req.body.total.substring(1))
                offer = req.body.offer ?? ''
                address = req.body.address
                paymentMode = req.body.paymentMode
                status = 'confirmed'
                paymentId = crypto.randomBytes(3).toString('hex')
            }
            const user = await User.findOne({ _id: userId }, { cart: 1, addresses: 1 });
            // Assuming items is an array of objects with productId and quantity properties

            // Use Promise.all to fetch prices for all products concurrently
            const pricePromises = user.cart.map(async (item) => {
                const product = await Products.findOne({ _id: item.productId }, { price: 1, category: 1 });
                return {
                    productId: item.productId,
                    quantity: item.quantity,
                    category: product.category,
                    price: product.price,
                };
            });

            let itemPrices = await Promise.all(pricePromises);

            const CategoryPromise = itemPrices.map(async (item) => {
                let category = await Category.findOne({ _id: item.category }, { name: 1, _id: 0 })
                return item.category = category.name
            });
            let category = await Promise.all(CategoryPromise);
            const items = itemPrices;
            const shippingAddress = user.addresses.find(addr => addr.tag == address)
            const invoice = path.join(__dirname, `../public/invoice/invoice_${paymentId}.pdf`)
            const data = { userId, paymentId, status, items, invoice, total, offer, shippingAddress, paymentMode }

            const result = await Order.create(data)
            let updatedProduct = []
            let promises = items.map(async (prod) => {
                updatedProduct = await Products.findOneAndUpdate(
                    { _id: prod.productId },
                    { $inc: { quantity: -prod.quantity } }, //update the quantity
                    { new: true }
                );
                return updatedProduct;
            });

            await Promise.all(promises)

            let updatedCart = await User.findOneAndUpdate(
                { _id: userId },
                { $set: { cart: [] } }, //update the cart
                { new: true }
            );

            generatePdf(result._id, userId)
            return res.redirect(`/orderPage/${result._id}`)
        } catch (error) {
            console.log(error);
        }
    },


    // order managent
    orderManagement: async (req, res) => {
        try {
            const order = await Order.find({});

            let products = []
            for (const ord of order) {
                for (const prod of ord.items) {
                    try {
                        const item = await Products.findById(prod.productId);

                        if (item) {
                            // Check if product already exists in the array
                            const productExists = products.some(product => product._id.toString() === item._id.toString());

                            // If product does not exist in the array, push it
                            if (!productExists) {
                                products.push(item);
                            }
                        } else {
                            console.log(`Product not found for ID: ${prod.productId}`);
                        }
                    } catch (error) {
                        console.error(`Error fetching product: ${error}`);
                    }
                }
            }

            return res.render('/admin/orderManagement', { order: order, products: products })

        } catch (error) {
            console.log(error);
        }
    },

    // order Detail page
    orderPage: async (req, res) => {
        try {
            let msg = ''
            if (req.headers.referer == 'https://www.offiq.shop/checkout') {
                msg = "YOUR ORDER HAS BEEN PLACED"
            }
            const userId = req.session.user._id;
            const user = await User.findOne({ _id: userId });
            const oId = req.params.oId
            if (!ObjectId.isValid(oId)) {
                return res.redirect('/notfound')
            }
            const order = await Order.findOne({ _id: oId });
            if (!order) {
                return res.redirect('/notfound')
            }

            let products = []

            for (const prod of order.items) {
                try {
                    const item = await Products.findById(prod.productId);

                    if (item) {
                        // Check if product already exists in the array
                        const productExists = products.some(product => product._id.toString() === item._id.toString());

                        // If product does not exist in the array, push it
                        if (!productExists) {
                            products.push(item);
                        }
                    } else {
                        console.log(`Product not found for ID: ${prod.productId}`);
                    }
                } catch (error) {
                    console.error(`Error fetching product: ${error}`);
                }
            }
            res.render('/client/orderPage', { order: order, products: products, user: user, msg: msg })

        } catch (error) {
            console.log(error);
        }
    },
    // cancell the order
    cancelOrder: async (req, res) => {
        try {
            const userId = req.session.user._id;
            const oId = req.body.oId
            const status = req.body.status
            const order = await Order.findById(oId);
            if (order.paymentMode != 'COD') {
                const wallet = await Wallet.findOne({ user: userId })
                wallet.balance += order.total
                wallet.save()
            }
            for (const item of order.items) {
                const productId = item.productId;
                const quantity = item.quantity;

                // Find the corresponding product and update its quantity
                await Products.findByIdAndUpdate(
                    productId,
                    { $inc: { quantity: quantity } },
                );
            }
            order.status = status
            order.save()
            return res.status(200).send()
        } catch (error) {
            console.log(error);
        }
    },

    // admin side

    // order management
    orderManagement: async (req, res) => {
        try {
            const order = await Order.find({});

            let products = []
            for (const ord of order) {
                for (const prod of ord.items) {
                    try {
                        const item = await Products.findById(prod.productId);

                        if (item) {
                            // Check if product already exists in the array
                            const productExists = products.some(product => product._id.toString() === item._id.toString());

                            // If product does not exist in the array, push it
                            if (!productExists) {
                                products.push(item);
                            }
                        } else {
                            console.log(`Product not found for ID: ${prod.productId}`);
                        }
                    } catch (error) {
                        console.error(`Error fetching product: ${error}`);
                    }
                }
            }
            return res.render('/admin/orderManagement', { order: order, products: products })

        } catch (error) {
            console.log(error);
        }
    },

    // oderpage
    orderPage: async (req, res) => {
        try {

            const oId = req.params.oId
            const order = await Order.find({ _id: oId });

            let products = []
            for (const ord of order) {
                for (const prod of ord.items) {
                    try {
                        const item = await Products.findById(prod.productId);

                        if (item) {
                            // Check if product already exists in the array
                            const productExists = products.some(product => product._id.toString() === item._id.toString());

                            // If product does not exist in the array, push it
                            if (!productExists) {
                                products.push(item);
                            }
                        } else {
                            console.log(`Product not found for ID: ${prod.productId}`);
                        }
                    } catch (error) {
                        console.error(`Error fetching product: ${error}`);
                    }
                }
            }
            res.render('/admin/orderPageAdmin', { order: order[0], products: products })

        } catch (error) {
            console.log(error);
        }
    },

    //updata status
    updateStatus: async (req, res) => {
        try {
            const oId = req.body.oId
            const status = req.body.status
            const order = await Order.findById(oId);
            for (const item of order.items) {
                const productId = item.productId;
                const quantity = item.quantity;
                // Find the corresponding product and update its quantity
                await Products.findByIdAndUpdate(
                    productId,
                    { $inc: { quantity: quantity } },
                );
            }
            order.status = status
            order.save()
            return res.status(200).json("updated")
        } catch (error) {
            console.log(error);
        }
    },
}

module.exports = orderController