const mongoose = require("mongoose");

const reviewSchema = new mongoose.Schema({
    title: { type: String, trim: true, required: false },
    description: { type: String, trim: true, required: false },
    date: { type: Date, default: Date.now },
});

const colorVariantSchema = new mongoose.Schema({
    colorName: { type: String, trim: true, required: true },
    colorCode: { type: String, trim: true, required: false }, 
    price: { type: Number, required: true, min: 0 },
    offerPrice: { type: Number, min: 0 },
    stocks: { type: Number, min: 0 },
}, { _id: false });

const measurementOptionSchema = new mongoose.Schema({
    measurement: { 
        type: String, 
        trim: true, 
        required: true,
    },
    price: { type: Number, required: true, min: 0 },
    offerPrice: { type: Number, min: 0 },
    stocks: { type: Number, required: true, min: 0 },
}, { _id: false });

const productDescriptionPointSchema = new mongoose.Schema({
    point: { type: String, trim: true, required: true }
}, { _id: false });

const productSchema = new mongoose.Schema({
    category: { type: String, trim: true, required: true },
    title: { type: String, trim: true, required: true },
    productDescription: { 
        type: [productDescriptionPointSchema], 
        required: true,
        validate: {
            validator: (val) => Array.isArray(val) && val.length > 0,
            message: "Product description must have at least one point."
        }
    },
    images: {
        type: [String],
        validate: {
            validator: (val) => val.length >= 1 && val.length <= 4,
            message: "Images should be between 1 and 4",
        },
        required: true,
    },
    basePrice: { type: Number, min: 0 },
    baseOfferPrice: { type: Number, min: 0 },
    baseStocks: { type: Number, min: 0 },
    measurements: { type: [measurementOptionSchema], required: false, default: undefined },
    colorVariants: { type: [colorVariantSchema], required: false, default: undefined },
    toggled: { type: Boolean, default: true },
    customerReviews: { type: [reviewSchema], default: [] },
});

const Product = mongoose.model("Product", productSchema);
module.exports = Product;
