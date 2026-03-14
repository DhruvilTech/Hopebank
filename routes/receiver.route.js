const express = require('express');
const router = express.Router();
const { body, validationResult } = require('express-validator');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const multer = require('multer');
const path = require('path');
const ReceiverModel = require('../model/receiver.model');
const RequestUrgentModel = require('../model/requestUrgent.model');

// Configure multer for file upload
const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, 'public/uploads');  // Make sure this directory exists
    },
    filename: function (req, file, cb) {
        cb(null, Date.now() + '-' + file.originalname);
    }
});

const upload = multer({ storage: storage });

const checkAuth = (req, res, next) => {
    const token = req.cookies.token;
    if (token) {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        req.userId = decoded.userId;
        res.locals.isLoggedIn = true;
        req.receiverId = decoded.receiverId;
        res.locals.receiverId = decoded.receiverId;
    } else {
        res.locals.isLoggedIn = false;
    }
    next();
};

// Apply the middleware to all routes
router.use(checkAuth);



router.get('/signr', (req, res) => {
    res.render('signr');
});
router.get('/loginr',(req,res)=>{
    res.render('loginr');
});
router.post('/upload',
    upload.fields([
        { name: 'certificate', maxCount: 1 },
        { name: 'image', maxCount: 1 }
    ]), body('email').trim().isEmail(),
    async (req, res) => {
        try {
            // Log incoming data for debugging
            console.log('Form data:', req.body);
            console.log('Files:', req.files);

            // Validate required files
            if (!req.files.certificate || !req.files.image) {
                return res.render('signr', {
                    errors: [{ msg: 'Both certificate and image are required' }]
                });
            }
            const errors = validationResult(req);
            if (!errors.isEmpty()) {
                return res.render('signr', {
                    errors: errors.array(),
                    formData: req.body
                });
            }

            // Extract form data
            const {
                Username,
                password,
                phone,
                email,
                address,
                requiredMoney,
                causes,
                Description
            } = req.body;

            const existingUser = await ReceiverModel.findOne({ Username });
            if (existingUser) {
                return res.render('signr', {
                    errors: [{ msg: 'Username already registered' }],
                    formData: req.body
                });
            }
            const existingphone = await ReceiverModel.findOne({ phone });
            if (existingphone) {
                return res.render('signr', {
                    errors: [{ msg: 'phoneNuber already registered' }],
                    formData: req.body
                });
            }

            // Check if user already exists
            const existingEmail = await ReceiverModel.findOne({ email });
            if (existingEmail) {
                return res.render('signr', {
                    errors: [{ msg: 'Email already registered' }],
                    formData: req.body
                });
            }

            // Hash password
            const hashedPassword = await bcrypt.hash(password, 10);

            // Create new receiver
            const newReceiver = await ReceiverModel.create({
                Username,
                password: hashedPassword,
                phone,
                email,
                address,
                requiredMoney,
                Description,
                causes,
                certificate: '/uploads/' + req.files.certificate[0].filename,
                image: '/uploads/' + req.files.image[0].filename
            });

            // Redirect to login page after successful registration
            res.render('loginr');

        } catch (error) {
            console.error('Upload error:', error);
            res.render('signr', {
                errors: [{ msg: 'Error during registration. Please try again.' }]
            });
        }
    }
);

router.post('/loginr',
    body('Username').trim().notEmpty().withMessage('Username is required'),
    body('password').trim().isLength({ min: 8 }).withMessage('Password must be at least 8 characters'),
    async (req, res) => {
        try {
            const errors = validationResult(req);
            if (!errors.isEmpty()) {
                return res.render('loginr', {
                    errors: errors.array(),
                    oldInput: { Username: req.body.Username }
                });
            }

            const { Username, password } = req.body;
            const user1 = await ReceiverModel.findOne({ Username });

            if (!user1 || !(await bcrypt.compare(password, user1.password))) {
                return res.render('loginr', {
                    errors: [{ msg: 'User or password is incorrect' }],
                    oldInput: { Username }
                });
            }

            // Generate token
            const token = jwt.sign(
                {
                    userId: user1._id,
                    Username: user1.Username,
                    receiverId: user1._id
                },
                process.env.JWT_SECRET || 'your-secret-key',
                { expiresIn: '24h' }
            );

            // Store token in cookie
            res.cookie('token', token, {
                httpOnly: true,
                secure: process.env.NODE_ENV === 'production',
                maxAge: 24 * 60 * 60 * 1000 // 24 hours
            });

            res.redirect('/receiv/home');
        } catch (error) {
            console.error('Login error:', error);
            res.status(500).render('error', { message: 'Internal Server Error' });
        }
    }
);

