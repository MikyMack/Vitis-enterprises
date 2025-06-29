const nodemailer = require("nodemailer");
const ejs = require("ejs");
const pdf = require("html-pdf");
const path = require("path");

const sendInvoiceEmail = async (order, userEmail, userName) => {
  try {
    const templatePath = path.join(__dirname, "../views/invoice.ejs");
    const html = await ejs.renderFile(templatePath, { order, userName });

    pdf.create(html).toBuffer(async (err, buffer) => {
      if (err) throw err;
  
      const transporter = nodemailer.createTransport({
        service: "gmail",
        auth: {
          user: process.env.EMAIL_USER,
          pass: process.env.EMAIL_PASS,
        },
      });

      const mailOptions = {
        from: `"Vitis Enterprises" <${process.env.EMAIL_USER}>`,
        to: userEmail,
        subject: `Your Vitis Enterprises Order #${order._id.toString().slice(-8).toUpperCase()}`,
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <h2 style="color: #639f74;">Thank you for your order!</h2>
            <p>Dear ${userName},</p>
            <p>Your order with Vitis Enterprises has been successfully placed. Please find your invoice attached.</p>
            <p>We appreciate your business and hope you enjoy your purchase!</p>
            
            <div style="text-align: center; margin: 30px 0;">
              <a href="https://vitisenterprises.com" 
                 style="display: inline-block; padding: 10px 20px; background-color: #3498db; 
                        color: white; text-decoration: none; border-radius: 4px;">
                Shop Again
              </a>
            </div>
            
            <p style="font-size: 12px; color: #7f8c8d;">
              If you have any questions, please contact our customer support at support@vitisfoods.com
            </p>
          </div>
        `,
        attachments: [{
          filename: `Invoice-${order._id}.pdf`,
          content: buffer,
        }],
      };

      await transporter.sendMail(mailOptions);
    });
  } catch (err) {
    console.error("Error sending invoice email:", err);
  }
};

module.exports = sendInvoiceEmail;