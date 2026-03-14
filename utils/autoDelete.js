const ReceiverModel = require('../model/receiver.model');
const PaymentModel = require('../model/payment.model');
const WishlistModel = require('../model/wishlist.model');

const checkAndDeleteCompletedReceivers = async () => {
    try {
        // Find all receivers that have reached or exceeded their goal
        const completedReceivers = await ReceiverModel.find({
            $expr: { 
                $gte: ["$raisedAmount", "$requiredMoney"] 
            }
        });

        for (const receiver of completedReceivers) {
            try {
                // Wait for 2 seconds before deletion
                await new Promise(resolve => setTimeout(resolve, 2000));

                // Get all payments for this receiver
                const payments = await PaymentModel.find({ receiverId: receiver._id });

                // Store the receiver details in memory
                const receiverDetails = {
                    Username: receiver.Username,
                    email: receiver.email,
                    causes: receiver.causes,
                    requiredMoney: receiver.requiredMoney,
                    raisedAmount: receiver.raisedAmount
                };

                // Update each payment with a note about completed fundraising
                for (const payment of payments) {
                    payment.status = 'success';
                    payment.notes = `Fundraising completed successfully. Receiver: ${receiverDetails.Username}, Total raised: ${receiverDetails.raisedAmount}`;
                    await payment.save();
                }

                // Delete from wishlist
                await WishlistModel.deleteMany({ donationId: receiver._id });

                // Delete the receiver
                await ReceiverModel.findByIdAndDelete(receiver._id);

               
            } catch (error) {
                console.error(`Error processing receiver ${receiver.Username}:`, error);
            }
        }
    } catch (error) {
        console.error('Error in auto-deletion check:', error);
    }
};

module.exports = checkAndDeleteCompletedReceivers; 