// Home Route
router.get('/home', checkAuth, async (req, res) => {
    try {
        const receiver = await ReceiverModel.findById(req.userId);

        if (!receiver) {
            return res.redirect('/receiv/loginr');
        }

        // Use the raisedAmount from the receiver model
        const totalReceived = receiver.raisedAmount || 0;
        const donorCount = receiver.donorCount || 0;
        
        // Calculate progress percentage
        const progressPercentage = Math.min(
            Math.round((totalReceived / receiver.requiredMoney) * 100),
            100
        );

        res.render('receiver_home', {
            receiver,
            totalReceived,
            donorCount,
            progressPercentage
        });
    } catch (error) {
        console.error('Home route error:', error);
        res.status(500).render('error', { message: 'Internal Server Error' });
    }
});

// Logout Route
router.get('/logout', (req, res) => {
    res.clearCookie('token');
    res.redirect('/receiv/loginr');
});

router.get('/edit_profile', async (req, res) => {
    try {
        // Get token from cookie and verify
        const token = req.cookies.token;
        if (!token) {
            return res.redirect('/receiv/loginr');
        }

        // Verify token and get user ID
        const decoded = jwt.verify(token, process.env.JWT_SECRET || 'your-secret-key');
        
        // Fetch receiver data using ReceiverModel instead of UserModel
        const receiver = await ReceiverModel.findById(decoded.userId);
        if (!receiver) {
            return res.status(404).render('error', { message: 'Receiver not found' });
        }

        res.render('edit_profile', { receiver });
    } catch (error) {
        console.error('Error fetching receiver data:', error);
        res.status(500).render('error', { message: 'Internal Server Error' });
    }
});

// Update the POST route for edit profile
router.post('/edit_profile', 
    upload.single('image'), // Allow image upload
    async (req, res) => {
        try {
            // Get token and verify
            const token = req.cookies.token;
            if (!token) {
                return res.redirect('/receiv/loginr');
            }

            const decoded = jwt.verify(token, process.env.JWT_SECRET || 'your-secret-key');
            
            // Extract form data
            const { Username, email, phone, address, causes, requiredMoney } = req.body;

            // Prepare update object
            const updateData = {
                Username,
                email,
                phone,
                address,
                causes,
                requiredMoney
            };

            // If new image was uploaded, add it to update data
            if (req.file) {
                updateData.image = '/uploads/' + req.file.filename;
            }

            // Update receiver information using ReceiverModel
            const updatedReceiver = await ReceiverModel.findByIdAndUpdate(
                decoded.userId,
                updateData,
                { new: true } // Return updated document
            );

            if (!updatedReceiver) {
                return res.status(404).render('error', { message: 'Receiver not found' });
            }

            // Redirect to profile page after successful update
            res.redirect('/receiv/home');
        } catch (error) {
            console.error('Error updating receiver data:', error);
            res.status(500).render('error', { 
                message: 'Error updating profile. Please try again.' 
            });
        }
    }
);
router.get('/logout', (req, res) => {
    console.log('logout');
    res.clearCookie('token');
    res.redirect('/')
});

// Update the request-urgent route
router.post('/request-urgent', async (req, res) => {
    try {
        const token = req.cookies.token;
        if (!token) {
            return res.json({ success: false, message: 'Not authenticated' });
        }

        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        const receiver = await ReceiverModel.findById(decoded.userId);
        
        if (!receiver) {
            return res.json({ success: false, message: 'Receiver not found' });
        }

        // Create new urgent request
        const newRequest = await RequestUrgentModel.create({
            receiverId: decoded.userId,
            reason: req.body.reason || 'Urgent funding needed',
            status: 'pending'
        });

        // Update receiver's urgentStatus
        await ReceiverModel.findByIdAndUpdate(decoded.userId, {
            urgentStatus: 'pending'
        });

        res.json({ 
            success: true, 
            message: 'Urgent request submitted successfully',
            requestId: newRequest._id,
            status: 'pending'
        });
    } catch (error) {
        console.error('Error creating urgent request:', error);
        res.json({ success: false, message: 'Failed to submit urgent request' });
    }
});

// Add a route to check urgent status
router.get('/check-urgent-status', async (req, res) => {
    try {
        const token = req.cookies.token;
        if (!token) {
            return res.json({ status: null });
        }

        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        const receiver = await ReceiverModel.findById(decoded.userId);
        
        if (!receiver) {
            return res.json({ status: null });
        }

        res.json({ status: receiver.urgentStatus });
    } catch (error) {
        console.error('Error checking status:', error);
        res.json({ status: null });
    }
});

// Handle account deletion
router.delete('/delete-account', async (req, res) => {
    try {
        const token = req.cookies.token;
        if (!token) {
            return res.json({ success: false, message: 'Not authenticated' });
        }

        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        
        // Delete the receiver
        await ReceiverModel.findByIdAndDelete(decoded.userId);
        
        // Clear the authentication token
        res.clearCookie('token');
        
        res.json({ success: true, message: 'Account deleted successfully' });
    } catch (error) {
        console.error('Error deleting account:', error);
        res.json({ success: false, message: 'Failed to delete account' });
    }
});

// Update raised amount when donation is received
const updateRaisedAmount = async (receiverId, donationAmount) => {
    await ReceiverModel.findByIdAndUpdate(
        receiverId,
        { $inc: { raisedAmount: donationAmount } },
        { new: true }
    );
};



module.exports = router;