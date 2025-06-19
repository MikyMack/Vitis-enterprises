const nodemailer = require('nodemailer');

const transporter = nodemailer.createTransport({
    service: 'Gmail', // Use your email service (Gmail, Outlook, etc.)
    auth: {
        user: process.env.EMAIL_USER, // Your email (store in .env)
        pass: process.env.EMAIL_PASS  // Your email password (store in .env)
    }
});

// Function to send OTP email
const sendOTP = async (email, otp) => {
    const mailOptions = {
        from: process.env.EMAIL_USER,
        to: email,
        subject: "Your OTP for Registration",
        text: `Your OTP code is ${otp}. It is valid for 5 minutes.`
    };

    try {
        await transporter.sendMail(mailOptions);
        return true;
    } catch (error) {
        console.error("Error sending email:", error);
        return false;
    }
};

module.exports = sendOTP;
