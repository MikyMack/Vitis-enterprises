const mongoose = require('mongoose');

const blogSchema = new mongoose.Schema({
    image: {
        type: String,
        required: true
    },
    author: {
        type: String,
        required: true
    },
    date: {
        type: Date,
        required: true
    },
    title: {
        type: String,
        required: true
    },
    description: {
        type: String,
        required: true
    },
    metatitle: {
        type: String,
        required: true
    },
    metadescription: {
        type: String,
        required: true
    }
});

const Blog = mongoose.model('Blog', blogSchema);

module.exports = Blog;
