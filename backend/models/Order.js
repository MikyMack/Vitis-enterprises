const mongoose = require('mongoose');

const orderSchema = new mongoose.Schema({
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    items: [{
        product: { type: mongoose.Schema.Types.ObjectId, ref: 'Product', required: true },
        length: Number,
        width: Number,
        price: Number,
        quantity: Number
    }],
    totalAmount: { type: Number, required: true },
    billingAddress: {
        fullName: String,
        phone: String,
        email: String,
        address: String,
        city: String,
        state: String,
        zipCode: String,
        country: String
    },
    deliveryAddress: {
        fullName: String,
        phone: String,
        email: String,
        address: String,
        city: String,
        state: String,
        zipCode: String,
        country: String
    },
    status: { 
        type: String, 
        enum: ['Pending', 'Processing', 'Shipped', 'Delivered', 'Cancelled'], 
        default: 'Pending' 
    },
    paymentMethod: { 
        type: String, 
        enum: ['COD', 'Online'], 
        required: true 
    },
    orderNotes: { type: String, default: '' },
    delivery_date: { type: Date },
    createdAt: { type: Date, default: Date.now }
});

// Virtual for formatted delivery date
orderSchema.virtual('formattedDeliveryDate').get(function() {
    return this.delivery_date ? this.delivery_date.toLocaleDateString() : 'Not set';
});

module.exports = mongoose.model('Order', orderSchema);