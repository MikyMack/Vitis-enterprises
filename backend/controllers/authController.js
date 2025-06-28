// controllers/authController.js
const User = require('../models/User'); 
const Cart  = require('../models/Cart'); 
const Product = require("../models/Product");

const sendEmail = require('../utils/nodemailer');
const otpGenerator = require('otp-generator');
const jwt = require('jsonwebtoken');
require('dotenv').config();
const bcrypt = require("bcryptjs");
const sendOTP = require('../utils/nodemailer');


exports.userLogin = async (req, res) => {
    try {
        const { email, password, guestCart } = req.body;

        if (!email || !password) {
            return res.status(400).json({ message: 'Email and password are required!' });
        }

        let parsedGuestCart = [];
        if (guestCart) {
            try {
                parsedGuestCart = JSON.parse(guestCart);
            } catch (error) {
                console.error("Error parsing guestCart:", error);
                return res.status(400).json({ message: "Invalid guest cart data" });
            }
        }

        const user = await User.findOne({ email });
        if (!user) {
            return res.status(400).json({ message: 'User not found!' });
        }

        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) {
            return res.status(400).json({ message: 'Incorrect Password or Mail!' });
        }

        if (user.blocked) return res.status(403).json({ message: 'User is blocked!' });

        let userCart = await Cart.findOne({ userId: user._id });

        if (parsedGuestCart.length > 0) {
            if (!userCart) {
                userCart = new Cart({ userId: user._id, items: [] });
            }

            const guestProductIds = parsedGuestCart.map(item => item.productId);
            const existingProducts = await Product.find({ _id: { $in: guestProductIds } });

            const existingProductIds = new Set(existingProducts.map(p => p._id.toString()));

            parsedGuestCart = parsedGuestCart.filter(item => existingProductIds.has(item.productId));

            parsedGuestCart.forEach(guestItem => {
                const existingItemIndex = userCart.items.findIndex(
                    item => item.productId.toString() === guestItem.productId
                );
            
                if (existingItemIndex > -1) {
                    userCart.items[existingItemIndex].quantity += guestItem.quantity;
                } else {
                    userCart.items.push({
                        productId: guestItem.productId,
                        title: guestItem.title,
                        image: guestItem.image,
                        price: guestItem.price,
                        offerPrice: guestItem.offerPrice,
                        selectedMeasurement: guestItem.selectedMeasurement,
                        selectedColor: guestItem.selectedColor,
                        quantity: guestItem.quantity,
                        priceSource: guestItem.priceSource || 'base'
                    });
                }
            });

            await userCart.save();
        }

        const token = jwt.sign({ id: user._id, isAdmin: user.isAdmin }, process.env.SESSION_SECRET, { expiresIn: '7d' });

        res.cookie('token', token, { httpOnly: true, secure: false, maxAge: 7 * 24 * 60 * 60 * 1000 });

        res.status(200).json({ success: true, message: 'Login successful!' });
    } catch (error) {
        console.log("Error in Login:", error.message);
        res.status(500).json({ message: error.message });
    }
};



exports.login = async (req, res) => {
    const { email, password } = req.body;

    if (email === 'admin@vitis.com' && password === 'admin@admin') {
        req.session.user = { email };
        res.redirect('/dashboard');
    } else {
        res.render('admin-login', { title: 'Admin Login', error: 'Invalid email or password' });
    }
};

