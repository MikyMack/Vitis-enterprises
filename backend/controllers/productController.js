const Product = require('../models/Product');
const Cart = require('../models/Cart');
const Notification = require('../models/Notification');
const fs = require('fs');
const path = require('path');


exports.createProduct = async (req, res) => {
    try {

        const { title, category, productDescription } = req.body;
        
        // Validate required fields
        if (!title || !category || !productDescription) {
            return res.status(400).json({ error: 'Missing required fields' });
        }

        // Validate images
        if (!req.files || req.files.length < 1) {
            return res.status(400).json({ error: 'At least one image is required' });
        }

        const uploadsFolder = path.join(__dirname, '../../uploads');
        const imagePaths = req.files.map(file => `uploads/${path.basename(file.path)}`);

        // Ensure images exist in the uploads folder
        const allImagesValid = imagePaths.every(imagePath => fs.existsSync(path.join(uploadsFolder, path.basename(imagePath))));
        if (!allImagesValid) {
            return res.status(400).json({ message: 'Some images were not uploaded correctly' });
        }

        // Parse customerReviews safely
        let parsedCustomerReviews = [];
        if (req.body['customerReviews[0].title']) {
            try {
                parsedCustomerReviews = Object.keys(req.body)
                    .filter(key => key.startsWith('customerReviews'))
                    .reduce((acc, key) => {
                        const match = key.match(/customerReviews\[(\d+)\]\.(\w+)/);
                        if (match) {
                            const index = match[1];
                            const field = match[2];
                            acc[index] = acc[index] || {};
                            acc[index][field] = req.body[key];
                        }
                        return acc;
                    }, []);
            } catch (error) {
                return res.status(400).json({ error: 'Invalid customerReviews format' });
            }
        }

        // Parse measurements safely
        let parsedMeasurements = [];
        if (req.body['measurements[0].length']) {
            try {
                parsedMeasurements = Object.keys(req.body)
                    .filter(key => key.startsWith('measurements'))
                    .reduce((acc, key) => {
                        const match = key.match(/measurements\[(\d+)\]\.(\w+)/);
                        if (match) {
                            const index = match[1];
                            const field = match[2];
                            acc[index] = acc[index] || {};
                            acc[index][field] = Number(req.body[key]);
                        }
                        return acc;
                    }, []);
            } catch (error) {
                return res.status(400).json({ error: 'Invalid measurements format' });
            }
        }

        const newProduct = new Product({
            title,
            category,
            productDescription,
            customerReviews: parsedCustomerReviews,
            images: imagePaths,
            measurements: parsedMeasurements,
        });

        const savedProduct = await newProduct.save();

        // Create notification
        await Notification.create({
            title: 'New Product Added',
            message: `Product "${savedProduct.title}" was successfully added.`,
        });

        // Redirect to product list page
        res.redirect('/admin-products-list');
    } catch (error) {
        console.error('Error creating product:', error);
        res.status(500).json({ message: 'Error creating product', error: error.message });
    }
};

// Edit a Review inside a Product
exports.editReview = async (req, res) => {
    try {
        const { productId, reviewIndex } = req.params;
        const { title, description, date } = req.body;

        // Ensure that title, description, and date are provided
        if (!title || !description || !date) {
            return res.status(400).json({ error: 'Missing required fields' });
        }

        // Find the product by ID
        const product = await Product.findById(productId);
        if (!product) {
            return res.status(404).json({ success: false, message: 'Product not found' });
        }

        // Ensure that the review exists at the given index
        const review = product.customerReviews[reviewIndex];
        if (!review) {
            return res.status(404).json({ success: false, message: 'Review not found' });
        }

        // Update the review
        product.customerReviews[reviewIndex] = {
            ...review,
            title,
            description,
            date,
        };

        // Save the updated product
        await product.save();

        res.json({ success: true, review: product.customerReviews[reviewIndex] });
    } catch (error) {
        console.error('Error updating review:', error);
        res.status(500).json({ success: false, error: error.message });
    }
};

