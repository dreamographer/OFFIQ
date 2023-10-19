require('dotenv').config();
const passport = require('passport')
const user = require('../models/emailUserModel')
const GoogleStrategy = require('passport-google-oauth20').Strategy;
const Wallet = require('../models/WalletModel')//Wallet schma
passport.use(new GoogleStrategy({
  clientID: process.env.GOOGLE_CLIENT_ID,
  clientSecret: process.env.GOOGLE_CLIENT_SECRET,
  callbackURL: "http://localhost:3000/auth/google/callback"
},
  async function (accessToken, refreshToken, profile, done) {
    // Retrieve user data from the profile object
    const email = profile._json.email
    const User = await user.findOne({ email },{addresses:0,cart:0,wishlist:0}); //data from the DB
    if (User) {
      if (User.blocked) {
        const user = "blocked"
        return done(null, user);
      } else {
        return done(null, User);
      }
    } else {
      const fullName = profile._json.name;
      const profileUrl = profile._json.picture;
      try {
        const newUser = new user({
          email: email,
          fullname: fullName,
          profileUrl: profileUrl,
          verified: true
        });
        newUser.save()
          .then(async () => {
            console.log(newUser._id);
            const wallet = await Wallet.create({ user: newUser._id }, { new: true }) //creating wallet
            console.log(wallet);
            console.log("User data stored in MongoDB");
            return done(null, newUser);
          })
          .catch((error) => {
            console.error("Error storing user data:", error);
            return done(error, null);
          });
      } catch (error) {
        console.log(error);
      }
    }

  }
));
passport.serializeUser((user, done) => {
  done(null, user)
});

passport.deserializeUser((user, done) => {
  done(null, user)
});