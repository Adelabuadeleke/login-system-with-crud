//Dependencies
const express = require('express');
const dotenv = require('dotenv');
const path = require('path');
const flash = require('connect-flash');
const session = require('express-session');
const passport = require('passport');
const memberRoutes = require('./router/members');
const adminRoutes = require('./router/admin');
const startDB = require('./configuration/dbconfig');
const app = express();

//Import env file use port number from env
dotenv.config({path: './configuration/config.env'});
let PORT = process.env.PORT || 2000;

//Call DB
startDB();

//Use Public Folder
app.use(express.static(path.join(__dirname, 'public')));

//Set up ejs view engine
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

//Express session middleware
app.use(session({
    secret: 'my secret',
    resave: true,
    saveUninitialized: true
}))


//require auth
require('./configuration/auth')


// Passport Middleware
app.use(passport.initialize());
app.use(passport.session());

//Connect flash
app.use(flash());

//Set global variables for success and error message
app.use((req, res, next) => {
    res.locals.successMsg = req.flash('successMsg');
    res.locals.errorMsg = req.flash('errorMsg');
    res.locals.error = req.flash('error');
    res.locals.success = req.flash('success');
    next();
})


//Get Homepage
app.get('/', (req, res) => {
    res.render('index');
})

//Use Member Routes
app.use('/member', memberRoutes);

//Use Admin Routes
app.use('/admin', adminRoutes);


app.listen(PORT, ()=> {
    console.log(`Application is running in ${process.env.NODE_ENV} mode on port: ${PORT} mongoURI: ${process.env.mongoURI}`);
})
