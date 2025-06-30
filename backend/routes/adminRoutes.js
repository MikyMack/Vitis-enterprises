const express = require('express');
const app = express();
const {adminAuth} = require('../middleware/auth'); 

const authController =require('../controllers/authController')
const Category = require('../models/Category');
const Product = require('../models/Product');
const Testimonial = require('../models/Testimonial');
const Blogs = require('../models/Blog');
const Users = require('../models/User');
const Order = require('../models/Order');



// Admin Login Page
app.get('/login', (req, res) => {
    res.render('admin-login', { title: 'Admin Login' });
});
app.get('/logout', authController.logout);


// Admin Dashboard (Protected Route)
app.get('/dashboard', adminAuth, (req, res) => {
    res.render('admin-dashboard', { title: 'Admin Dashboard' });
});

// Manage banners (Protected Route)
app.get('/admin-banner', adminAuth, async (req, res) => {
    try {
        const banners = await Banner.find();
        res.render('admin-banner', { title: 'Manage Banners', banners }); 
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Error retrieving banners' });
    }
});

app.get('/admin-orders', adminAuth, async (req, res) => {
    try {
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 10; 

        let { status } = req.query;
        const filter = {};

        if (status && status !== 'all') {
            filter.status = status;
        }

        const skip = (page - 1) * limit;

        const orders = await Order.find(filter)
            .populate('user', 'name')
            .sort({ createdAt: -1 }) 
            .skip(skip)
            .limit(limit);

        const total = await Order.countDocuments(filter);

        res.render('admin-orders', { 
            title: 'Manage Orders',
            orders,
            currentPage: page,
            totalPages: Math.ceil(total / limit),
            limit,
            totalOrders: total,
            statusFilter: status || 'all' 
        });
        
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Error retrieving orders' });
    }
});
// Get single order
app.get('/orders/:id', adminAuth, async (req, res) => {
    try {
        const order = await Order.findById(req.params.id).populate('user', 'name');
        if (!order) return res.status(404).json({ message: 'Order not found' });
        res.json(order);
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Error fetching order' });
    }
});

// Update order status
app.put('/orders/update-status/:id', adminAuth, async (req, res) => {
    try {
        const { status } = req.body;
        if (!['Pending', 'Processing', 'Shipped', 'Delivered', 'Cancelled'].includes(status)) {
            return res.status(400).json({ message: 'Invalid status' });
        }

        const order = await Order.findByIdAndUpdate(
            req.params.id,
            { status },
            { new: true }
        );
        res.json({ success: true, order });
    } catch (err) {
        console.error(err);
        res.status(500).json({ success: false, message: 'Error updating status' });
    }
});

// Update order details
app.put('/orders/update/:id', adminAuth, async (req, res) => {
    try {
        const { status, estimatedDelivery } = req.body;
        const updateData = { 
            status,
            updatedAt: Date.now() 
        };
        
        if (estimatedDelivery) {
            updateData.estimatedDelivery = new Date(estimatedDelivery);
        }
        
        const order = await Order.findByIdAndUpdate(
            req.params.id,
            updateData,
            { new: true }
        );
        
        res.json({ success: true, order });
    } catch (err) {
        console.error(err);
        res.status(500).json({ success: false, message: 'Error updating order' });
    }
});
app.get('/admin-banners',adminAuth, (req, res) => {
    res.render('admin-banner');
  });


// manage proucts 
app.get('/admin-add-product', adminAuth, async (req, res) => {
    try {
        res.render('admin-add-product', { title: 'Manage products' }); 
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});
app.get('/admin-products-list', adminAuth, async (req, res) => {
    try {
        // Get page, limit, and search from query, default to 1, 10, and empty string
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 10;
        const skip = (page - 1) * limit;
        const searchQuery = req.query.search || '';

        // Build search filter if searchQuery is present
        const searchFilter = searchQuery
            ? {
                $or: [
                    { title: { $regex: searchQuery, $options: 'i' } },
                    { category: { $regex: searchQuery, $options: 'i' } },
                ]
            }
            : {};

        // Get total count for pagination (with search filter)
        const totalProducts = await Product.countDocuments(searchFilter);
        const totalPages = Math.ceil(totalProducts / limit);

        // Fetch products with pagination and search
        const products = await Product.find(searchFilter)
            .skip(skip)
            .limit(limit)
            .populate('category');

        res.render('admin-products-list', { 
            title: 'Manage products',
            products,
            page,
            limit,
            totalPages,
            totalProducts,
            searchQuery
        }); 
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});


app.get('/admin-edit-products/:id', adminAuth, async (req, res) => {
    try {
        const productId = req.params.id; 
        const product = await Product.findById(productId); 
        const categories = await Category.find(); 
        if (!product) {
            return res.status(404).send('Product not found');
        }
        res.render('admin-edit-product', {
            title: 'Edit Product',
            product,
            categories
        });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});
// manage categories 
app.get('/admin-category-list', adminAuth, (req, res) => {
    res.render('admin-category-list', { title: 'Manage categories' });
});
app.get('/admin-new-category', adminAuth, (req, res) => {
    res.render('admin-new-category', { title: 'Manage categories' });
});
app.get('/admin-edit-category/:id', adminAuth, async (req, res) => {
    try {
        const categoryId = req.params.id; 
        const category = await Category.findById(categoryId); 
        if (!category) {
            return res.status(404).send('Category not found');
        }
        res.render('admin-edit-category', {
            title: 'Edit Category',
            category
        });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});
// manage clients 

// manage testimonials 
app.get('/admin-testimonial', adminAuth, async (req, res) => {
    try {
        const testimonials = await Testimonial.find();
        res.render('admin-testimonial', { title: 'Manage testimonials', testimonials });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});
app.get('/admin-edit-testimonial/:id', adminAuth, async (req, res) => {
    try {
        const testimonialId = req.params.id;
        const testimonial = await Testimonial.findById(testimonialId);
        if (!testimonial) {
            return res.status(404).send('Testimonial not found');
        }
        res.render('admin-edit-testimonials', {
            title: 'Edit Testimonial',
            testimonial
        });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

app.get('/admin-add-testimonials', adminAuth, (req, res) => {
    res.render('admin-add-testimonials', { title: 'Manage testimonials' });
});

// manage blogs 
app.get('/admin-blogs', adminAuth, async (req, res) => {
    try {
        const blogs = await Blogs.find();
        res.render('admin-blogs', { title: 'Manage testimonials', blogs });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});
app.get('/admin-edit-blog/:id', adminAuth, async (req, res) => {
    try {
        const blogId = req.params.id;
        const blog = await Blogs.findById(blogId);
        if (!blog) {
            return res.status(404).send('blog not found');
        }
        res.render('admin-edit-blog', {
            title: 'Edit blogs',
            blog
        });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

app.get('/admin-add-blogs', adminAuth, (req, res) => {
    res.render('admin-add-blogs', { title: 'Manage blogs' });
});

app.get('/admin-users', adminAuth, async (req, res) => {
    try {
        const users = await Users.find();
        res.render('admin-users', { title: 'Manage users', users });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});
app.get('/admin-block-user/:id', adminAuth, async (req, res) => {
    try {
        const userId = req.params.id;
        const user = await Users.findById(userId);
        if (!user) {
            return res.status(404).send('User not found');
        }
        user.blocked = true;
        await user.save();
        res.redirect('/admin-users');
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

app.get('/admin-new-users', adminAuth, (req, res) => {
    res.render('admin-new-users', { title: 'Manage user' });
});

module.exports = app;
