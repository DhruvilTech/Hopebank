const express = require('express');
const router = express.Router();
const { body, validationResult } = require('express-validator');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const UserModel = require('../model/user.model');
const ReceiverModel = require('../model/receiver.model');
const PaymentModel = require('../model/payment.model');
const WishlistModel = require('../model/wishlist.model');
const nodemailer = require('nodemailer');
const RequestUrgentModel = require('../model/requestUrgent.model');

const checkAuth = (req, res, next) => {
    const token = req.cookies.token;
    if (token) {
        try {
            const decoded = jwt.verify(token, process.env.JWT_SECRET);
            req.userId = decoded.userId;
            req.receiverId = decoded.receiverId;
            res.locals.isLoggedIn = true;
        } catch (error) {
            // If token verification fails, clear the invalid token
            res.clearCookie('token');
            res.locals.isLoggedIn = false;
            return res.redirect('/login');
        }
    } else {
        res.locals.isLoggedIn = false;
    }
    next();
};

// Apply the middleware to all routes
router.use(checkAuth);

// Home route
router.get('/', async (req, res) => {
    try {
        // Fetch receivers with approved urgent status
        const urgentReceivers = await ReceiverModel.find({
            urgentStatus: 'approved'
        }).sort({ updatedAt: -1 }); // Show most recently approved first

        res.render('index', {
            urgentReceivers,
            // ... any other data you're passing
        });
    } catch (error) {
        console.error('Error fetching urgent receivers:', error);
        res.render('index', {
            urgentReceivers: [],
            error: 'Failed to load urgent cases'
        });
    }
});

// Login route
router.get('/login', (req, res) => {
    res.render('login');
});

// Logout route
router.get('/logout', (req, res) => {
    res.clearCookie('token');
    res.redirect('/');
});

router.get('/about', (req, res) => {
    res.render('about');
});

router.get('/contact', (req, res) => {
    res.render('contact');
});

router.get('/select', (req, res) => {
    res.render('select');
});

router.get('/signd', (req, res) => {
    res.render('signd');
});

router.get('/signr', (req, res) => {
    res.render('signr');
});

router.post('/signd',
    body('email').trim().isEmail().isLength({ min: 13 }),
    body('password').trim().isLength({ min: 8 }),
    body('phone').trim().isLength({ min: 10 }),
    async (req, res) => {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.render('signd', {
                errors: errors.array(),
                formData: req.body
            });
        }

        const { username, password, email, phone, address } = req.body;

        const existingUser = await UserModel.findOne({ username });
        if (existingUser) {
            return res.render('signd', {
                errors: [{ msg: 'username already registered' }],
                formData: req.body
            });
        }
        const existingphone = await UserModel.findOne({ phone });
        if (existingphone) {
            return res.render('signd', {
                errors: [{ msg: 'phoneNuber already registered' }],
                formData: req.body
            });
        }

        // Check if user already exists
        const existingEmail = await UserModel.findOne({ email });
        if (existingEmail) {
            return res.render('signd', {
                errors: [{ msg: 'Email already registered' }],
                formData: req.body
            });
        }

        // Hash password
        const hashedPassword = await bcrypt.hash(password, 10);

        // Create new user
        const newUser = await UserModel.create({
            username,
            email: email.toLowerCase(),
            password: hashedPassword,
            phone,
            address
        });
        res.render('login');
    }
);

// Add admin credentials at the top of the file
const ADMIN_CREDENTIALS = {
    username: 'admin123',
    password: 'Admin@123'  // Make sure to use this exact password
};