exports.verifyOTP = async (req, res) => {
    try {
        const { email, otp } = req.body;

        // Find user by email
        const user = await User.findOne({ email });
        if (!user) return res.status(400).json({ message: 'User not found!' });

        // Check OTP & expiry
        if (user.otp !== otp || user.otpExpires < Date.now()) {
            return res.status(400).json({ message: 'Invalid or expired OTP!' });
        }

        user.otp = undefined;
        user.otpExpires = undefined;

        await user.save();

        res.redirect('/user-login');
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

exports.verifyOTPpassword = async (req, res) => {
    try {
        const { email, otp } = req.body;

        // Find user by email
        const user = await User.findOne({ email });
        if (!user) return res.status(400).json({ message: 'User not found!' });

        // Check OTP & expiry
        if (user.otp !== otp || user.otpExpires < Date.now()) {
            return res.status(400).json({ message: 'Invalid or expired OTP!' });
        }

        // Clear OTP after verification
        user.otp = undefined;
        user.otpExpires = undefined;

        await user.save();
        res.status(200).json({ success: true, redirectUrl: `/api/auth/user-reset-password?email=${encodeURIComponent(email)}` });
    } catch (error) {
        console.error("Error in verifyOTPpassword:", error);
        res.status(500).json({ message: error.message });
    }
};
exports.logout = (req, res) => {
    req.session.destroy(err => {
        if (err) {
            return res.redirect('/dashboard');
        }
        res.clearCookie('connect.sid');
        res.redirect('/login');
    });
};

exports.userRegister = async (req, res) => {
    try {
        const { name, email, mobile, password } = req.body;

        let user = await User.findOne({ email });
        if (user) {
            return res.render('userRegister', { title: 'Register page', error: 'User already exists!' });
        }

        const otp = otpGenerator.generate(6, { upperCase: false, specialChars: false });

        user = new User({ name, email, mobile, password, otp, otpExpires: Date.now() + 300000 });
        await user.save();
        // Send OTP
        const emailSent = await sendOTP(email, otp);
        if (!emailSent) {
            return res.render('userRegister', { title: 'Register page', error: 'Failed to send OTP!' });
        }

        res.render('userOtp', { title: 'Otp page', email }); // Pass email to OTP page
    } catch (error) {
        console.error("Registration error:", error);
        res.render('userRegister', { title: 'Register page', error: error.message });
    }
};


exports.userLogout = (req, res) => {
    res.clearCookie('token', { httpOnly: true, secure: true });
    res.redirect('/'); 
};

exports.forgotPassword = async (req, res) => {
    try {
        const { email } = req.body;

        let user = await User.findOne({ email });
        if (!user) {
            return res.render("forgot-password", { title: "Forgot Password", error: "Email not found!" });
        }

        // Generate OTP
        const otp = otpGenerator.generate(6, { upperCase: false, specialChars: false });
        user.otp = otp;
        user.otpExpires = Date.now() + 300000; // OTP expires in 5 minutes
        await user.save();

        // Send OTP via email
        const emailSent = await sendEmail(email, `Your OTP for password reset is: ${otp}`);
        if (!emailSent) {
            return res.render("forgot-password", { title: "Forgot Password", error: "Failed to send OTP!" });
        }

        res.render("user-otp-reset", { title: "Verify OTP", email });
    } catch (error) {
        res.render("forgot-password", { title: "Forgot Password", error: error.message });
    }
};

exports.resetPassword = async (req, res) => {
    try {
        const { email, password, confirmPassword } = req.body;

        // Check if passwords match
        if (password !== confirmPassword) {
            return res.status(400).json({ success: false, message: 'Passwords do not match!' });
        }

        // Find user by email
        const user = await User.findOne({ email });
        if (!user) {
            return res.status(400).json({ success: false, message: 'User not found!' });
        }

        // Hash the new password
        const hashedPassword = await bcrypt.hash(password, 10);

        // Update the user's password
        await User.updateOne({ email }, { $set: { password: hashedPassword } });

        // Send success response
        res.status(200).json({ success: true, message: 'Password reset successful! Please log in.', redirectUrl: '/user-login' });
    } catch (error) {
        console.error("Error in resetPassword:", error);
        res.status(500).json({ success: false, message: error.message });
    }
};

// Make a user admin
exports.makeAdmin = async (req, res) => {
    try {
        const userId = req.params.id;

        // Find user by ID
        const user = await User.findById(userId);
        if (!user) {
            return res.status(404).json({ success: false, message: 'User not found!' });
        }

        // Set the user's isAdmin field to true
        user.isAdmin = true;
        await user.save();

        res.status(200).json({ success: true, message: 'User is now an admin.' });
    } catch (error) {
        console.error("Error in makeAdmin:", error);
        res.status(500).json({ success: false, message: error.message });
    }
};

// Remove admin role from a user
exports.removeAdmin = async (req, res) => {
    try {
        const userId = req.params.id;

        // Find user by ID
        const user = await User.findById(userId);
        if (!user) {
            return res.status(404).json({ success: false, message: 'User not found!' });
        }

        // Set the user's isAdmin field to false
        user.isAdmin = false;
        await user.save();

        res.status(200).json({ success: true, message: 'User is no longer an admin.' });
    } catch (error) {
        console.error("Error in removeAdmin:", error);
        res.status(500).json({ success: false, message: error.message });
    }
};

// Block a user
exports.blockUser = async (req, res) => {
    try {
        const userId = req.params.id;

        // Find user by ID
        const user = await User.findById(userId);
        if (!user) {
            return res.status(404).json({ success: false, message: 'User not found!' });
        }

        // Set the user's blocked field to true
        user.blocked = true;
        await user.save();

        res.status(200).json({ success: true, message: 'User has been blocked.' });
    } catch (error) {
        console.error("Error in blockUser:", error);
        res.status(500).json({ success: false, message: error.message });
    }
};

// Unblock a user
exports.unblockUser = async (req, res) => {
    try {
        const userId = req.params.id;

        // Find user by ID
        const user = await User.findById(userId);
        if (!user) {
            return res.status(404).json({ success: false, message: 'User not found!' });
        }

        // Set the user's blocked field to false
        user.blocked = false;
        await user.save();

        res.status(200).json({ success: true, message: 'User has been unblocked.' });
    } catch (error) {
        console.error("Error in unblockUser:", error);
        res.status(500).json({ success: false, message: error.message });
    }
};

