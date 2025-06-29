const express = require("express");
const crypto = require("crypto");
const axios = require("axios");
const Order = require("../models/Order");
const Cart = require("../models/Cart");
const TempOrder = require("../models/TempOrder"); // <-- NEW
require("dotenv").config();

const router = express.Router();

router.post("/checkoutApi", async (req, res) => {
    try {
        const { userId, items, totalAmount, billingAddress, paymentMethod, orderNotes, deliveryAddress } = req.body;

        // Only allow online payment
        if (paymentMethod !== "Online") {
            return res.status(400).json({ success: false, message: "Only online payment is supported." });
        }

        // Create unique txnid
        const txnid = "txn" + Date.now();

        // Save temp order in DB
        await TempOrder.create({
            txnid,
            userId,
            items,
            totalAmount,
            billingAddress,
            deliveryAddress,
            orderNotes
        });

        const hashString = `${process.env.PAYU_MERCHANT_KEY}|${txnid}|${totalAmount}|Product Purchase|${billingAddress.fullName}|${billingAddress.email}|||||||||||${process.env.PAYU_MERCHANT_SALT}`;
        const hash = crypto.createHash("sha512").update(hashString).digest("hex");

        const payuData = {
            key: process.env.PAYU_MERCHANT_KEY,
            txnid,
            amount: totalAmount,
            productinfo: "Product Purchase",
            firstname: billingAddress.fullName,
            email: billingAddress.email,
            phone: billingAddress.phone,
            surl: process.env.PAYU_SUCCESS_URL,
            furl: process.env.PAYU_FAILURE_URL,
            hash,
            service_provider: "payu_paisa",
        };

        res.json({ success: true, payuData });

    } catch (error) {
        console.error("Checkout error:", error);
        res.status(500).json({ success: false, message: "Checkout failed" });
    }
});

router.post("/payu/success", async (req, res) => {
    try {
        const { txnid, mihpayid, status } = req.body;

        if (status === "success") {
            const tempOrder = await TempOrder.findOne({ txnid }).populate('items.productId');

            if (!tempOrder) {
                return res.status(400).render('failure', {
                    message: "Order details not found. Please contact support with your transaction ID: " + txnid
                });
            }

            const orderItems = tempOrder.items.map(item => {
                const product = item.productId || {};
                
                return {
                    product: product._id || item.product,
                    title: product.title || item.title || 'Product',
                    image: product.images?.[0] || item.image || '/img/product/default.png',
                    selectedMeasurement: item.selectedMeasurement || null,
                    selectedColor: item.selectedColor || null,
                    quantity: item.quantity,
                    price: item.price || 
                          item.selectedMeasurement?.offerPrice || 
                          item.selectedMeasurement?.price || 
                          item.selectedColor?.offerPrice || 
                          item.selectedColor?.price || 
                          product.baseOfferPrice || 
                          product.basePrice || 
                          0,
                    priceSource: item.priceSource || 'base'
                };
            });

            const order = new Order({
                user: tempOrder.userId,
                items: orderItems,
                totalAmount: tempOrder.totalAmount,
                billingAddress: tempOrder.billingAddress,
                payment: {
                    method: "Online",
                    transactionId: mihpayid,
                    status: "Completed",
                    amount: tempOrder.totalAmount,
                    gateway: "PayU"
                },
                deliveryAddress: tempOrder.deliveryAddress || tempOrder.billingAddress,
                orderNotes: tempOrder.orderNotes,
                status: "Processing"
            });

            await order.save();
            
            // Cleanup
            await Promise.all([
                Cart.deleteOne({ userId: tempOrder.userId }),
                TempOrder.deleteOne({ txnid })
            ]);

            return res.render("success", {
                title: "Order Confirmation",
                order,
                transactionId: mihpayid
            });

        } else {
            return res.status(400).render('failure', {
                message: "Payment failed. Please try again or contact support."
            });
        }
    } catch (error) {
        console.error("Payment processing error:", error);
        return res.status(500).render('failure', {
            message: "An unexpected error occurred. Our team has been notified. Please contact support with transaction ID: " + (req.body.txnid || 'N/A')
        });
    }
});

module.exports = router;
