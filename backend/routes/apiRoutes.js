const express = require('express');
const router = express.Router();
const upload = require('../middleware/upload');
const User =require('../models/User')
const categoryController = require('../controllers/categoryController'); 
const authController = require('../controllers/authController'); 
const productController = require('../controllers/productController');
const blogsController = require('../controllers/blogsController');
const testimonialController = require('../controllers/testimonialController');
const notificationController = require('../controllers/notificationCOntroller');
const mainBannerCtrl = require('../controllers/mainBannerController');
const bannerTwoCtrl = require('../controllers/bannerTwoController');
const bannerThreeCtrl = require('../controllers/bannerThreeController');
const Notification=require('../models/Notification')
const nodemailer = require('nodemailer');
const authenticateUser = require('../middleware/auth');
const PDFDocument = require('pdfkit');



const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
        user: process.env.EMAIL_USER, 
        pass: process.env.EMAIL_PASS
    }
});


router.get('/main', mainBannerCtrl.getAll);
router.post('/main', upload.single('image'), mainBannerCtrl.create);
router.put('/main/:id', upload.single('image'), mainBannerCtrl.update);
router.delete('/main/:id', mainBannerCtrl.delete);
router.patch('/main/:id/toggle', mainBannerCtrl.toggleStatus);

// Banner Two Routes
router.get('/two', bannerTwoCtrl.getAll);
router.post('/two', upload.single('image'), bannerTwoCtrl.create);
router.put('/two/:id', upload.single('image'), bannerTwoCtrl.update);
router.delete('/two/:id', bannerTwoCtrl.delete);
router.patch('/two/:id/toggle', bannerTwoCtrl.toggleStatus);

// Banner Three Routes
router.get('/three', bannerThreeCtrl.getAll);
router.post('/three', upload.single('image'), bannerThreeCtrl.create);
router.put('/three/:id', upload.single('image'), bannerThreeCtrl.update);
router.delete('/three/:id', bannerThreeCtrl.delete);
router.patch('/three/:id/toggle', bannerThreeCtrl.toggleStatus);

// Product Routes
router.post('/products/create', upload.array('productsImages', 4), productController.createProduct);         // Create a Product
router.put('/products/edit/:id', upload.array('productsImages', 4), productController.editProduct);          // Edit a Product
router.delete('/products/delete/:id', productController.deleteProduct);   
router.put('/products/toggle/:id', productController.toggleProduct);     
router.get('/products', productController.listProducts);    
router.get('/products/all', productController.getAllProducts);    
router.put('/products/edit-review/:productId/:reviewIndex', productController.editReview);              // List all Products


// Category Routes
router.post('/categories/create', upload.array('categoryImage', 2), categoryController.createCategory);  // Create Category
router.get('/categories', categoryController.getAllCategories);        // Get all Categories
router.get('/categories/:id', categoryController.getCategoryById);     // Get single Category by ID
router.put('/categories/edit/:id', upload.array('categoryImage', 2), categoryController.editCategory);   // Edit Category
router.delete('/categories/delete/:id', categoryController.deleteCategory);  // Delete Category
router.put('/categories/toggle/:id', categoryController.toggleCategory);    // Toggle category images

// Routes for managing testimonials
router.post('/testimonials/create', upload.single('profilePic'), testimonialController.createTestimonial); // Create Testimonial
router.get('/testimonials', testimonialController.getAllTestimonials);                                   // Get all Testimonials
router.put('/testimonials/edit/:id', upload.single('profilePic'), testimonialController.editTestimonial); // Edit Testimonial
router.put('/testimonials/toggle/:id', testimonialController.toggleTestimonial);                        // Toggle Testimonial
router.delete('/testimonials/delete/:id', testimonialController.deleteTestimonial);   
                  // Delete Testimonial
// Routes for managing blog
router.post('/blog/create', upload.single('blogImage'), blogsController.createBlog); // Create Testimonial
router.get('/blogs', blogsController.getAllBlogs);                                   // Get all Testimonials
router.put('/blogs/edit/:id', upload.single('profilePic'), blogsController.editBlog); // Edit Testimonial                      // Toggle Testimonial
router.delete('/blogs/delete/:id', blogsController.deleteBlog);                     // Delete Testimonial