// Modify the login route
router.post('/login',
    body('username').trim(),
    body('password').trim(),
    async (req, res) => {
        try {
            const { username, password } = req.body;

            // Check for admin login
            if (username === ADMIN_CREDENTIALS.username && password === ADMIN_CREDENTIALS.password) {
                try {
                
                    // Instead of rendering directly, redirect to dashboard route
                    return res.redirect('/admin/dashboard');

                } catch (adminError) {
                    console.error('Admin login error:', adminError);
                    return res.render('login', {
                        errors: [{ msg: 'Admin login failed. Please try again.' }],
                        oldInput: { username: req.body.username }
                    });
                }
            }

            // Regular user login logic continues here...
            const user = await UserModel.findOne({ username });

            if (!user || !(await bcrypt.compare(password, user.password))) {
                return res.render('login', {
                    errors: [{ msg: 'User or password is incorrect' }],
                    oldInput: { username }
                });
            }

            // Find the receiver associated with the user
            const receiver = await ReceiverModel.findOne({ userId: user._id });
            const receiverId = receiver ? receiver._id : null;

            const token = jwt.sign(
                {
                    userId: user._id,
                    username: user.username,
                    receiverId: receiverId
                },
                process.env.JWT_SECRET,
                { expiresIn: '24h' }
            );

            // Store token in cookie
            res.cookie('token', token, {
                httpOnly: true,
                maxAge: 24 * 60 * 60 * 1000 // 24 hours
            });
            res.redirect('/');
        } catch (error) {
            console.error('Login error:', error);
            res.render('login', {
                errors: [{ msg: 'An error occurred during login' }],
                oldInput: { username: req.body.username }
            });
        }
    }
);

router.get('/educationdonate', async (req, res) => {
    if (!res.locals.isLoggedIn) {
        return res.redirect('/login');
    }
    try {
        const educationCases = await ReceiverModel.find({
            causes: 'Education'
        }).sort({ createdAt: -1 });

        res.render('education', { educationCases });
    } catch (error) {
        res.render('education', {
            educationCases: [],
            error: 'Failed to load education cases'
        });
    }
});

router.get('/medicaldonate', async (req, res) => {
    if (!res.locals.isLoggedIn) {
        return res.redirect('/login');
    }
    try {
        const medicaldonates = await ReceiverModel.find({
            causes: 'Medical'
        }).sort({ createdAt: -1 });

        res.render('medical', { medicaldonates });
    } catch (error) {
        res.render('medical', {
            medicaldonates: [],
            error: 'Failed to load education cases'
        });
    }
});

router.get('/ngodonate', async (req, res) => {
    if (!res.locals.isLoggedIn) {
        return res.redirect('/login');
    }
    try {
        const ngodonates = await ReceiverModel.find({
            causes: 'NGOs'
        }).sort({ createdAt: -1 });

        res.render('ngo', { ngodonates });
    } catch (error) {
        res.render('ngo', {
            ngodonates: [],
            error: 'Failed to load education cases'
        });
    }
});

router.get('/animaldonate', async (req, res) => {
    if (!res.locals.isLoggedIn) {
        return res.redirect('/login');
    }
    try {
        const animaldonates = await ReceiverModel.find({
            causes: 'Animal'
        }).sort({ createdAt: -1 });

        res.render('animal', { animaldonates });
    } catch (error) {
        res.render('animal', {
            animaldonates: [],
            error: 'Failed to load education cases'
        });
    }
});

router.get('/cedonate', async (req, res) => {
    if (!res.locals.isLoggedIn) {
        return res.redirect('/login');
    }
    try {
        const cedonates = await ReceiverModel.find({
            causes: 'Children/Elderly People'
        }).sort({ createdAt: -1 });

        res.render('ce', { cedonates });
    } catch (error) {
        res.render('ce', {
            cedonates: [],
            error: 'Failed to load education cases'
        });
    }
});

router.get('/otherdonate', async (req, res) => {
    if (!res.locals.isLoggedIn) {
        return res.redirect('/login');
    }
    try {
        const otherdonates = await ReceiverModel.find({
            causes: 'Other'
        }).sort({ createdAt: -1 });

        res.render('other', { otherdonates });
    } catch (error) {
        res.render('other', {
            otherdonates: [],
            error: 'Failed to load education cases'
        });
    }
});

