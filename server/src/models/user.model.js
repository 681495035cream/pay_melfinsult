const mongoose = require('mongoose');

const userSchema = new mongoose.Schema(
    {
        name: { type: String, required: true, trim: true, maxlength: 80 },
        password: { type: String, required: true, select: false },
        email: { type: String, required: true, unique: true, trim: true, lowercase: true },
        profile: { type: String, required: false },
    },
    { timestamps: true }
);
module.exports = mongoose.model('User', userSchema);