router.get('/notifications', async (req, res) => {
    try {
        const notifications = await Notification.find().sort({ createdAt: -1 }).limit(10);
        res.json(notifications);
    } catch (error) {
        res.status(500).json({ message: 'Error fetching notifications', error: error.message });
    }
});
router.post('/send-contact', async (req, res) => {
    const { name, email, phone, message } = req.body;
    if (!name || !email || !phone || !message) {
        return res.status(400).send('Please fill in all required fields.');
    }

    const mailOptions = {
        from: process.env.EMAIL_USER,
        to: process.env.EMAIL_USER,
        subject: 'Vitis Enquiry Form',
        text: `Name: ${name}\nEmail: ${email}\nPhone: ${phone}\nMessage: ${message}`
    };

    try {
        await transporter.sendMail(mailOptions);
        res.send(`
            <style>
                .alert-box {
                    position: fixed;
                    top: 50%;
                    left: 50%;
                    transform: translate(-50%, -50%);
                    background-color: #28a745;
                    color: white;
                    padding: 20px;
                    border-radius: 8px;
                    box-shadow: 0 4px 8px rgba(0, 0, 0, 0.2);
                    z-index: 1000;
                    font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif;
                    font-size: 18px;
                    text-align: center;
                }
                .alert-buttons {
                    margin-top: 10px;
                }
                .alert-button {
                    background-color: #ffffff;
                    color: #28a745;
                    border: none;
                    padding: 10px 20px;
                    border-radius: 5px;
                    cursor: pointer;
                    font-size: 16px;
                    margin: 5px;
                }
                .alert-button:hover {
                    background-color: #f1f1f1;
                }
            </style>
            <div class="alert-box">
                Thank you! Your message has been sent successfully.
                <div class="alert-buttons">
                    <button class="alert-button" onclick="window.location.href='/contact'">OK</button>
                    <button class="alert-button" onclick="window.history.back()">Back</button>
                </div>
            </div>
        `);
    } catch (error) {
        console.error('Error sending email:', error);
        res.status(500).send('Failed to send message.');
    }
});



router.put('/notifications/read/:id', notificationController.markAsRead);
router.put('/notifications/read-all', notificationController.markAllAsRead);


router.put('/add-to-cart', authenticateUser, productController.addToCart);
router.get('/cart',productController.displayCart);
router.put("/update-cart/:itemId", productController.updateCartItem);
router.delete("/remove-from-cart/:itemId", productController.removeFromCart);

router.put('/admin-make-admin/:id', authController.makeAdmin);
router.put('/admin-block-user/:id', authController.blockUser);
router.put('/admin-remove-admin/:id', authController.removeAdmin);
router.put('/admin-unblock-user/:id', authController.unblockUser);

router.get('/download-user-list', async (req, res) => {
    try {
        const format = req.query.format; // Get the format (csv or pdf)
        const users = await User.find(); // Fetch all users

        if (format === 'pdf') {
            // Create a PDF document
            const doc = new PDFDocument();
            res.setHeader('Content-Type', 'application/pdf');
            res.setHeader('Content-Disposition', 'attachment; filename=user-list.pdf');
            doc.pipe(res);

            // Add content to the PDF
            doc.fontSize(14).text('User List', { align: 'center' });
            doc.moveDown();

            users.forEach(user => {
                doc.fontSize(12).text(`Name: ${user.name}`);
                doc.text(`Email: ${user.email}`);
                doc.text(`Mobile No: ${user.mobile}`);
                doc.text(`Role: ${user.isAdmin ? 'Admin' : 'User'}`);
                doc.text(`Status: ${user.blocked ? 'Blocked' : 'Active'}`);
                doc.moveDown();
            });

            doc.end();
        } else if (format === 'csv') {
             // Generate CSV content
             let csvContent = 'Name,Email,Mobile No,Role,Status\n'; // CSV header
             users.forEach(user => {
                 csvContent += `${user.name},${user.email},${user.mobile},${user.isAdmin ? 'Admin' : 'User'},${user.blocked ? 'Blocked' : 'Active'}\n`;
             });
 
             // Set response headers for CSV download
             res.setHeader('Content-Type', 'text/csv');
             res.setHeader('Content-Disposition', 'attachment; filename=user-list.csv');
             res.send(csvContent);
        } else {
            res.status(400).json({ success: false, message: 'Invalid format' });
        }
    } catch (error) {
        console.error('Error generating user list:', error);
        res.status(500).json({ success: false, message: error.message });
    }
});



module.exports = router;
