const mongoose = require('mongoose');

const orderItemSchema = new mongoose.Schema({
    product: { 
        type: mongoose.Schema.Types.ObjectId, 
        ref: 'Product', 
        required: true 
    },
    title: { type: String, required: true },
    image: { type: String },
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
    price: { type: Number, required: true, min: 0 },
    priceSource: { 
        type: String,
        enum: ['base', 'measurement', 'color'],
        default: 'base'
    }
}, { _id: false });

const addressSchema = new mongoose.Schema({
    fullName: { type: String, required: true },
    phone: { type: String, required: true },
    email: { type: String, required: true },
    address: { type: String, required: true },
    city: { type: String, required: true },
    state: { type: String },
    zipCode: { type: String, required: true },
    country: { type: String, required: true }
}, { _id: false });

const paymentDetailsSchema = new mongoose.Schema({
    method: { 
        type: String, 
        enum: ['Online'], 
        default: 'Online',
        required: true 
    },
    transactionId: { type: String },
    status: { type: String },
    amount: { type: Number },
    gateway: { type: String }
}, { _id: false });

const orderSchema = new mongoose.Schema({
    user: { 
        type: mongoose.Schema.Types.ObjectId, 
        ref: 'User', 
        required: true 
    },
    items: [orderItemSchema],
    totalAmount: { 
        type: Number, 
        required: true 
    },
    billingAddress: addressSchema,
    deliveryAddress: addressSchema,
    status: { 
        type: String, 
        enum: ['Pending', 'Processing', 'Shipped', 'Delivered', 'Cancelled', 'Failed'], 
        default: 'Pending' 
    },
    payment: paymentDetailsSchema,
    orderNotes: { 
        type: String, 
        default: '' 
    },
    trackingNumber: { type: String },
    estimatedDelivery: { type: Date },
    createdAt: { 
        type: Date, 
        default: Date.now 
    },
    updatedAt: { 
        type: Date, 
        default: Date.now 
    }
});

// Update timestamps on save
orderSchema.pre('save', function(next) {
    this.updatedAt = Date.now();
    next();
});

// Virtual for formatted delivery date
orderSchema.virtual('formattedDeliveryDate').get(function() {
    return this.estimatedDelivery 
        ? this.estimatedDelivery.toLocaleDateString() 
        : 'Not available';
});

// Virtual for order status with colors
orderSchema.virtual('statusBadge').get(function() {
    const statusColors = {
        'Pending': 'badge-warning',
        'Processing': 'badge-info',
        'Shipped': 'badge-primary',
        'Delivered': 'badge-success',
        'Cancelled': 'badge-danger',
        'Failed': 'badge-dark'
    };
    return `<span class="badge ${statusColors[this.status]}">${this.status}</span>`;
});

module.exports = mongoose.model('Order', orderSchema);