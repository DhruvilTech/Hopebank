const mongoose = require('mongoose');

const paymentSchema = new mongoose.Schema({
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
    },
    receiverId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Receiver'
    },
    amount: {
        type: Number,
        required: true
    },
    paymentMethod: {
        type: String,
        enum: ['card', 'upi', 'netbanking'],
        required: true
    },
    status: {
        type: String,
        enum: ['pending', 'success', 'failed'],
        default: 'pending'
    },
    transactionId: {
        type: String,
        unique: true
    },
    timestamp: {
        type: Date,
        default: Date.now
    }
});

const PaymentModel = mongoose.model('Payment', paymentSchema);
module.exports = PaymentModel;