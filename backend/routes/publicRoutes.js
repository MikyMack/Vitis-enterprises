const express = require('express');
const router = express.Router();
// const Category = require('../models/Category');
const Product = require('../models/Product');
const User = require('../models/User');
const Blog = require('../models/Blog');
const Cart = require('../models/Cart');
const Order = require('../models/Order');
// const Testimonial = require('../models/Testimonial');
const jwt = require('jsonwebtoken');

router.get('/', async (req, res) => {
    try {
        const token = req.cookies.token;
        let user = null;
        let products = [];
        let blogs = [];
        
        if (token) {
            try {
                const decoded = jwt.verify(token, process.env.SESSION_SECRET);
                user = await User.findById(decoded.id);
            } catch (err) {
                console.error("JWT Verification Error:", err);
            }
        }

        try {
            products = await Product.find();
        } catch (err) {
            console.error("Error fetching products:", err);
        }

        try {
            blogs = await Blog.find();
        } catch (err) {
            console.error("Error fetching blogs:", err);
        }

        res.render('index', { title: 'Home', user, products, blogs }); 
    } catch (error) {
     const  blogs = await Blog.find();
        res.render('index', { title: 'Home', user: null, products: [], blogs});
    }
});

router.get('/user-login', async (req, res) => {
    try {
        res.render('userLogin', { title: 'Login page' });
    } catch (error) {
        res.status(500).send('Error loading login page');
    }
});
router.get('/user-register', async (req, res) => {
    try {
        res.render('userRegister', { title: 'Register page' });
    } catch (error) {
        res.status(500).send('Error loading register page');
    }
});
router.get('/otp-page', async (req, res) => {
    try {
        res.render('userOtp', { title: 'Otp page' });
    } catch (error) {
        res.status(500).send('Error loading otp page');
    }
});

router.get("/forgot-password", (req, res) => {
    res.render("forgot-password");
});
router.get("/reset-password", (req, res) => {
    res.render("resetPassword");
});




// About Page
router.get('/about', async (req, res) => {
    try {
        const token = req.cookies.token;
        let user = null;
        if (token) {
            try {
                const decoded = jwt.verify(token, process.env.SESSION_SECRET);

                user = await User.findById(decoded.id);
            } catch (err) {
                console.error("JWT Verification Error:", err);
            }
        }
        res.render('about', { title: 'About Us', user });
    } catch (error) {
        res.status(500).render('about', { title: 'About Us', user: null });
    }
});
// About Page
router.get('/shop', async (req, res) => {
    const products = await Product.find();
    try {
      
        const token = req.cookies.token;
        let user = null;
        if (token) {
            try {
                const decoded = jwt.verify(token, process.env.SESSION_SECRET);

                user = await User.findById(decoded.id);
            } catch (err) {
                console.error("JWT Verification Error:", err);
            }
        }
        // Fetch products from the database
        res.render('shop', { title: 'Shop page', user, products });
    } catch (error) {
        res.status(500).render('shop', { title: 'Shop page', user: null, products});
    }
});




// Contact Page
router.get('/services', async (req, res) => {
    try {
        const token = req.cookies.token;
        let user = null;
        if (token) {
            try {
                const decoded = jwt.verify(token, process.env.SESSION_SECRET);

                user = await User.findById(decoded.id);
            } catch (err) {
                console.error("JWT Verification Error:", err);
            }
        }
        res.render('services', { title: 'Services', user });
    } catch (error) {
        res.status(500).render('services', { title: 'Services', user: null });
    }
});
router.get('/orders', async (req, res) => {
    try {
        const token = req.cookies.token;
        let user = null;
        let currentOrders = [];
        let completedOrders = [];
        let currentOrderProducts = [];
        let completedOrderProducts = [];
        
        if (token) {
            try {
                const decoded = jwt.verify(token, process.env.SESSION_SECRET);

                user = await User.findById(decoded.id);
                if (user) {
                    currentOrders = await Order.find({ user: user._id, status: { $ne: 'Delivered' } }).populate('items.product');
                    completedOrders = await Order.find({ user: user._id, status: 'Delivered' }).populate('items.product');
                    
                    currentOrderProducts = await Promise.all(currentOrders.map(async order => {
                        return await Promise.all(order.items.map(async item => {
                            const product = await Product.findById(item.product._id);
                            return { ...item.product.toObject(), image: product.images[0] };
                        }));
                    }));

                    completedOrderProducts = await Promise.all(completedOrders.map(async order => {
                        return await Promise.all(order.items.map(async item => {
                            const product = await Product.findById(item.product._id);
                            return { ...item.product.toObject(), image: product.images[0] };
                        }));
                    }));
                }
            } catch (err) {
                console.error("JWT Verification Error:", err);
            }
        }
        res.render('orders', { title: 'orders', user, currentOrders, completedOrders, currentOrderProducts, completedOrderProducts });
    } catch (error) {
        res.status(500).render('userLogin', { title: 'user Login', user: null });
    }
});

