const mongoose = require('mongoose');
const bcrypt = require('bcrypt');

const userSchema = new mongoose.Schema({

    username: {
        type: String,
        required: [true, 'Username is required'],
        unique: true,
        minlength: [3, 'Username must be at least 3 characters long'],
        trim: true
    },
    email: {
        type: String,
        required: [true, 'Email is required'],
        unique: true,
        trim: true,
        lowercase: true,
        minlength: [13, 'Email must be at least 13 characters long']
    },
    password: {
        type: String,
        required: [true, 'Password is required'],
        minlength: [8, 'Password must be at least 8 characters long']
    },
    phone: {
        type: String,
        required: [true, 'Phone number is required'],
        unique: true,
        trim: true,
        minlength: [10, 'Phone number must be at least 10 digits']
    },
    address: {
        type: String,
        required: [true, 'Address is required'],
        trim: true,
        minlength: [10, 'Address must be at least 10 characters']
    },
    resetPasswordToken: {
        type: String,
        default: null
    },
    resetPasswordExpires: {
        type: Date,
        default: null
    }
}, {
    timestamps: true
});

const UserModel = mongoose.model('User', userSchema);
module.exports = UserModel; 