// Edit a Product
exports.editProduct = async (req, res) => {
    try {
        const { id } = req.params;
        const { title, category, productDescription } = req.body;

        // Ensure the product exists before making updates
        const product = await Product.findById(id);
        if (!product) {
            return res.status(404).json({ success: false, message: 'Product not found' });
        }

        // Validate required fields
        if (!title || !category || !productDescription) {
            return res.status(400).json({ error: 'Missing required fields' });
        }

        // Handle image uploads, retaining old images if none are provided
        let imagePaths = product.images;
        if (req.files && req.files.length > 0) {
            imagePaths = req.files.map(file => `uploads/${path.basename(file.path)}`);
        }

        const uploadsFolder = path.join(__dirname, '../../uploads');
        const allImagesValid = imagePaths.every(imagePath => fs.existsSync(path.join(uploadsFolder, path.basename(imagePath))));
        if (!allImagesValid) {
            return res.status(400).json({ message: 'Some images were not uploaded correctly' });
        }

        // Parse customerReviews safely
        let parsedCustomerReviews = [];
        if (req.body['customerReviews[0].title']) {
            try {
                parsedCustomerReviews = Object.keys(req.body)
                    .filter(key => key.startsWith('customerReviews'))
                    .reduce((acc, key) => {
                        const match = key.match(/customerReviews\[(\d+)\]\.(\w+)/);
                        if (match) {
                            const index = match[1];
                            const field = match[2];
                            acc[index] = acc[index] || {};
                            acc[index][field] = req.body[key];
                        }
                        return acc;
                    }, []);
            } catch (error) {
                return res.status(400).json({ error: 'Invalid customerReviews format' });
            }
        }

        // Parse measurements safely
        let parsedMeasurements = [];
        if (req.body['measurements[0].length']) {
            try {
                parsedMeasurements = Object.keys(req.body)
                    .filter(key => key.startsWith('measurements'))
                    .reduce((acc, key) => {
                        const match = key.match(/measurements\[(\d+)\]\.(\w+)/);
                        if (match) {
                            const index = match[1];
                            const field = match[2];
                            acc[index] = acc[index] || {};
                            acc[index][field] = Number(req.body[key]);
                        }
                        return acc;
                    }, []);
            } catch (error) {
                return res.status(400).json({ error: 'Invalid measurements format' });
            }
        }

        // Prepare the update object
        const updates = {
            title,
            category,
            productDescription,
            customerReviews: parsedCustomerReviews,
            images: imagePaths,
            measurements: parsedMeasurements,
        };

        // Update the product in the database
        const updatedProduct = await Product.findByIdAndUpdate(id, updates, { new: true });
        if (!updatedProduct) {
            return res.status(404).json({ success: false, message: 'Product not found' });
        }

        // Redirect to product list page if successful
        res.redirect('/admin-products-list');
    } catch (error) {
        console.error('Error updating product:', error);
        res.status(500).json({ success: false, error: error.message });
    }
};



// Delete a Product
exports.deleteProduct = async (req, res) => {
    try {
        const { id } = req.params;
        const product = await Product.findById(id);

        if (!product) {
            return res.status(404).json({ success: false, message: 'Product not found' });
        }

        // Delete images from the uploads folder
        if (product.images && product.images.length > 0) {
            product.images.forEach(imagePath => {
                const fullPath = path.join(process.cwd(), imagePath);
                if (fs.existsSync(fullPath)) {
                    fs.unlink(fullPath, (err) => {
                        if (err) {
                            console.error('Error deleting image:', err);
                        }
                    });
                }
            });
        }

        await Product.findByIdAndDelete(id);

        // Create a notification for product deletion
        await Notification.create({
            title: 'Product Deleted',
            message: `Product "${product.title}" was successfully deleted.`,
        });

        return res.status(200).json({ success: true, message: 'Product deleted successfully' });
    } catch (error) {
        console.error('Error deleting product:', error);
        res.status(500).json({ success: false, message: 'Error deleting product' });
    }
};



// Toggle a Product (Enable/Disable)
exports.toggleProduct = async (req, res) => {
    try {
        const { id } = req.params;
        const product = await Product.findById(id);
        product.toggled = !product.toggled;
        await product.save();

        res.status(200).json({ message: 'Product toggled successfully', toggled: product.toggled });
    } catch (error) {
        console.error('Error toggling product:', error);
        res.status(500).json({ message: 'Error toggling product' });
    }
};


// List all Products
exports.listProducts = async (req, res) => {
    try {
        const { page = 1, limit = 10, search = '' } = req.query; 
        const skip = (page - 1) * limit;

        const searchFilter = search
            ? {
                  $or: [
                      { title: { $regex: search, $options: 'i' } },
                      { category: { $regex: search, $options: 'i' } }, 
                  ],
              }
            : {};

        const products = await Product.find(searchFilter)
            .skip(skip)
            .limit(Number(limit));

        const totalProducts = await Product.countDocuments(searchFilter);

        res.render('admin-products-list', {
            products,
            totalProducts,
            currentPage: Number(page),
            totalPages: Math.ceil(totalProducts / limit), // Calculate total pages
            searchQuery: search, // Pass search query to the view
            limit: Number(limit), // Pass limit to the view
        });
    } catch (error) {
        console.error('Error fetching products:', error);
        res.status(500).json({ message: 'Error fetching products' });
    }
};
exports.getAllProducts = async (req, res) => {
    try {
        const products = await Product.find({}, '_id'); // Fetch only product IDs
        res.json({ success: true, products });
    } catch (error) {
        console.error("Error fetching products:", error);
        res.status(500).json({ success: false, message: "Server error" });
    }
};


