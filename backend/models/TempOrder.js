const mongoose = require("mongoose");

const tempOrderSchema = new mongoose.Schema({
    txnid: { 
        type: String, 
        required: true, 
        unique: true 
    },
    userId: { 
        type: mongoose.Schema.Types.ObjectId, 
        ref: "User", 
        required: true 
    },
    items: { 
        type: Array, 
        required: true,
        validate: {
            validator: function(v) {
                return Array.isArray(v) && v.length > 0;
            },
            message: 'Items array cannot be empty'
        }
    },
    totalAmount: { 
        type: Number, 
        required: true,
        min: 0,
        validate: {
            validator: function(v) {
                return !isNaN(v) && isFinite(v);
            },
            message: 'Total amount must be a valid number'
        }
    },
    billingAddress: { 
        type: Object, 
        required: true,
        validate: {
            validator: function(v) {
                return v && 
                       typeof v === 'object' && 
                       v.fullName && 
                       v.email && 
                       v.phone && 
                       v.address;
            },
            message: 'Invalid billing address structure'
        }
    },
    deliveryAddress: { 
        type: Object,
        validate: {
            validator: function(v) {
                if (!v) return true; // Optional
                return typeof v === 'object' && 
                       v.fullName && 
                       v.email && 
                       v.phone && 
                       v.address;
            },
            message: 'Invalid delivery address structure'
        }
    },
    orderNotes: { 
        type: String, 
        default: '' 
    },
    createdAt: { 
        type: Date, 
        default: Date.now, 
        expires: 1800 
    }
}, {
    strict: 'throw'
});

tempOrderSchema.pre('save', function(next) {

    if (isNaN(this.totalAmount) || !isFinite(this.totalAmount)) {
        throw new Error('Total amount must be a valid number');
    }
    
    if (!this.totalAmount && this.items) {
        this.totalAmount = this.items.reduce((total, item) => {
            const price = item.selectedMeasurement?.offerPrice || 
                         item.selectedMeasurement?.price || 
                         item.selectedColor?.offerPrice || 
                         item.selectedColor?.price || 
                         item.offerPrice || 
                         item.price;
            return total + (price * item.quantity);
        }, 0);
    }
    
    next();
});

module.exports = mongoose.model("TempOrder", tempOrderSchema);