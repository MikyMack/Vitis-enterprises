const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const subCategorySchema = new Schema({
    title: {
        type: String,
        trim: true
    },
    description: {
        type: String,
        trim: true
    }
});

const categorySchema = new Schema({
    title: {
        type: String,
        required: true,
        trim: true
    },
    description: {
        type: String,
        required: true,
        trim: true
    },
    images: {
        type: [String], 
        validate: [arrayLimit, 'You can only upload up to 2 images!'],
        default: []
    },
    toggled: {
        type: Boolean,
        default: false 
    },
    subCategory: [subCategorySchema]
}, { timestamps: true });


function arrayLimit(val) {
    return val.length <= 2;
}

module.exports = mongoose.model('Category', categorySchema);
