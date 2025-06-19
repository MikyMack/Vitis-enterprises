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
        max: 5, // Restricting stars to a range of 1 to 5
    },
    description: {
        type: String,
        required: true,
    },
    profilePic: {
        type: String, // Path or URL to the profile picture
        required: true,
    },
    toggled: {
        type: Boolean,
        default: true, // To enable/disable displaying a testimonial
    },
}, { timestamps: true });

module.exports = mongoose.model('Testimonial', testimonialSchema);
