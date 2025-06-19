const mongoose = require("mongoose");

const reviewSchema = new mongoose.Schema({
    title: { type: String, trim: true, required: false },
    description: { type: String, trim: true, required: false },
    date: { type: Date, default: Date.now },
});

const measurementSchema = new mongoose.Schema({
    length: { type: Number, required: true, default: 0 },
    width: { type: Number, required: true, default: 0 },
    price: { type: Number, required: true, min: 0 },  // Price for this measurement
    offerPrice: { type: Number, min: 0 },  // Optional offer price
    stocks: { type: Number, required: true, min: 0 }, // Stock for this option
}, { _id: false });

const productSchema = new mongoose.Schema({
    category: { type: String, trim: true, required: true },
    title: { type: String, trim: true, required: true },
    productDescription: { type: String, trim: true, required: true },
    images: {
        type: [String],
        validate: {
            validator: (val) => val.length >= 1 && val.length <= 4,
            message: "Images should be between 1 and 4",
        },
        required: true,
    },
    measurements: { type: [measurementSchema], required: true }, // Multiple measurement options
    toggled: { type: Boolean, default: true },
    customerReviews: { type: [reviewSchema], default: [] },
});

const Product = mongoose.model("Product", productSchema);
module.exports = Product;
