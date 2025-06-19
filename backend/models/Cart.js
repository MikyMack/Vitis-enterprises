const mongoose = require("mongoose");

const cartSchema = new mongoose.Schema({
    userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: false }, // Optional for guest users
    items: [
        {
            productId: { type: mongoose.Schema.Types.ObjectId, ref: "Product", required: true },
            title: { type: String, required: true }, 
            selectedMeasurement: {
                length: { type: Number, required: true },
                width: { type: Number, required: true },
                price: { type: Number, required: true },
                offerPrice: { type: Number },  // Optional
            },
            quantity: { type: Number, required: true, min: 1 },
        }
    ],
    totalPrice: { type: Number, default: 0 },
});

const Cart = mongoose.model("Cart", cartSchema);
module.exports = Cart;
