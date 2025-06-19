// models/TempOrder.js
const mongoose = require("mongoose");

const tempOrderSchema = new mongoose.Schema({
    txnid: { type: String, required: true, unique: true },
    userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    items: Array,
    totalAmount: Number,
    billingAddress: Object,
    deliveryAddress: Object,
    orderNotes: String,
    createdAt: { type: Date, default: Date.now, expires: 1800 } 
});

module.exports = mongoose.model("TempOrder", tempOrderSchema);
