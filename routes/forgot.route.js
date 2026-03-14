const nodemailer = require('nodemailer');
const express = require('express');
const router = express.Router();
const bcrypt = require('bcrypt');
const crypto = require('crypto');
const UserModel = require('../model/user.model');
const ReceiverModel = require('../model/receiver.model');

// Show forgot password form
router.get('/forgot-password', (req, res) => {
    res.render('forgot-password', { errors: [], success: null });
});
router.get('/receiv/forgot-password', (req, res) => {
    res.render('forgot-password-receiver', { 
        errors: [],
        success: null 
    });
});

// Handle forgot password request
router.post('/forgot-password', async (req, res) => {
    try {
        const { email } = req.body;

        // Generate random token
        const token = crypto.randomBytes(32).toString('hex');

        // Find user by email
        const user = await UserModel.findOne({ email });
        if (!user) {
            return res.render('forgot-password', {
                errors: [{ msg: 'No account with that email address exists.' }],
                success: null
            });
        }

        // Set password reset token and expiry
        user.resetPasswordToken = token;
        user.resetPasswordExpires = Date.now() + 3600000; // 1 hour
        await user.save();

        // Create transporter
        const transporter = nodemailer.createTransport({
            service: 'gmail',
            auth: {
                user: 'hopebank97@gmail.com',
                pass: 'rpxftbrermwstpgi' // Replace with your app password
            }
        });

        // Create reset URL
        const resetUrl = `http://${req.headers.host}/reset-password/${token}`;

        // Setup email
        const mailOptions = {
            from: '"Hope Bank" <hopebank97@gmail.com>',
            to: email,
            subject: 'Password Reset Request',
            html: `
                <div style="font-family: Arial, sans-serif; padding: 20px; color: #333;">
                    <h2 style="color: #023E8A;">Password Reset Request</h2>
                    <p>Hello,</p>
                    <p>You are receiving this because you (or someone else) have requested the reset of the password for your account.</p>
                    <p>Please click on the following button to complete the process:</p>
                    <div style="margin: 30px 0; text-align: center;">
                        <a href="${resetUrl}" 
                           style="background: #00B4D8; 
                                  color: white; 
                                  padding: 12px 30px; 
                                  text-decoration: none; 
                                  border-radius: 5px; 
                                  display: inline-block;">
                            Reset Password
                        </a>
                    </div>
                    <p>If you did not request this, please ignore this email and your password will remain unchanged.</p>
                    <p>This link will expire in 1 hour.</p>
                    <br>
                    <p>Best regards,</p>
                    <p><strong>Hope Bank Team</strong></p>
                </div>
            `
        };

        // Send email
        await transporter.sendMail(mailOptions);

        // Render the email-sent page instead of login
        return res.render('email-sent');

    } catch (error) {
        console.error('Error:', error);
        res.render('forgot-password', {
            errors: [{ msg: 'An error occurred. Please try again.' }],
            success: null
        });
    }
});

router.post('/receiv/forgot-password', async (req, res) => {
    try {
        const { receiver_email } = req.body;
        console.log('Email received:', receiver_email);

        // Generate random token
        const token = crypto.randomBytes(32).toString('hex');
        console.log('Generated token:', token);

        // Find receiver by email
        const receiver = await ReceiverModel.findOne({ email: receiver_email });
        console.log('Receiver before update:', receiver);

        if (!receiver) {
            return res.render('forgot-password-receiver', {
                errors: [{ msg: 'No account with that email address exists.' }],
                success: null
            });
        }

        // Set password reset token and expiry
        receiver.resetPasswordToken = token;
        receiver.resetPasswordExpires = Date.now() + 3600000; // 1 hour
        await receiver.save();

        // Verify token was saved
        const updatedReceiver = await ReceiverModel.findOne({ email: receiver_email });
        console.log('Receiver after update:', updatedReceiver);
        console.log('Saved token:', updatedReceiver.resetPasswordToken);

        // Create transporter
        const transporter = nodemailer.createTransport({
            service: 'gmail',
            auth: {
                user: 'hopebank97@gmail.com',
                pass: 'rpxftbrermwstpgi' // Replace with your app password
            }
        });

        // Create reset URL
        const resetUrl = `http://${req.headers.host}/reset-password-receiver/${token}`;

        // Setup email
        const mailOptions = {
            from: '"Hope Bank" <hopebank97@gmail.com>',
            to: receiver_email,
            subject: 'Password Reset Request',
            html: `
                <div style="font-family: Arial, sans-serif; padding: 20px; color: #333;">
                    <h2 style="color: #023E8A;">Password Reset Request</h2>
                    <p>Hello,</p>
                    <p>You are receiving this because you (or someone else) have requested the reset of the password for your account.</p>
                    <p>Please click on the following button to complete the process:</p>
                    <div style="margin: 30px 0; text-align: center;">
                        <a href="${resetUrl}" 
                           style="background: #00B4D8; 
                                  color: white; 
                                  padding: 12px 30px; 
                                  text-decoration: none; 
                                  border-radius: 5px; 
                                  display: inline-block;">
                            Reset Password
                        </a>
                    </div>
                    <p>If you did not request this, please ignore this email and your password will remain unchanged.</p>
                    <p>This link will expire in 1 hour.</p>
                    <br>
                    <p>Best regards,</p>
                    <p><strong>Hope Bank Team</strong></p>
                </div>
            `
        };

        // Send email
        await transporter.sendMail(mailOptions);

        // Render the email-sent-receiver page
        return res.render('email-sent-receiver');

    } catch (error) {
        console.error('Error:', error);
        res.render('forgot-password-receiver', {
            errors: [{ msg: 'An error occurred. Please try again.' }],
            success: null
        });
    }
});

