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
        text: "Thank you for your order. Please find your invoice attached.",
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