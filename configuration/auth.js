const passport = require('passport');
const localStrategy = require('passport-local').Strategy;
const bcrypt = require('bcryptjs');
const Member = require('../model/member');

passport.use( new localStrategy ({usernameField: 'email' || 'username'}, (email, password, done) => {
    //Check if email exist
    Member.findOne({email:email || username}, (err, docs) => {
        if (err) {throw err};
        if (!docs) {
            return done(null, false, {message: 'Email not registered'})
        }

        //Compare Password
        bcrypt.compare(password, docs.password, (err, isMatch)=> {
            if (err) {throw err};
            if (isMatch) {
                return done(null, docs)
            } else {
                return done(null, false, {message: 'Incorrect Password'})
            }
        })
    })
    passport.serializeUser((docs, done) => {
        done(null, docs.id);
    })
    passport.deserializeUser((id, done) => {
        Member.findById(id, (err, docs) => {
            done(err, docs)
        })
    })
}))

module.exports = passport;