// Show reset password form
router.get('/reset-password/:token', async (req, res) => {
    try {
        const user = await UserModel.findOne({
            resetPasswordToken: req.params.token,
            resetPasswordExpires: { $gt: Date.now() }
        });

        if (!user) {
            return res.render('forgot-password', {
                errors: [{ msg: 'Password reset token is invalid or has expired.' }],
                success: null
            });
        }

        res.render('reset-password', {
            token: req.params.token,
            errors: []
        });
    } catch (error) {
        res.render('forgot-password', {
            errors: [{ msg: 'An error occurred. Please try again.' }],
            success: null
        });
    }
});

// Handle password reset
router.post('/reset-password/:token', async (req, res) => {
    try {
        const { password, confirmPassword } = req.body;

        if (password !== confirmPassword) {
            return res.render('reset-password', {
                token: req.params.token,
                errors: [{ msg: 'Passwords do not match.' }]
            });
        }

        const user = await UserModel.findOne({
            resetPasswordToken: req.params.token,
            resetPasswordExpires: { $gt: Date.now() }
        });

        if (!user) {
            return res.render('forgot-password', {
                errors: [{ msg: 'Password reset token is invalid or has expired.' }],
                success: null
            });
        }

        // Set new password
        const hashedPassword = await bcrypt.hash(password, 10);
        user.password = hashedPassword;
        user.resetPasswordToken = null;
        user.resetPasswordExpires = null;
        await user.save();

        res.render('login', {
            success: 'Your password has been changed successfully. Please log in with your new password.'
        });
    } catch (error) {
        res.render('reset-password', {
            token: req.params.token,
            errors: [{ msg: 'An error occurred while resetting your password.' }]
        });
    }
});

// Show reset password form for receivers
router.get('/reset-password-receiver/:token', async (req, res) => {
    try {
        const token = req.params.token;
        console.log('Token received:', token);

        // Add more specific query conditions
        const receiver = await ReceiverModel.findOne({
            resetPasswordToken: token,
            resetPasswordExpires: { $gt: Date.now() }
        });
        console.log('Current time:', Date.now());
        console.log('Receiver found:', receiver);

        if (!receiver) {
            console.log('No receiver found with token');
            return res.render('forgot-password-receiver', {
                errors: [{ msg: 'Password reset token is invalid or has expired.' }],
                success: null
            });
        }

        res.render('reset-password-receiver', {
            token: token,
            errors: []
        });
    } catch (error) {
        console.error('Error in reset password route:', error);
        res.render('forgot-password-receiver', {
            errors: [{ msg: 'An error occurred. Please try again.' }],
            success: null
        });
    }
});

// Handle password reset for receivers
router.post('/reset-password-receiver/:token', async (req, res) => {
    try {
        const { password, confirmPassword } = req.body;

        if (password !== confirmPassword) {
            return res.render('reset-password-receiver', {
                token: req.params.token,
                errors: [{ msg: 'Passwords do not match.' }]
            });
        }

        const receiver = await ReceiverModel.findOne({
            resetPasswordToken: req.params.token,
            resetPasswordExpires: { $gt: Date.now() }
        });

        if (!receiver) {
            return res.render('forgot-password-receiver', {
                errors: [{ msg: 'Password reset token is invalid or has expired.' }],
                success: null
            });
        }

        // Set new password
        const hashedPassword = await bcrypt.hash(password, 10);
        receiver.password = hashedPassword;
        receiver.resetPasswordToken = null;
        receiver.resetPasswordExpires = null;
        await receiver.save();

        res.render('loginr', {
            success: 'Your password has been changed successfully. Please log in with your new password.'
        });
    } catch (error) {
        res.render('reset-password-receiver', {
            token: req.params.token,
            errors: [{ msg: 'An error occurred while resetting your password.' }]
        });
    }
});

module.exports = router;