const nodemailer = require('nodemailer')
//sending OTP through mail
const sendOTP = async (name, email, otp) => {
    try {
      const transporter = nodemailer.createTransport({
        service: 'gmail',
        port: 587,
        secure: false,
        requireTLS: true,
        host: 'smtp.gmail.com',
        auth: {
          user: 'eatables.bitdrag@gmail.com',
          pass: process.env.SMTP_KEY
        }
      });
      let info = await transporter.sendMail({
        from: 'eatables.bitdrag@gmail.com',
        to: `${email}`,
        subject: 'OTP for verification',
        html: `<h1>Hy ${name}</h1><br><p>Your OTP for the verification is <h2>${otp}</h2></p>`,
      });
      return info
  
    } catch (error) {
      console.log(error);
    }
  }

  module.exports=sendOTP