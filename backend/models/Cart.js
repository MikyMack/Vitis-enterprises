const mongoose = require("mongoose");

const cartItemSchema = new mongoose.Schema({
    productId: { type: mongoose.Schema.Types.ObjectId, ref: "Product", required: true },
    title: { type: String, required: true },
    image: { type: String }, 
    price: { type: Number, required: true, min: 0 }, 
    offerPrice: { type: Number, min: 0 }, 
    selectedMeasurement: {
        measurement: { type: String }, 
        price: { type: Number, min: 0 }, 
        offerPrice: { type: Number, min: 0 },
        stocks: { type: Number, min: 0 }
    },
    selectedColor: {
        colorName: { type: String },
        colorCode: { type: String },
        price: { type: Number, min: 0 },
        offerPrice: { type: Number, min: 0 },
        stocks: { type: Number, min: 0 }
    },
    quantity: { type: Number, required: true, min: 1 },
    priceSource: { 
        type: String,
        enum: ['base', 'measurement', 'color'],
        default: 'base'
    }
});

const cartSchema = new mongoose.Schema({
    userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: false },
    items: [cartItemSchema],
    totalPrice: { type: Number, default: 0 },
    createdAt: { type: Date, default: Date.now },
    updatedAt: { type: Date, default: Date.now }
});

// Update timestamps on save
cartSchema.pre('save', function(next) {
    this.updatedAt = Date.now();
    next();
});

const Cart = mongoose.model("Cart", cartSchema);
module.exports = Cart;