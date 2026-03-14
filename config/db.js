const mongoose = require('mongoose');

const connectToDB = async () => {
    try {
        const mongoUri = process.env.MONGODB_URI;

        if (!mongoUri) {
            console.error('MongoDB connection error: MONGODB_URI is not set in environment variables');
            process.exit(1);
        }

        await mongoose.connect(mongoUri);
        console.log('Connected to MongoDB successfully');
    } catch (error) {
        console.error('MongoDB connection error:', error);
        process.exit(1);
    }
};

module.exports = connectToDB; 