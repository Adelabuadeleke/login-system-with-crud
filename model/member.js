//Require Mongoose
const mongoose = require('mongoose');

//Use Schema
const Schema = mongoose.Schema;


//Create Schema
const memberSchema = new Schema ({
    username: {
        type: String,
        required: true
    },
    email: {
        type: String,
        required: true
    },
    password: {
        type: String,
        required: true
    },
    userProfile: {
        firstName: {
            type: String
        },
        lastName: {
            type: String
        },
        occupation: {
            type: String
        },
        gender: {
            type: String
        },
        dob: {
            type: String
        },
        bio: {
            type: String
        },
        date: {
            type: Date,
            default: Date.now
        }
    }
}, 
{timestamps: true})

//Model based on the Schema
let Member = mongoose.model('Member', memberSchema);

//Export Member
module.exports = Member;