// routes/authRoutes.js
const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');

router.post('/login', authController.login);
router.get('/logout', authController.logout);


router.post('/user-register', authController.userRegister);
router.post('/verify-otp', authController.verifyOTP);
router.post('/verify-otp-password', authController.verifyOTPpassword);
router.post('/user-login', authController.userLogin);
router.get('/user-logout', authController.userLogout);
router.post("/forgot-password", authController.forgotPassword);
router.post("/reset-password", authController.resetPassword);

router.get('/user-reset-password', (req, res) => {
    const { email } = req.query;
    res.render('resetPassword', { email });
});

module.exports = router;
