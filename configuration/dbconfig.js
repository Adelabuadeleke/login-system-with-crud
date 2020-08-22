//Require mongoose
const mongoose = require('mongoose');

//Function to open DB connection
let openDB = function () {
    //Create DB connection with Mongo
    mongoose.connect(process.env.mongoURI, { useNewUrlParser: true, useUnifiedTopology: true, useFindAndModify: false });

    //Check Connection
    let db = mongoose.connection;
    db.on('error', (err) => {
        console.log(err);
    })
    db.once('open', () => {
        console.log(`Connection to MongoDB completed`);
    })
}

//Export the function
module.exports = openDB;