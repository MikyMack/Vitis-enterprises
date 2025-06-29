const path = require("path");
const ejs = require("ejs");
const nodemailer = require("nodemailer");
const puppeteer = require("puppeteer");

const sendInvoiceEmail = async (order, userEmail, userName) => {
  try {
    const templatePath = path.join(process.cwd(), "views/invoice.ejs");
    const html = await ejs.renderFile(templatePath, { order, userName });

    // Launch headless Chrome
    const browser = await puppeteer.launch();
    const page = await browser.newPage();
    await page.setContent(html, { waitUntil: "networkidle0" });

    const pdfBuffer = await page.pdf({ format: "A4" });
    await browser.close();

    // Email setup
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
      subject: `Your Vitis Order #${order._id.toString().slice(-8).toUpperCase()}`,
      text: "Thanks for your order! Please find your invoice attached.",
      attachments: [
        {
          filename: `Invoice-${order._id}.pdf`,
          content: pdfBuffer,
        },
      ],
    };

    await transporter.sendMail(mailOptions);
    console.log("Invoice email sent to", userEmail);
  } catch (err) {
    console.error("Error sending invoice email:", err);
  }
};



module.exports = sendInvoiceEmail;