const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
const UserModel = require('../model/user.model');
const ReceiverModel = require('../model/receiver.model');
const PaymentModel = require('../model/payment.model');
const RequestUrgentModel = require('../model/requestUrgent.model');



// Admin dashboard
router.get('/dashboard',  async (req, res) => {
    try {
        const dashboardData = {
            userCount: await UserModel.countDocuments(),
            receiverCount: await ReceiverModel.countDocuments(),
            transactions: await PaymentModel.find()
                .populate('userId', 'username')
                .populate('receiverId', 'Username')
                .sort({ timestamp: -1 })
                .limit(10),
            transactionCount: await PaymentModel.countDocuments(),
            users: await UserModel.find().select('username email'),
            receivers: await ReceiverModel.find()
        };

        const totalAmountResult = await PaymentModel.aggregate([
            { $group: { _id: null, total: { $sum: "$amount" } } }
        ]);
        dashboardData.totalAmount = totalAmountResult[0]?.total || 0;

        res.render('dashboard', dashboardData);
    } catch (error) {
        console.error('Admin dashboard error:', error);
        res.status(500).render('error', { 
            message: 'Error loading admin dashboard'
        });
    }
});

// Urgent requests page
router.get('/urgent-requests',  async (req, res) => {
    try {
        const urgentRequests = await RequestUrgentModel.find()
            .populate('receiverId')
            .sort({ requestDate: -1 });

        res.render('urgent-requests', { urgentRequests });
    } catch (error) {
        console.error('Error fetching urgent requests:', error);
        res.status(500).render('error', { 
            message: 'Error loading urgent requests' 
        });
    }
});

// Handle urgent request actions
router.post('/urgent-requests/:requestId/:action', async (req, res) => {
    try {
        const { requestId, action } = req.params;
        const urgentRequest = await RequestUrgentModel.findById(requestId)
            .populate('receiverId');

        if (!urgentRequest) {
            return res.json({ success: false, message: 'Request not found' });
        }

        // Update the urgent request status
        urgentRequest.status = action === 'approve' ? 'approved' : 'rejected';
        await urgentRequest.save();

        // Update the receiver's urgent status
        await ReceiverModel.findByIdAndUpdate(urgentRequest.receiverId._id, {
            urgentStatus: action === 'approve' ? 'approved' : 'rejected'
        });

        res.json({ 
            success: true, 
            message: `Request ${action}ed successfully` 
        });
    } catch (error) {
        console.error('Error processing urgent request:', error);
        res.json({ success: false, message: 'Failed to process request' });
    }
});

// Admin logout
router.get('/logout', (req, res) => {
    res.clearCookie('token');
    res.redirect('/admin/login');
});

module.exports = router;