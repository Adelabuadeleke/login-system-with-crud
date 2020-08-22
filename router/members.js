const express = require('express');
const router = express.Router();
const bodyParser = require('body-parser');
const bcrpyt = require('bcryptjs');
const Member = require('../model/member');
const passport = require('passport');
const {ensureAuth} = require('../configuration/ensureAuth');

//Body Parser middleware
let urlencoded = bodyParser.urlencoded( { extended: false } );
let jsonParser = bodyParser.json();


//Get Register Route
router.get('/register', (req, res) => {
    res.render('register');
})

//Get Login Route
router.get('/login', (req, res) => {
    res.render('login');
})

//Reset Password
router.get('/reset_password', (req, res) => {
    res.render('reset_password');
})

//Logout User
router.get('/logout', (req, res) => {
    req.logOut();
    req.flash('successMsg', 'You are logged out!');
    res.redirect('/');
})

//Get member dashboard
router.get('/dashboard', ensureAuth, (req, res) => {
    res.render('member/member_log', {loggedUser: req.user.username});
})

// Get Member profile
router.get('/view_profile', ensureAuth, (req, res) => {
    const {firstName, lastName, occupation, gender, bio} = req.user.userProfile;
    res.render('member/view_profile', {lastname:lastName, 
        firstname:firstName, 
        gender:gender, 
        bio:bio, 
        occupation:occupation, 
        loggedUser:req.user.username
    });
})

//Get all members
router.get('/all_member', ensureAuth, (req, res) => {
    Member.find({}, (err, docs) => {
        if (err) {throw err};
        res.render('member/member_view', {member: docs});
    })
})

//Get Edit View
router.get('/edit_profile', ensureAuth, (req, res) => {
    const {firstName, lastName, occupation, bio, dob} = req.user.userProfile;
    res.render('member/edit_profile', {lastname:lastName, 
        firstname:firstName,  
        bio:bio, 
        occupation:occupation, 
        dob:dob
    })
})

//Get new password
//router.get('/new_password', (req, res) => {

//})

//reset password || check first if username or email is registered
router.post('/reset_password', urlencoded, (req, res) => {
    let query = req.body.reset_query;
    let errors = [];
    //Search DB if record exists
    Member.find({ $or: [{username:query}, {email:query}] }, (err, docs) => {
        if (err) {
            console.log(err)
        }
        if (docs.length == 0) { // If there is no record
            errors.push({msg: 'No record found'});
            res.render('reset_password', {errors:errors})
        } else if (docs[0].username == 'admin' || docs[0].email == 'me@admin.com') { // Protect the admin
            errors.push({msg: 'Access Denied!!!'});
            res.render('reset_password', {errors:errors})
        } else { //If record is found
            res.render('new_password', {member:docs})
        }
    })
})

//Change Password
router.post('/new_password', urlencoded, (req, res) => {
    const usernameId = req.body.username;
    let password = req.body.password;

    //Hash Password
    bcrpyt.genSalt(10, (err, salt) => {
        bcrpyt.hash(password, salt, (err, hash) => {
            if (err) {console.log(err);}
            password = hash;

            //Save new password to DB
            Member.findOneAndUpdate({username:usernameId}, {password:password}, (err, result) => {
                if (err) {console.log(err);}
                console.log(password);
                req.flash('successMsg', 'Password changed');
                res.redirect('/member/login');
            })
        })
    })

})

//Post and Save New Member into DB
router.post('/register', urlencoded, (req, res)=> {
    // Get data
    const {username, email, password, password2} = req.body;

    //Errors Array
    let errors = [];

    //Form Validations
    //Check form field
    if (!username || !email || !password || !password2) {
        errors.push({msg: 'Please fill in all data'});
    }

    //Check Password Match 
    if (password !== password2) {
        errors.push({msg: 'Passwords do not match'});
    }

    //Check Password length
    if (password.length < 5) {
        errors.push({msg: 'Password must not be less than five characters'})
        res.render('new_password', {errors:errors})
    }
  
    // Check if the above validation passes and perform a further validation in DB for existing username and email
    // If there is error
    if (errors.length !== 0) {
        res.render('register', {errors:errors, username:username, email:email})
    } else { //If no error, perform a further check in DB for username and email

        Member.find({ $or: [{username:username}, {email:email}] }, (err, docs) => {
            if (err) {throw err}
            // If no Match the docs will return an array length of zero
            if (docs.length == 0) {
                // Create a New Model Member
                const newMember = new Member;
                newMember.username = username;
                newMember.email = email;
                newMember.password = password;

                //encrypt/hash password
                bcrpyt.genSalt(10, (err, salt) => {
                    bcrpyt.hash(newMember.password, salt, (err, hash) => {
                        if (err) {throw err};
                        newMember.password = hash;

                        //Save new member to DB
                        newMember.save((err) => {
                            if (err) {
                                console.log (err);
                            } else {
                                console.log(`New member with details: ${newMember} successfully added to Database`);
                                req.flash('successMsg', 'Registration sucessful, log in');
                                res.redirect('/member/login');
                            }
                        })
                    })
                })
            } else { // That is, if array length is not zero it means there is an existing user with supplied username or email.
                if (docs[0].username == username && docs[0].email == email) {
                    errors.push({msg: 'Username and email is registered'});
                    res.render('register', {errors:errors, username:username, email:email});
                } else if (docs[0].username == username) {
                    errors.push({msg: 'Username used by another member'});
                    res.render('register', {errors:errors, username:username, email:email});
                } else {
                    errors.push({msg: 'Email is registered'});
                    res.render('register', {errors:errors, username:username, email:email});
                }
            }
        })
    }
    
})

//Update member details Model.findByIdAndUpdate(id, { name: 'jason bourne' }, options, callback)
router.post('/edit', urlencoded, ensureAuth, (req, res)=> {
    const {firstname, lastname, occupation, date, gender, bio} = req.body;
    const memberId = req.user.id;

    Member.findByIdAndUpdate(memberId, {userProfile: {
        firstName: firstname,
        lastName: lastname,
        occupation: occupation,
        gender:gender,
        dob: date,
        bio:bio
    }}, (err) => {
        if (err) {throw err}
        req.flash('successMsg', 'Your profile is updated');
        res.redirect('/member/view_profile');
    })
    
})

//Delete Account
router.post('/delete', (req, res) => {
    let usernameId = req.user.username;
    Member.findOneAndDelete({username:usernameId}, (err, result) => {
        if (err) {console.log (err);}
        req.flash('successMsg', 'Account Deleted');
        res.redirect('/member/register');
    })
})

//Login Routes
router.post('/login', urlencoded, (req, res, next) => {
    passport.authenticate('local', {
        successRedirect: '/member/dashboard',
        failureRedirect: '/member/login',
        failureFlash: true
    }) (req, res, next);
})

module.exports = router;