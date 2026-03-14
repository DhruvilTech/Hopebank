const mongoose = require('mongoose');
// const bcrypt = require('bcrypt');

const receiverSchema = new mongoose.Schema({
  Username: {
    type: String,
    required: true,
    minLength: 3,
    unique: true
  },
  password: {
    type: String,
    required: true,
    minLength: 8
  },
  phone: {
    type: String,
    required: true,
    minLength: 10,
    unique: true
  },
  email: {
    type: String,
    required: true,
    unique: true
  },
  address: {
    type: String,
    required: true,
    minLength: 10
  },
  requiredMoney: {
    type: Number,
    required: true,
    min: 0
  },
  raisedAmount: {
    type: Number,
    default: 0
  },
  causes: {
    type: String,
    required: true,
    enum: ['Medical', 'Education', 'Animal','NGOs', 'Children/Elderly People', 'Other']
  },
  certificate: {
    type: String,  // This will store the file path/URL
    required: true
  },
  image: {
    type: String,  // This will store the file path/URL
    required: true
  },
  Description:{
    type:String,
    require:true
  },
  urgentStatus: {
    type: String,
    enum: ['pending', 'approved', 'rejected', null],
    default: null
  },
  resetPasswordToken: {
    type: String,
    default: null
  },
  resetPasswordExpires: {
    type: Date,
    default: null
  }
});

// Add a method to calculate progress
receiverSchema.methods.getProgress = function() {
    return (this.raisedAmount / this.requiredMoney) * 100;
};

// Add this to help with debugging
receiverSchema.set('toJSON', {
    transform: function(doc, ret) {
        return {
            ...ret,
            resetPasswordToken: ret.resetPasswordToken,
            resetPasswordExpires: ret.resetPasswordExpires
        };
    }
});

const ReceiverModel = mongoose.model('Receiver', receiverSchema);

module.exports = ReceiverModel;