router.get('/blogs', async (req, res) => {
    try {
        const token = req.cookies.token;
        let user = null;
        if (token) {
            try {
                const decoded = jwt.verify(token, process.env.SESSION_SECRET);

                user = await User.findById(decoded.id);
            } catch (err) {
                console.error("JWT Verification Error:", err);
            }
        }
        const blogs = await Blog.find();
        res.render('blogs', { title: 'Blogs', user, blogs });
    } catch (error) {
        const blogs = await Blog.find();
        res.status(500).render('blogs', { title: 'Blogs', user: null, blogs });
    }
});

// Blog Details Page
router.get('/blog-details/:id', async (req, res) => {
    try {
        const token = req.cookies.token;
        let user = null;
        if (token) {
            try {
                const decoded = jwt.verify(token, process.env.SESSION_SECRET);
                user = await User.findById(decoded.id);
            } catch (err) {
                console.error("JWT Verification Error:", err);
            }
        }
        const blogId = req.params.id;
        const blog = await Blog.findById(blogId);
        if (!blog) {
            return res.status(404).render('404', { title: 'Blog Not Found', user });
        }
        res.render('blog-details', { title: blog.title, user, blog });
    } catch (error) {
     
        const blogId = req.params.id;
        const blog = await Blog.findById(blogId);
        res.status(500).render('blog-details', { title: 'Blog Details', user: null, blog });
    }
});

// Contact Page
router.get('/contact', async (req, res) => {
    try {
        const token = req.cookies.token;
        let user = null;
        if (token) {
            try {
                const decoded = jwt.verify(token, process.env.SESSION_SECRET);

                user = await User.findById(decoded.id);
            } catch (err) {
                console.error("JWT Verification Error:", err);
            }
        }
        res.render('contact', { title: 'Contact Us', user });
    } catch (error) {
        res.status(500).render('contact', { title: 'Contact Us', user: null });
    }
});
router.get('/checkout', async (req, res) => {
    try {
        const token = req.cookies.token;
        let user = null;
        let cart = null;
        let cartItems = [];
        let totalAmount = 0;

        if (token) {
            try {
                const decoded = jwt.verify(token, process.env.SESSION_SECRET);
                user = await User.findById(decoded.id);

                if (user) {
                    // Fetch the cart of the logged-in user
                    cart = await Cart.findOne({ userId: user._id }).populate('items.productId');

                    if (cart) {
                        cartItems = cart.items;
                        totalAmount = cartItems.reduce((total, item) => {
                            return total + (item.selectedMeasurement.offerPrice || item.selectedMeasurement.price) * item.quantity;
                        }, 0);
                    }
                }
            } catch (err) {
                console.error("JWT Verification Error:", err);
            }
        }

        res.render('checkout', { 
            title: 'Checkout Page', 
            user, 
            cartItems, 
            totalAmount 
        });
    } catch (error) {
        console.error("Checkout Page Error:", error);
        res.status(500).render('user-login', { title: 'Login' });
    }
});
// router.get('/return-policy&shipping', async (req, res) => {
//     try {
//         const categories = await Category.find();
//         res.render('returnPolicy', { title: 'Return Policy and Shipping', logos, categories });
//     } catch (error) {
//         console.error(error);
//         res.status(500).send('Error loading return policy page data');
//     }
// });
// router.get('/terms&conditions', async (req, res) => {
//     try {
//         const categories = await Category.find();
//         res.render('terms-and-conditions', { title: 'terms and conditions Privacy Policy', logos, categories });
//     } catch (error) {
//         console.error(error);
//         res.status(500).send('Error loading return policy page data');
//     }
// });

// Product Details Page
router.get('/product-details/:id', async (req, res) => {
    try {
        const token = req.cookies.token;
        let user = null;
        if (token) {
            try {
                const decoded = jwt.verify(token, process.env.SESSION_SECRET);

                user = await User.findById(decoded.id);
            } catch (err) {
                console.error("JWT Verification Error:", err);
            }
        }
        const productId = req.params.id;
        const product = await Product.findById(productId);
        if (!product || !product.toggled) {
            return res.status(404).send('Product not found');
        }
        res.render('product-details', { title: 'Product Details', product,user });
    } catch (error) {
        const productId = req.params.id;
        const product = await Product.findById(productId);
        res.render('product-details', { title: 'Product Details', product,user:null });
    }
});

router.post("/payu/failure", (req, res) => {
    res.render("failure");
});

module.exports = router;
