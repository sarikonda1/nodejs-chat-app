const mongoose = require('mongoose');
module.exports = mongoose.model('Chat-Rooms', new mongoose.Schema({ 
    name: { type: String},
    users: [
        {
            type: mongoose.Schema.Types.ObjectId, ref: 'Users'
        }
    ],
    messages: [Object],
    isGroup: {
        type: Boolean,
        default: true
    },
}, { timestamps: true }));
