const express = require('express');
const router = express.Router();
const orderController = require('../controllers/orderController');
const {authenticateUser} = require('../middleware/auth');

// 🛒 Place a New Order (User)
router.post('/place-order', authenticateUser, orderController.placeOrder);

// 📦 Get All Orders (Admin)
router.get('/all-orders', orderController.getAllOrders);

// 🏠 Get User's Own Orders (User)
router.get('/my-orders/:userId', authenticateUser, orderController.getUserOrders);

// 🔄 Update Order Status (Admin)
router.put('/update-status/:orderId', orderController.updateOrderStatus);

// ❌ Cancel Order (User)
router.put('/cancel/:orderId', authenticateUser, orderController.cancelOrder);

module.exports = router;