router.get('/payment', async (req, res) => {
    if (res.locals.isLoggedIn) {
        return res.render('payment');
    } else {
        return res.redirect('/login');
    }
});

// Process payment route
router.post('/process-payment', async (req, res) => {
    try {
        if (!res.locals.isLoggedIn) {
            return res.redirect('/login');
        }

        const { receiverId, amount, paymentMethod } = req.body;

        // Generate transaction ID
        const transactionId = 'TXN' + Date.now() + Math.random().toString(36).substr(2, 9);

        // Create payment record
        const payment = await PaymentModel.create({
            userId: req.userId,
            receiverId: receiverId, // Store receiver ID
            amount: parseFloat(amount),
            paymentMethod,
            status: 'success',
            transactionId: transactionId,
            timestamp: new Date()
        });

        // Update receiver's raised amount
        await ReceiverModel.findByIdAndUpdate(receiverId, {
            $inc: { raisedAmount: parseFloat(amount) }
        });

        res.redirect(`/payment-success/${payment._id}`);
    } catch (error) {
        console.error('Payment processing error:', error);
        res.status(500).render('error', { message: 'Payment failed' });
    }
});

// Payment success route
router.get('/payment-success/:id', async (req, res) => {
    try {
        const payment = await PaymentModel.findById(req.params.id)
            .populate('userId', 'username email')
            .populate('receiverId', 'Username email');
        
        if (!payment) {
            return res.status(404).render('error', { 
                message: 'Payment not found' 
            });
        }

        res.render('payment-success', { payment });
    } catch (error) {
        console.error('Payment success page error:', error);
        res.status(500).render('error', { 
            message: 'Error loading payment details' 
        });
    }
});

router.post('/donate/:id', async (req, res) => {
    try {
        const amount = parseFloat(req.body.amount);
        const userId = req.user._id; // Assuming you have user authentication

        // Calculate hope coins (5 Rs = 1 hope coin)
        const hopeCoins = Math.floor(amount / 5);

        // Update user's hope coins
        await UserModel.findByIdAndUpdate(userId, {
            $inc: { hopeCoins: hopeCoins }
        });

        // ... rest of your donation logic ...

        res.redirect('/donation-success');
    } catch (error) {
        console.error(error);
        res.redirect('/donation-failed');
    }
});

router.get('/profile', async (req, res) => {
    try {
        const user = await UserModel.findById(req.userId);
        if (!user) {
            return res.redirect('/login');
        }
        res.render('profile', { user, errors: [] });
    } catch (error) {
        console.error('Error fetching user profile:', error);
        res.status(500).render('error', { message: 'Internal Server Error' });
    }
});

// Route to handle profile updates
router.post('/profile', 
    [
        body('name').trim().notEmpty().withMessage('Name is required'),
        body('email').trim().isEmail().withMessage('Valid email is required'),
        body('phone').trim().notEmpty().withMessage('Phone number is required')
    ],
    async (req, res) => {
        if (!res.locals.isLoggedIn) {
            return res.redirect('/login');
        }

        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.render('profile', { user: req.body, errors: errors.array() });
        }

        try {
            const { name, email, phone } = req.body;
            const currentUser = await UserModel.findById(req.userId);

            // Check if username exists (excluding current user)
            const existingUsername = await UserModel.findOne({ username: name, _id: { $ne: req.userId } });
            if (existingUsername) {
                return res.render('profile', {
                    errors: [{ msg: 'Username already exists' }],
                    user: currentUser
                });
            }

            // Check if email exists (excluding current user)
            const existingEmail = await UserModel.findOne({ email, _id: { $ne: req.userId } });
            if (existingEmail) {
                return res.render('profile', {
                    errors: [{ msg: 'Email already registered' }],
                    user: currentUser
                });
            }

            // Check if phone exists (excluding current user)
            const existingPhone = await UserModel.findOne({ phone, _id: { $ne: req.userId } });
            if (existingPhone) {
                return res.render('profile', {
                    errors: [{ msg: 'Phone number already registered' }],
                    user: currentUser
                });
            }

            // Update user
            const updatedUser = await UserModel.findByIdAndUpdate(req.userId, {
                username: name,
                email,
                phone
            }, { new: true });

            res.render('profile', { user: updatedUser, errors: [] });
        } catch (error) {
            console.error('Error updating user data:', error);
            res.status(500).render('error', { message: 'Internal Server Error' });
        }
    }
);


