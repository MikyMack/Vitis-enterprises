const express = require('express');
const router = express.Router();
// const Category = require('../models/Category');
const Product = require('../models/Product');
const User = require('../models/User');
const Blog = require('../models/Blog');
const Cart = require('../models/Cart');
const Order = require('../models/Order');
const MainBanner = require('../models/MainBanner');
const BannerTwo = require('../models/BannerTwo');
const BannerThree = require('../models/BannerThree');
// const Testimonial = require('../models/Testimonial');
const jwt = require('jsonwebtoken');

router.get('/', async (req, res) => {
    try {
        const token = req.cookies.token;
        let user = null;
        let productsGeneral = [];
        let productsMedical = [];
        let blogs = [];
        let cartCount = 0;
        const search = req.query.search || '';
        if (token) {
            try {
                const decoded = jwt.verify(token, process.env.SESSION_SECRET);
                user = await User.findById(decoded.id);
                // Fetch cart count for logged-in user
                const cart = await Cart.findOne({ userId: decoded.id });
                if (cart && Array.isArray(cart.items)) {
                    cartCount = cart.items.length;
                }
            } catch (err) {
                console.error("JWT Verification Error:", err);
            }
        }
        const mainBanner = await MainBanner.find({ isActive: true });
        const bannerTwo = await BannerTwo.find({ isActive: true });
        const bannerThree = await BannerThree.find({ isActive: true });

        try {
            productsGeneral = await Product.find({ toggled: true, category: "General" });
        } catch (err) {
            console.error("Error fetching General products:", err);
        }

        try {
            productsMedical = await Product.find({ toggled: true, category: "Healthcare" });
        } catch (err) {
            console.error("Error fetching Medical products:", err);
        }
        const allProducts = await Product.find({ toggled: true }).sort({ createdAt: -1 }).limit(10);

        try {
            blogs = await Blog.find();
        } catch (err) {
            console.error("Error fetching blogs:", err);
        }
        res.render('index', {
            title: 'Home',
            user,
            productsGeneral,
            productsMedical,
            blogs,
            mainBanner,
            bannerTwo,
            bannerThree,
            allProducts,
            cartCount,
            search 
        });
    } catch (error) {
        const blogs = await Blog.find();
        res.render('index', {
            title: 'Home',
            user: null,
            productsGeneral: [],
            productsMedical: [],
            blogs,
            mainBanner: [],
            bannerTwo: [],
            bannerThree: [],
            allProducts: [],
            cartCount: 0,
            search :''
        });
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
        const search = req.query.search;
        if (search && search.trim()) {
            const regex = new RegExp(search.trim(), 'i');

            filter.$or = [
                { title: regex },
                { category: regex },
                { 'productDescription.point': regex },
                { 'colorVariants.colorName': regex }
            ];
        }
        res.render('about', { title: 'About Us', user,search });
    } catch (error) {
        res.status(500).render('about', { title: 'About Us', user: null,search:''});
    }
});
// About Page
router.get('/shop', async (req, res) => {
    try {

        const page = parseInt(req.query.page) > 0 ? parseInt(req.query.page) : 1;
        const perPage = parseInt(req.query.limit) > 0 ? parseInt(req.query.limit) : 12;
        const skip = (page - 1) * perPage;

        const sort = req.query.sort || '';
        const category = req.query.category;

        let filter = { toggled: true };
        const search = req.query.search;
        if (search && search.trim()) {
            const regex = new RegExp(search.trim(), 'i');

            filter.$or = [
                { title: regex },
                { category: regex },
                { 'productDescription.point': regex },
                { 'colorVariants.colorName': regex }
            ];
        }
        if (category && (category === "General" || category === "Healthcare")) {
            filter.category = category;
        }

        let sortObj = {};
        if (sort === 'popularity') {
            sortObj = { _id: -1 };
        } else if (sort === 'new') {
            sortObj = { _id: -1 };
        } else if (sort === 'price-asc') {
            sortObj = { basePrice: 1 };
        } else if (sort === 'price-desc') {
            sortObj = { basePrice: -1 };
        } else {
            sortObj = { _id: -1 };
        }

        const totalProducts = await Product.countDocuments(filter);

        const products = await Product.find(filter)
            .sort(sortObj)
            .skip(skip)
            .limit(perPage);

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
        const categories = ["General", "Healthcare"];

        res.render('shop', {
            title: 'Shop page',
            user,
            products,
            page,
            perPage,
            totalPages: Math.ceil(totalProducts / perPage),
            totalProducts,
            sort,
            selectedCategory: category || '',
            categories,
            search
        });
    } catch (error) {
        console.error("Shop Page Error:", error);
        res.status(500).render('shop', {
            title: 'Shop page',
            user: null,
            products: [],
            page: 1,
            perPage: 12,
            totalPages: 1,
            totalProducts: 0,
            sort: '',
            selectedCategory: '',
            categories: ["General", "Healthcare"],
            search: ''
        });
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
        const search = req.query.search;
        if (search && search.trim()) {
            const regex = new RegExp(search.trim(), 'i');

            filter.$or = [
                { title: regex },
                { category: regex },
                { 'productDescription.point': regex },
                { 'colorVariants.colorName': regex }
            ];
        }
        res.render('orders', { title: 'orders', user, currentOrders, completedOrders, currentOrderProducts, completedOrderProducts,search });
    } catch (error) {
        res.status(500).render('userLogin', { title: 'user Login', user: null,search:'' });
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
        const search = req.query.search;
        if (search && search.trim()) {
            const regex = new RegExp(search.trim(), 'i');

            filter.$or = [
                { title: regex },
                { category: regex },
                { 'productDescription.point': regex },
                { 'colorVariants.colorName': regex }
            ];
        }
        const blogs = await Blog.find();
        res.render('blogs', { title: 'Blogs', user, blogs,search });
    } catch (error) {
        const blogs = await Blog.find();
        res.status(500).render('blogs', { title: 'Blogs', user: null, blogs,search:'' });
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
        const search = req.query.search;
        if (search && search.trim()) {
            const regex = new RegExp(search.trim(), 'i');

            filter.$or = [
                { title: regex },
                { category: regex },
                { 'productDescription.point': regex },
                { 'colorVariants.colorName': regex }
            ];
        }
        const blogId = req.params.id;
        const blog = await Blog.findById(blogId);
        if (!blog) {
            return res.status(404).render('404', { title: 'Blog Not Found', user });
        }
        res.render('blog-details', { title: blog.title, user, blog,search });
    } catch (error) {

        const blogId = req.params.id;
        const blog = await Blog.findById(blogId);
        res.status(500).render('blog-details', { title: 'Blog Details', user: null, blog ,search:''});
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
        const search = req.query.search;
        if (search && search.trim()) {
            const regex = new RegExp(search.trim(), 'i');

            filter.$or = [
                { title: regex },
                { category: regex },
                { 'productDescription.point': regex },
                { 'colorVariants.colorName': regex }
            ];
        }
        res.render('contact', { title: 'Contact Us', user,search });
    } catch (error) {
        res.status(500).render('contact', { title: 'Contact Us', user: null,search:'' });
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
                            // Safely calculate price with fallbacks
                            const price = item.selectedMeasurement?.offerPrice ||
                                item.selectedMeasurement?.price ||
                                item.selectedColor?.offerPrice ||
                                item.selectedColor?.price ||
                                item.productId?.baseOfferPrice ||
                                item.productId?.basePrice ||
                                0;
                            return total + (price * item.quantity);

                        }, 0);
                    }
                }
            } catch (err) {
                console.error("JWT Verification Error:", err);
            }
        }

        // Ensure totalAmount is a valid number
        if (isNaN(totalAmount)) {
            console.error("Invalid totalAmount calculation - setting to 0");
            totalAmount = 0;
        }
        const search = req.query.search;
        if (search && search.trim()) {
            const regex = new RegExp(search.trim(), 'i');

            filter.$or = [
                { title: regex },
                { category: regex },
                { 'productDescription.point': regex },
                { 'colorVariants.colorName': regex }
            ];
        }
        res.render('checkout', {
            title: 'Checkout Page',
            user,
            cartItems,
            totalAmount: totalAmount.toFixed(2),
            search
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
router.get('/product/:id', async (req, res) => {
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
        const search = req.query.search;
        if (search && search.trim()) {
            const regex = new RegExp(search.trim(), 'i');

            filter.$or = [
                { title: regex },
                { category: regex },
                { 'productDescription.point': regex },
                { 'colorVariants.colorName': regex }
            ];
        }
        const category = product.category;

        const relatedProducts = await Product.find({
            _id: { $ne: product._id },
            category: category,
            toggled: true
        }).limit(8);

        res.render('product-details', {
            title: 'Product Details',
            product,
            user,
            category,
            relatedProducts,
            search
        });
    } catch (error) {
        try {
            const productId = req.params.id;
            const product = await Product.findById(productId);
            let category = product ? product.category : null;
            let relatedProducts = [];
            if (product && category) {
                relatedProducts = await Product.find({
                    _id: { $ne: product._id },
                    category: category,
                    toggled: true
                }).limit(8);
            }
            res.render('product-details', {
                title: 'Product Details',
                product,
                user: null,
                category,
                relatedProducts,
                search:''
            });
        } catch (err) {
            res.status(500).send('Error loading product details');
        }
    }
});

router.post("/payu/failure", (req, res) => {
    res.render("failure");
});

module.exports = router;
