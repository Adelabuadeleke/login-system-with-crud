const express = require('express');
const router = express.Router();
const bodyParser = require('body-parser');
const bcrypt = require('bcryptjs');
const moment = require('moment');
const Member = require('../model/member');
const passport = require('passport');
const {ensureAuth} = require('../configuration/ensureAdminAuth');

moment().format();

function adminAccess (req, res) {
    if (req.user.email !== 'me@admin.com') {
        req.flash('errorMsg', 'Access denied!');
        res.redirect('/member/dashboard');
    }
};

//Body Parser middleware
let urlencoded = bodyParser.urlencoded( { extended: false } );
let jsonParser = bodyParser.json();

//Get Login
router.get('/login', (req, res) => {
    res.render('admin/admin_login');
})

//Get Admin Dashboard
router.get('/dashboard', ensureAuth, (req, res) => {
    adminAccess (req, res);
    Member.find({}, (err, docs) => {
        if (err) {throw err};
        res.render('admin/admin_dashboard', {member: docs});
    })
})

//Get All Member
router.get('/all_member', ensureAuth, (req, res) => {
    adminAccess (req, res);
    Member.find({}, (err, docs) => {
        if (err) {throw err};
        res.render('admin/admin_allMember', {member: docs, moment:moment});
    })
})

//Get add new member routes
router.get('/add', (req, res) => {
    adminAccess (req, res);
    res.render('admin/admin_addMember')
})

//Get one member to CRUD
router.get('/member/:id', ensureAuth, (req, res) => {
    adminAccess (req, res);
    const userId = req.params.id;
    Member.findOne({username: userId}, (err, docs) => {
        if (err) {throw err};
        res.render('admin/admin_editMember', {member: docs});
    })
})

//Logout Admin
router.get('/logout', ensureAuth, (req, res) => {
    adminAccess (req, res);
    req.logOut();
    req.flash('successMsg', 'You are now logged out');
    res.redirect('/');
})

//Login Admin
router.post('/login', urlencoded, (req, res, next) => {
    const {email} = req.body;
    if (email !== 'me@admin.com') {
        req.flash('errorMsg', 'You are not an admin. Register as new member or log in if you have an account');
        res.redirect('/member/login');
    } else {
        passport.authenticate('local', {
            successRedirect: '/admin/dashboard',
            failureRedirect: '/',
            failureFlash: true
        }) (req, res, next);
    }
})

//Create New Member
router.post('/add',  urlencoded, (req, res) => {
    const {username, email, password, firstname, lastname, occupation, date, bio, gender} = req.body;
    
    let errors = [];
    Member.find({ $or: [{username:username}, {email:email}] }, (err, docs) => {
        if (err) {console.log(err);}
        if (docs.length == 0) { //When docs.length is zero it means no user with the credential is matched
            //Create a new Model
            const newMember = new Member;
            //Get all data
            newMember.username = username;
            newMember.email = email;
            newMember.password = password;
            newMember.userProfile.firstName = firstname;
            newMember.userProfile.lastName = lastname;
            newMember.userProfile.occupation = occupation;
            newMember.userProfile.gender = gender;
            newMember.userProfile.dob = date;
            newMember.userProfile.bio = bio;

            //Hash Password
            bcrypt.genSalt(10, (err, salt) => {
                bcrypt.hash(newMember.password, salt, (err, hash) => {
                    if (err) {console.log(err);}
                    newMember.password = hash;

                    //save New Member to DB
                    newMember.save((err) => {
                        if (err) {
                            console.log (err)
                        } else {
                            console.log(`New member with details: ${newMember} successfully added to Database`);
                            req.flash('successMsg', 'Member created');
                            res.redirect('/admin/all_member');
                        }
                    })
                })
            })
        } else {
            if (docs[0].username == username && docs[0].email == email) {
                errors.push({msg: 'Username and email is registered'});
                res.render('admin/admin_addMember', {
                    errors:errors, 
                    username:username, 
                    email:email,
                    lastname:lastname,
                    firstname:firstname,
                    occupation:occupation,
                    date:date,
                    bio:bio,
                    gender:gender
                });
            } else if (docs[0].username == username) {
                errors.push({msg: 'Username used by another member'});
                res.render('admin/admin_addMember', {
                    errors:errors, 
                    username:username, 
                    email:email,
                    lastname:lastname,
                    firstname:firstname,
                    occupation:occupation,
                    date:date,
                    bio:bio,
                    gender:gender
                });
            } else {
                errors.push({msg: 'Email is registered'});
                res.render('admin/admin_addMember', {
                    errors:errors, 
                    username:username, 
                    email:email,
                    lastname:lastname,
                    firstname:firstname,
                    occupation:occupation,
                    date:date,
                    bio:bio,
                    gender:gender
                });
            }
        }
    })
})

//Edit member infos
router.post('/edit/:id', urlencoded, (req, res) => {
    //Get form input
    const {firstname, lastname, email, username, occupation, date, bio, gender} = req.body;
    //Array to store errors
    let errors = [];

    //Get the unique username Id in the URL
    let usernameId = req.params.id;

    //If there is Admin wants to change the current username, check if the inputted username already exist in DB
    if (usernameId != username) {
        Member.findOne({username:username}, (err, member) => {
            if (err) {console.log(err)};
            //If no member with the username exist, then continue with update.
            if (!member) {
                const updateMember = {
                    username:username,
                    email:email,
                    userProfile: {
                        firstName:firstname,
                        lastName:lastname,
                        occupation:occupation,
                        gender:gender,
                        dob:date,
                        bio:bio
                    }
                }
                Member.findOneAndUpdate({username:usernameId}, updateMember, (err, member) => {
                    if (err) {throw err};
                    req.flash('successMsg', 'Member details updated successfuuly');
                    res.redirect('/admin/all_member')
                })
            } else {
                //If member with the username is found
                errors.push({msg: 'Username already exist'});
                req.flash('errorMsg', 'Username already exist');
                res.redirect(`/admin/member/${usernameId}`);
            }
        })
    } else { //If the username is not changed
        const updateMember = {
            username:username,
            email:email,
            userProfile: {
                firstName:firstname,
                lastName:lastname,
                occupation:occupation,
                gender:gender,
                dob:date,
                bio:bio
            }
        }
        Member.findOneAndUpdate({username:usernameId}, updateMember, (err, member) => {
            if (err) {console.log(err)}
            req.flash('successMsg', 'Member details updated successfuuly');
            res.redirect('/admin/all_member')
        })
    }
})

//Delete Users
router.post('/delete/:id', (req, res) => {
    let usernameId = req.params.id;
    Member.findOneAndDelete({username:usernameId}, (err, docs) => {
        if (err) {
            console.log (err);
        } 
        req.flash('successMsg', 'Member deleted');
        res.redirect('/admin/all_member');
    })
})


//export routes
module.exports = router;