const mongoose = require('mongoose');

const requestUrgentSchema = new mongoose.Schema({
    receiverId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Receiver',
        required: true
    },
    reason: {
        type: String,
        required: true
    },
    status: {
        type: String,
        enum: ['pending', 'approved', 'rejected'],
        default: 'pending'
    },
    createdAt: {
        type: Date,
        default: Date.now
    },
    actionDate: {
        type: Date
    },
    actionBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
    }
});

module.exports = mongoose.model('RequestUrgent', requestUrgentSchema); 