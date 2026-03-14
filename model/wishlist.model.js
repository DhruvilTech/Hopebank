const mongoose = require('mongoose');

const wishlistSchema = new mongoose.Schema({
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    donationId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Receiver',
        required: true
    },
    addedAt: {
        type: Date,
        default: Date.now
    }
});

// Ensure unique combination of userId and donationId
wishlistSchema.index({ userId: 1, donationId: 1 }, { unique: true });

const WishlistModel = mongoose.model('Wishlist', wishlistSchema);
module.exports = WishlistModel; 