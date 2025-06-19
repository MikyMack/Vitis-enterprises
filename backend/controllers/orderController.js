const Order = require('../models/Order');

// 🛒 Place an Order (User)
exports.placeOrder = async (req, res) => {
    try {
        const { userId, items, totalAmount, billingAddress, deliveryAddress, paymentMethod } = req.body;

        if (!userId || !items.length || !totalAmount || !billingAddress || !deliveryAddress || !paymentMethod) {
            return res.status(400).json({ message: "Invalid order details" });
        }

        const newOrder = new Order({
            user: userId,
            items,
            totalAmount,
            billingAddress,
            deliveryAddress,
            paymentMethod
        });

        await newOrder.save();

        res.status(201).json({ success: true, message: "Order placed successfully!", order: newOrder });
    } catch (error) {
        res.status(500).json({ message: "Error placing order", error });
    }
};

// 📦 Get All Orders (Admin)
exports.getAllOrders = async (req, res) => {
    try {
        const orders = await Order.find().populate('user', 'name email').populate('items.product', 'title images');
        res.status(200).json(orders);
    } catch (error) {
        res.status(500).json({ message: "Error fetching orders", error });
    }
};

// 📦 Get User's Orders
exports.getUserOrders = async (req, res) => {
    try {
        const userId = req.params.userId;
        const orders = await Order.find({ user: userId }).populate('items.product', 'title images');
        res.status(200).json(orders);
    } catch (error) {
        res.status(500).json({ message: "Error fetching orders", error });
    }
};

// 🔄 Update Order Status (Admin)
exports.updateOrderStatus = async (req, res) => {
    try {
        const { orderId } = req.params;
        const { status } = req.body;

        const order = await Order.findByIdAndUpdate(orderId, { status }, { new: true });
        if (!order) return res.status(404).json({ message: "Order not found" });

        res.status(200).json({ success: true, message: "Order status updated", order });
    } catch (error) {
        res.status(500).json({ message: "Error updating order status", error });
    }
};

// ❌ Cancel Order (User)
exports.cancelOrder = async (req, res) => {
    try {
        const { orderId } = req.params;
        const order = await Order.findById(orderId);
        
        if (!order) return res.status(404).json({ message: "Order not found" });

        if (order.status === 'Shipped' || order.status === 'Delivered') {
            return res.status(400).json({ message: "Order cannot be canceled at this stage" });
        }

        order.status = 'Cancelled';
        await order.save();

        res.status(200).json({ success: true, message: "Order cancelled successfully", order });
    } catch (error) {
        res.status(500).json({ message: "Error cancelling order", error });
    }
};
