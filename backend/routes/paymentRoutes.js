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
            const tempOrder = await TempOrder.findOne({ txnid });

            if (!tempOrder) {
                return res.status(400).send("Order details not found.");
            }

            const order = new Order({
                user: tempOrder.userId,
                items: tempOrder.items,
                totalAmount: tempOrder.totalAmount,
                billingAddress: tempOrder.billingAddress,
                paymentMethod: "Online",
                deliveryAddress: tempOrder.deliveryAddress?.fullName ? tempOrder.deliveryAddress : tempOrder.billingAddress,
                orderNotes: tempOrder.orderNotes,
                status: "Processing",
            });

            await order.save();
            await Cart.deleteOne({ userId: tempOrder.userId });
            await TempOrder.deleteOne({ txnid }); // cleanup

            res.render("success", {
                txnid,
                order
            });
        } else {
            res.status(400).send("Payment failed. Order not placed.");
        }
    } catch (error) {
        console.error("Error in /payu/success:", error);
        res.status(500).send("An error occurred while processing your payment.");
    }
});

module.exports = router;
