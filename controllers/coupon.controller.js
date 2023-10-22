const Coupon = require('../models/couponModel');//coupon schema
const couponController = {

  // coupon Mangement
  couponManagement: async (req, res) => {
    try {
      const coupons = await Coupon.find();
      if (req.app.locals.data) {

        err = req.app.locals.data
        req.app.locals.data = null
      } else {
        err = ''
      }
      return res.render('/admin/couponManagement', { coupons: coupons, errorMessage: err })

    } catch (error) {
      console.log(error);
    }
  },

  // add coupon
  addCoupon: async (req, res) => {
    try {

      let data = req.body
      const coupons = await Coupon.findOne({ couponCode: data.couponCode });
      if (coupons) {
        req.app.locals.data = 'Coupon Name already exist';
        return res.redirect(`/admin/couponManagement`)
      }
      let end = new Date(req.body.endDate);
      let start = new Date(req.body.startDate);

      if (start > end) {
        req.app.locals.data = 'The end date should be after the start date';
        return res.redirect(`/admin/couponManagement`)
      } else if (start == end) {
        req.app.locals.data = 'Minimun one day should be there';
        return res.redirect(`/admin/couponManagement`)
      }
      let newCoupon = new Coupon({
        couponCode: data.couponCode,
        description: data.description,
        discountType: data.discountType,
        discountValue: data.discountValue,
        minimumPurchase: data.minimumPurchase,
        startDate: data.startDate,
        endDate: data.endDate
      })

      const coupon = Coupon.create(newCoupon)

      return res.redirect(`/admin/couponManagement`)
    } catch (error) {

      console.log(error);
    }
  },

  // edit coupon
  editCoupon: async (req, res) => {
    try {
      const cId = req.body.id
      let data = req.body
      const coupons = await Coupon.findOne({ couponCode: data.couponCode });

      let end = new Date(req.body.endDate);
      let start = new Date(req.body.startDate);

      if (start > end) {
        req.app.locals.data = 'The end date should after start date';
        return res.redirect(`/admin/couponManagement`)
      } else if (start > end) {
        req.app.locals.data = 'Minimun one day should be there';
        return res.redirect(`/admin/couponManagement`)
      }
      delete data.id
      let coupon = await Coupon.findByIdAndUpdate(cId, data, { new: true })
      return res.redirect(`/admin/couponManagement`)
    } catch (error) {
      console.log(error);
    }
  },

  // delete the coupon
  deleteCoupon: async (req, res) => {
    try {
      const id = req.params.id;
      const deletedCoupon = await Coupon.deleteOne({ "_id": id })

      return res.redirect('back')
    } catch (error) {
      console.log(error);
    }
  },

}

module.exports = couponController