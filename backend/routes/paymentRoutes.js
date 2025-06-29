const express = require("express");
const crypto = require("crypto");
const axios = require("axios");
const Order = require("../models/Order");
const Cart = require("../models/Cart");
const User = require("../models/User");
const TempOrder = require("../models/TempOrder"); 
const sendInvoiceEmail = require("../utils/sendInvoice")
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

            // Get user details
            const user = await User.findById(tempOrder.userId);
            if (!user) {
                return res.status(400).render('failure', {
                    message: "User not found. Please contact support."
                });
            }

            // Transform items for Order model
            const orderItems = tempOrder.items.map(item => ({
                product: item.productId?._id || item.product,
                title: item.productId?.title || item.title || 'Product',
                image: item.productId?.images?.[0] || item.image || '/img/product/default.png',
                selectedMeasurement: item.selectedMeasurement || null,
                selectedColor: item.selectedColor || null,
                quantity: item.quantity,
                price: item.price || 
                      item.selectedMeasurement?.offerPrice || 
                      item.selectedMeasurement?.price || 
                      item.selectedColor?.offerPrice || 
                      item.selectedColor?.price || 
                      item.productId?.baseOfferPrice || 
                      item.productId?.basePrice || 
                      0,
                priceSource: item.priceSource || 'base'
            }));

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

            const savedOrder = await order.save();
            
            try {
                await sendInvoiceEmail(savedOrder, user.email, user.name);
            } catch (emailError) {
                console.error('Failed to send email:', emailError);
            }

            // Cleanup
            await Promise.all([
                Cart.deleteOne({ userId: tempOrder.userId }),
                TempOrder.deleteOne({ txnid })
            ]);

            return res.render("success", {
                title: "Order Confirmation",
                order: savedOrder,
                txnid: mihpayid,  
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
            message: "An unexpected error occurred. Our team has been notified."
        });
    }
});

module.exports = router;
