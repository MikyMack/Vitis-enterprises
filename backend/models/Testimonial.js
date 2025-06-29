const mongoose = require('mongoose');

const testimonialSchema = new mongoose.Schema({
    title: {
        type: String,
        required: true,
        trim: true,
    },
    stars: {
        type: Number,
        required: true,
        min: 1,
        max: 5, 
    },
    description: {
        type: String,
        required: true,
    },
    profilePic: {
        type: String, 
        required: true,
    },
    toggled: {
        type: Boolean,
        default: true, 
    },
}, { timestamps: true });

module.exports = mongoose.model('Testimonial', testimonialSchema);
