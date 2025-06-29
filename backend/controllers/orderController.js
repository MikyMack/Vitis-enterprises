const Order = require('../models/Order');
const TempOrder = require('../models/TempOrder');

// 🛒 Place an Order (User)
exports.placeOrder = async (req, res) => {
    try {
        const { userId, tempOrderId, transactionId } = req.body;

        // Validate input
        if (!userId || !tempOrderId || !transactionId) {
            return res.status(400).json({ 
                success: false, 
                message: "Missing required parameters" 
            });
        }

        // Get temporary order
        const tempOrder = await TempOrder.findById(tempOrderId);
        if (!tempOrder || tempOrder.userId.toString() !== userId.toString()) {
            return res.status(404).json({ 
                success: false, 
                message: "Order not found or access denied" 
            });
        }

        // Create final order
        const order = new Order({
            user: userId,
            items: tempOrder.items.map(item => ({
                product: item.productId,
                title: item.title,
                image: item.image,
                selectedMeasurement: item.selectedMeasurement,
                selectedColor: item.selectedColor,
                quantity: item.quantity,
                price: item.selectedMeasurement?.offerPrice || 
                      item.selectedMeasurement?.price || 
                      item.selectedColor?.offerPrice || 
                      item.selectedColor?.price || 
                      item.offerPrice || 
                      item.price,
                priceSource: item.priceSource
            })),
            totalAmount: tempOrder.totalAmount,
            billingAddress: tempOrder.billingAddress,
            deliveryAddress: tempOrder.deliveryAddress,
            payment: {
                method: 'Online',
                transactionId,
                status: 'Completed',
                amount: tempOrder.totalAmount,
                gateway: 'PayU'
            },
            orderNotes: tempOrder.orderNotes,
            status: 'Processing'
        });

        await order.save();

        // Clear temporary order and user's cart
        await Promise.all([
            TempOrder.deleteOne({ _id: tempOrderId }),
            Cart.deleteOne({ userId })
        ]);

        res.status(201).json({ 
            success: true, 
            message: "Order placed successfully!", 
            order 
        });

    } catch (error) {
        console.error("Order placement error:", error);
        res.status(500).json({ 
            success: false, 
            message: "Error finalizing order",
            error: error.message 
        });
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