// Wishlist Route
router.get('/wishlist', async (req, res) => {
    if (!res.locals.isLoggedIn) {
        return res.redirect('/login');
    }

    try {
        if (!req.userId) throw new Error("User ID is missing");

        // Fetch wishlist items for the logged-in user
        const wishlistItems = await WishlistModel.find({ userId: req.userId })
            .populate('donationId')  // Ensure it correctly references the Donation model
            .sort({ addedAt: -1 });

        // Fetch all receivers
        const allReceivers = await ReceiverModel.find().sort({ createdAt: -1 });

        res.render('wishlist', {
            wishlistItems,
            allReceivers
        });

    } catch (error) {
        console.error('Wishlist error:', error);
        res.render('wishlist', {
            wishlistItems: [],
            allReceivers: [],
            error: 'Failed to load data'
        });
    }
});

// Update the add-to-wishlist route
router.post('/add-to-wishlist', async (req, res) => {
    if (!res.locals.isLoggedIn) {
        return res.json({ success: false, message: 'Please login first' });
    }

    try {
        const { donationId } = req.body;

        // Check if already in wishlist
        const existingWishlist = await WishlistModel.findOne({
            userId: req.userId,
            donationId: donationId
        });

        if (existingWishlist) {
            return res.json({
                success: false,
                message: 'Already in wishlist'
            });
        }

        // Add to wishlist
        await WishlistModel.create({
            userId: req.userId,
            donationId: donationId
        });

        res.json({ success: true });

    } catch (error) {
        console.error('Wishlist error:', error);
        res.json({
            success: false,
            message: 'Failed to add to wishlist'
        });
    }
});

// Add this route to handle wishlist item removal
router.delete('/remove-from-wishlist/:id', async (req, res) => {
    if (!res.locals.isLoggedIn) {
        return res.json({ success: false, message: 'Please login first' });
    }

    try {
        await WishlistModel.findOneAndDelete({
            userId: req.userId,
            donationId: req.params.id
        });

        res.json({ success: true });
    } catch (error) {
        console.error('Wishlist removal error:', error);
        res.json({ success: false, message: 'Failed to remove from wishlist' });
    }
});

router.get('/forgot-password', (req, res) => {
    res.render('forgot-password');
});

// Add this route for receiver details
router.get('/receiver/:id', async (req, res) => {
    if (!res.locals.isLoggedIn) {
        return res.redirect('/login');
    }
    try {

        const receiver = await ReceiverModel.findById(req.params.id);
        if (!receiver) {
            return res.status(404).render('error', { message: 'Receiver not found' });
        }

        // Get all successful payments for this receiver
        const payments = await PaymentModel.find({
            receiverId: receiver._id,
            status: 'success'
        });

        // Calculate total received amount
        const totalReceived = payments.reduce((sum, payment) => sum + payment.amount, 0);
        
        // Calculate progress percentage
        const progress = (totalReceived / receiver.requiredMoney) * 100;

        res.render('receiver-details', {
            receiver,
            totalReceived,
            progress,
            isLoggedIn: res.locals.isLoggedIn
        });
    } catch (error) {
        console.error('Receiver details error:', error);
        res.status(500).render('error', { message: 'Error loading details' });
    }
});

