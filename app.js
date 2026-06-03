const express = require('express');
const app = express();
const dotenv = require('dotenv');
const mongoose = require('mongoose');
const cookieParser = require('cookie-parser');
const multer = require('multer');
const path = require('path');
const checkAndDeleteCompletedReceivers = require('./utils/autoDelete');
dotenv.config();

const userRoute = require('./routes/user.route');
const receiverRoute = require('./routes/receiver.route');
const forgotRoute = require('./routes/forgot.route');
const adminRoute = require('./routes/admin.route');

const connectToDB = require('./config/db');

// Database connection will be initiated before starting the server

// Middleware
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'ejs');
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static('public'));
// app.use(express.static('./public'));
app.use(cookieParser());

app.get("/test",(req,res)=>{
    res.render("contact");
});

app.use('/', userRoute);
app.use('/receiv',receiverRoute)
app.use('/', forgotRoute);
app.use('/admin', adminRoute);


// Update the static file serving
app.use(express.static('public'));
app.use('/uploads', express.static('public/uploads'));

// Set up periodic check (every second)
const CHECK_INTERVAL = 1000; // 1 second in milliseconds

// Function to start the auto-delete checker
const startAutoDeleteChecker = () => {
    // Run initial check
    checkAndDeleteCompletedReceivers();

    // Set up periodic checks
    setInterval(checkAndDeleteCompletedReceivers, CHECK_INTERVAL);
};

// Start the auto-delete checker
startAutoDeleteChecker();

// Connect to MongoDB and then start server
connectToDB().then(() => {
    const PORT = process.env.PORT || 3000;
    app.listen(PORT, () => {
        console.log(`Server is running on port ${PORT}`);
    });
});