exports.addToCart = async (req, res) => {
    try {
        const { productId, length, width, quantity } = req.body;

        const product = await Product.findById(productId);
        if (!product) return res.status(404).json({ message: "Product not found" });

        // Find the selected measurement
        const selectedMeasurement = product.measurements.find(
            (m) => m.length === length && m.width === width
        );

        if (!selectedMeasurement) {
            return res.status(400).json({ message: "Invalid measurement selected" });
        }

        // **Case 1: Logged-in User (Store in Database)**
        if (req.user) {
            let userCart = await Cart.findOne({ userId: req.user.id });

            if (!userCart) {
                userCart = new Cart({ userId: req.user.id, items: [] });
            }

            let existingItem = userCart.items.find(
                (item) => item.productId.toString() === productId &&
                          item.selectedMeasurement.length === length &&
                          item.selectedMeasurement.width === width
            );

            if (existingItem) {
                existingItem.quantity += quantity;
            } else {
                userCart.items.push({
                    productId,
                    title: product.title,
                    selectedMeasurement: {
                        length: selectedMeasurement.length,
                        width: selectedMeasurement.width,
                        price: selectedMeasurement.price,
                        offerPrice: selectedMeasurement.offerPrice || 0,
                    },
                    quantity
                });
            }

            await userCart.save();
            return res.json({ message: "Cart updated successfully", isGuest: false });
        }

        // **Case 2: Guest User (Handle on Frontend)**
        return res.json({
            message: "Guest user, handle cart in localStorage",
            isGuest: true,
            cartItem: {
                productId,
                title: product.title,
                selectedMeasurement: {
                    length: selectedMeasurement.length,
                    width: selectedMeasurement.width,
                    price: selectedMeasurement.price,
                    offerPrice: selectedMeasurement.offerPrice || 0,
                },
                quantity
            }
        });

    } catch (error) {
        console.error('Error adding to cart:', error);
        res.status(500).json({ message: 'Error adding to cart' });
    }
};


exports.displayCart = async (req, res) => {
    try {
        let cartItems = [];
        let isGuest = true;

        if (req.user) {
            // Logged-in User - Fetch cart from the database
            const userCart = await Cart.findOne({ userId: req.user.id }).populate("items.productId");
            if (userCart) {
                cartItems = userCart.items.map(item => ({
                    productId: item.productId._id, // Extract the product ID
                    title: item.productId.title, // Extract the product title
                    selectedMeasurement: item.selectedMeasurement, // Keep the selectedMeasurement object
                    quantity: item.quantity, // Keep the quantity
                    image: item.productId.images[0], // Extract the image URL
                }));
            }
            isGuest = false;
        } else {
            // Guest User - Fetch cart from cookies/localStorage (Handled on frontend)
            cartItems = []; // Local Storage cart will be handled on frontend
        }

        // Render the cart page with the cart items and guest status
        res.render("cart", { cartItems, isGuest });
    } catch (error) {
        console.error('Error displaying cart:', error);
        res.status(500).json({ message: 'Error displaying cart' });
    }
};

exports.updateCart = async (req, res) => {
    try {
        const { productId, quantity } = req.body;

        if (!req.user) {
            return res.status(401).json({ success: false, message: "Login required" });
        }

        const cart = await Cart.findOne({ userId: req.user.id });
        if (!cart) return res.status(404).json({ success: false, message: "Cart not found" });

        const item = cart.items.find(item => item.productId.toString() === productId);
        if (!item) return res.status(404).json({ success: false, message: "Item not found in cart" });

        item.quantity = quantity;
        await cart.save();

        const newTotal = item.selectedMeasurement.price * item.quantity;
        const cartTotal = cart.items.reduce((acc, item) => acc + item.selectedMeasurement.price * item.quantity, 0) + 100;

        res.status(200).json({ success: true, newTotal, cartTotal });
    } catch (error) {
        console.error("Error updating cart:", error);
        res.status(500).json({ success: false, message: "Error updating cart" });
    }
};

exports.removeFromCart = async (req, res) => {
    try {
        if (!req.user) {
            return res.status(401).json({ success: false, message: "Login required" });
        }

        const cart = await Cart.findOne({ userId: req.user.id });
        if (!cart) return res.status(404).json({ success: false, message: "Cart not found" });

        cart.items = cart.items.filter(item => item.productId.toString() !== req.params.productId);
        await cart.save();

        const cartTotal = cart.items.reduce((acc, item) => acc + item.selectedMeasurement.price * item.quantity, 0) + 100;

        res.status(200).json({ success: true, cartTotal });
    } catch (error) {
        console.error("Error removing from cart:", error);
        res.status(500).json({ success: false, message: "Error removing from cart" });
    }
};