// Add these constants at the top
const VERIFICATION_CODES = {
    upi: '9072',
    card: '654125',
    netbanking: '612543'
};

// Update/add these routes
router.get('/payment/:id', async (req, res) => {
    try {
        if (!res.locals.isLoggedIn) {
            return res.redirect('/login');
        }

        const receiver = await ReceiverModel.findById(req.params.id);
        if (!receiver) {
            return res.status(404).render('error', { 
                message: 'Receiver not found' 
            });
        }

        res.render('payment', { receiver });
    } catch (error) {
        console.error('Payment page error:', error);
        res.status(500).render('error', { 
            message: 'Error loading payment page' 
        });
    }
});

router.post('/verify-payment', async (req, res) => {
    try {
        if (!res.locals.isLoggedIn) {
            return res.json({ success: false, message: 'Please login first' });
        }

        const { method, verificationCode, amount, receiverId } = req.body;

        // Verify the code
        if (verificationCode !== VERIFICATION_CODES[method]) {
            return res.json({ 
                success: false, 
                message: 'Invalid verification code' 
            });
        }

        // Create payment record
        const payment = new PaymentModel({
            userId: req.userId,
            receiverId: receiverId,
            amount: parseFloat(amount),
            paymentMethod: method,
            status: 'success',
            transactionId: 'TXN' + Date.now(),
            timestamp: new Date()
        });
        await payment.save();

        // Update receiver's raised amount
        await ReceiverModel.findByIdAndUpdate(receiverId, {
            $inc: { raisedAmount: parseFloat(amount) }
        });

        // Send success response
        res.json({ 
            success: true,
            payment: {
                id: payment._id,
                transactionId: payment.transactionId,
                amount: payment.amount,
                date: payment.timestamp
            }
        });

    } catch (error) {
        console.error('Payment verification error:', error);
        res.json({ success: false, message: 'Payment failed' });
    }
});

router.get('/payment-success/:id', async (req, res) => {
    try {
        const payment = await PaymentModel.findById(req.params.id)
            .populate('userId', 'username email')
            .populate('receiverId', 'Username email');
        
        if (!payment) {
            return res.status(404).render('error', { 
                message: 'Payment not found' 
            });
        }

        res.render('payment-success', { payment });
    } catch (error) {
        console.error('Payment success page error:', error);
        res.status(500).render('error', { 
            message: 'Error loading payment details' 
        });
    }
});

// Add verification routes
router.get('/verify/:method/:receiverId', (req, res) => {
    const { method, receiverId } = req.params;
    const { amount } = req.query;

    switch(method) {
        case 'upi':
            res.render('upi-verification', { receiverId, amount });
            break;
        case 'card':
            res.render('card-verification', { receiverId, amount });
            break;
        case 'netbanking':
            res.render('netbanking-verification', { receiverId, amount });
            break;
        default:
            res.redirect('/payment/' + receiverId);
    }
});

// Add this route for donation history
router.get('/history', async (req, res) => {
    try {
        if (!res.locals.isLoggedIn) {
            return res.redirect('/login');
        }

        const donations = await PaymentModel.find({ userId: req.userId })
            .populate('receiverId', 'Username')
            .sort({ timestamp: -1 });

        res.render('history', { donations });
    } catch (error) {
        console.error('History page error:', error);
        res.status(500).render('error', { 
            message: 'Error loading donation history' 
        });
    }
});

// Add the wishlist toggle route if not already present

router.get('/payment-success/:paymentId', async (req, res) => {
    try {
        const payment = await PaymentModel.findById(req.params.paymentId)
            .populate('userId', 'username')
            .populate('receiverId', 'Username');

        if (!payment) {
            return res.status(404).render('error', { message: 'Payment not found' });
        }

        res.render('payment-success', { payment });
    } catch (err) {
        console.error(err);
        res.status(500).render('error', { message: 'Server error' });
    }
});

module.exports = router;