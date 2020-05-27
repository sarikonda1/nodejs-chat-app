const mongoose = require('mongoose');
module.exports = mongoose.model('Users', new mongoose.Schema({ 
    username: { type: String, required: true, index: { unique: true }},
    password: { type: String, required: true },
    email: { type: String, required: true, index: { unique: true } }
}, { timestamps: true }));
