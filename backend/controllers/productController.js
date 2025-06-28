const mongoose = require('mongoose');
const Product = require('../models/Product');
const Cart = require('../models/Cart');
const Notification = require('../models/Notification');
const fs = require('fs');
const path = require('path');


const parseNestedArray = (req, prefix) => {
  const result = [];
  let index = 0;
  
  while (true) {
    const keys = Object.keys(req.body).filter(key => 
      key.startsWith(`${prefix}[${index}]`)
    );
    
    if (keys.length === 0) break;
    
    const item = {};
    keys.forEach(key => {
      const match = key.match(new RegExp(`${prefix}\\[${index}\\]\\.(\\w+)`));
      if (match) {
        const field = match[1];
        item[field] = req.body[key];
      }
    });
    
    result.push(item);
    index++;
  }
  
  return result;
};

// Create a new product
exports.createProduct = async (req, res) => {
  try {
    const { title, category, basePrice, baseOfferPrice, baseStocks } = req.body;

    if (!title || !category) {
      return res.status(400).json({ error: 'Title and category are required' });
    }

    if (!req.files || req.files.length < 1 || req.files.length > 4) {
      return res.status(400).json({ error: 'Between 1 and 4 images are required' });
    }

    const imagePaths = req.files.map(file => `uploads/${file.filename}`);

    const productDescription = parseNestedArray(req, 'productDescription');

    const colorVariantsRaw = parseNestedArray(req, 'colorVariants');
    const colorVariants = colorVariantsRaw
      .filter(variant => variant.colorName && variant.colorName.trim() !== '')
      .map(variant => ({
        colorName: variant.colorName,
        colorCode: variant.colorCode || '',
        price: variant.price ? Number(variant.price) : 0,
        offerPrice: variant.offerPrice ? Number(variant.offerPrice) : undefined,
        stocks: variant.stocks ? Number(variant.stocks) : 0
      }));

    const measurementsRaw = parseNestedArray(req, 'measurements');
    const measurements = measurementsRaw
      .filter(measure => measure.measurement && measure.measurement.trim() !== '')
      .map(measure => ({
        measurement: measure.measurement,
        price: measure.price ? Number(measure.price) : 0,
        offerPrice: measure.offerPrice ? Number(measure.offerPrice) : undefined,
        stocks: measure.stocks ? Number(measure.stocks) : 0
      }));

    const customerReviews = parseNestedArray(req, 'customerReviews');

    const newProduct = new Product({
      title,
      category,
      productDescription,
      images: imagePaths,
      basePrice: basePrice ? Number(basePrice) : undefined,
      baseOfferPrice: baseOfferPrice ? Number(baseOfferPrice) : undefined,
      baseStocks: baseStocks ? Number(baseStocks) : undefined,
      colorVariants: colorVariants.length > 0 ? colorVariants : undefined,
      measurements: measurements.length > 0 ? measurements : undefined,
      customerReviews,
      toggled: true
    });

    const savedProduct = await newProduct.save();

    // Create notification
    await Notification.create({
      title: 'New Product Added',
      message: `Product "${savedProduct.title}" was successfully added.`,
    });

    res.redirect('/admin-products-list');
  } catch (error) {
    console.error('Error creating product:', error);
    res.status(500).json({
      success: false,
      message: 'Error creating product',
      error: error.message
    });
  }
};

// Get all products
exports.listProducts = async (req, res) => {
  try {
    const { page = 1, limit = 10, search = '' } = req.query;
    const skip = (page - 1) * limit;

    const searchFilter = search ? {
      $or: [
        { title: { $regex: search, $options: 'i' } },
        { category: { $regex: search, $options: 'i' } },
      ]
    } : {};

    const products = await Product.find(searchFilter)
      .skip(skip)
      .limit(Number(limit))
      .sort({ createdAt: -1 });

    const totalProducts = await Product.countDocuments(searchFilter);

    res.json({
      success: true,
      products,
      totalProducts,
      currentPage: Number(page),
      totalPages: Math.ceil(totalProducts / limit),
      searchQuery: search,
      limit: Number(limit)
    });

  } catch (error) {
    console.error('Error fetching products:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Error fetching products' 
    });
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
// Get single product
exports.getProduct = async (req, res) => {
  try {
    const product = await Product.findById(req.params.id);
    if (!product) {
      return res.status(404).json({ 
        success: false, 
        message: 'Product not found' 
      });
    }

    res.json({ 
      success: true, 
      product 
    });

  } catch (error) {
    console.error('Error fetching product:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Error fetching product' 
    });
  }
};

exports.editProduct = async (req, res) => {
  try {
    const { id } = req.params;
    const { title, category, basePrice, baseOfferPrice, baseStocks } = req.body;

    // Validate required fields
    if (!title || !category) {
      return res.status(400).json({ error: 'Title and category are required' });
    }

    const product = await Product.findById(id);
    if (!product) {
      return res.status(404).json({ 
        success: false, 
        message: 'Product not found' 
      });
    }

    // Handle image updates
    let imagePaths = product.images;
    if (req.files && req.files.length > 0) {
      if (req.files.length > 4) {
        return res.status(400).json({ error: 'Maximum 4 images allowed' });
      }

      // Delete old images
      product.images.forEach(image => {
        if (image.startsWith('uploads/')) {
          const imagePath = path.join(process.cwd(), image);
          if (fs.existsSync(imagePath)) {
            try {
              fs.unlinkSync(imagePath);
            } catch (err) {
              console.error(`Failed to delete image: ${imagePath}`, err);
            }
          }
        }
      });

      imagePaths = req.files.map(file => `uploads/${file.filename}`);
    }

    // Parse nested arrays
    const productDescription = parseNestedArray(req, 'productDescription');
    const colorVariants = parseNestedArray(req, 'colorVariants').map(variant => ({
      colorName: variant.colorName,
      colorCode: variant.colorCode || '',
      price: Number(variant.price) || 0,
      offerPrice: variant.offerPrice ? Number(variant.offerPrice) : undefined,
      stocks: Number(variant.stocks) || 0
    }));

    const measurements = parseNestedArray(req, 'measurements').map(measure => ({
      measurement: measure.measurement,
      price: Number(measure.price) || 0,
      offerPrice: measure.offerPrice ? Number(measure.offerPrice) : undefined,
      stocks: Number(measure.stocks) || 0
    }));

    const customerReviews = parseNestedArray(req, 'customerReviews');

    // Update product
    const updatedProduct = await Product.findByIdAndUpdate(id, {
      title,
      category,
      productDescription,
      images: imagePaths,
      basePrice: basePrice ? Number(basePrice) : undefined,
      baseOfferPrice: baseOfferPrice ? Number(baseOfferPrice) : undefined,
      baseStocks: baseStocks ? Number(baseStocks) : undefined,
      colorVariants,
      measurements,
      customerReviews
    }, { new: true });

    res.redirect('/admin-products-list');
  } catch (error) {
    console.error('Error updating product:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Error updating product',
      error: error.message 
    });
  }
};

// Delete product
exports.deleteProduct = async (req, res) => {
  try {
    const product = await Product.findById(req.params.id);
    if (!product) {
      return res.status(404).json({ 
        success: false, 
        message: 'Product not found' 
      });
    }
    product.images.forEach(image => {

      const imagePath = path.resolve(process.cwd(), image);
      if (fs.existsSync(imagePath)) {
        try {
          fs.unlinkSync(imagePath);
        } catch (err) {
          console.error(`Failed to delete image: ${imagePath}`, err);
        }
      }
    });

    await Product.findByIdAndDelete(req.params.id);

    // Create notification
    await Notification.create({
      title: 'Product Deleted',
      message: `Product "${product.title}" was deleted.`,
    });

    res.json({ 
      success: true, 
      message: 'Product deleted successfully' 
    });

  } catch (error) {
    console.error('Error deleting product:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Error deleting product' 
    });
  }
};

// Toggle product status
exports.toggleProduct = async (req, res) => {
  try {
    const product = await Product.findById(req.params.id);
    if (!product) {
      return res.status(404).json({ 
        success: false, 
        message: 'Product not found' 
      });
    }

    product.toggled = !product.toggled;
    await product.save();

    res.json({ 
      success: true, 
      toggled: product.toggled,
      message: `Product ${product.toggled ? 'enabled' : 'disabled'} successfully`
    });

  } catch (error) {
    console.error('Error toggling product:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Error toggling product' 
    });
  }
};

// Add to cart
exports.addToCart = async (req, res) => {
  try {
    const { productId, colorIndex, measurementIndex, quantity } = req.body;
    const quantityNum = Number(quantity) || 1;

    const product = await Product.findById(productId);
    if (!product) {
      return res.status(404).json({
        success: false,
        message: 'Product not found'
      });
    }

    // Determine selected variants and pricing
    let price, offerPrice;
    let selectedColor = null;
    let selectedMeasurement = null;

    // Check for color variant
    if (colorIndex !== undefined && product.colorVariants?.length > 0) {
      const colorIdx = parseInt(colorIndex);
      if (colorIdx >= 0 && colorIdx < product.colorVariants.length) {
        selectedColor = product.colorVariants[colorIdx];
        price = selectedColor.price;
        offerPrice = selectedColor.offerPrice;
      }
    }

    // Check for measurement (overrides color pricing if both exist)
    if (measurementIndex !== undefined && product.measurements?.length > 0) {
      const measurementIdx = parseInt(measurementIndex);
      if (measurementIdx >= 0 && measurementIdx < product.measurements.length) {
        selectedMeasurement = product.measurements[measurementIdx];
        price = selectedMeasurement.price;
        offerPrice = selectedMeasurement.offerPrice;
      }
    }

    // Fall back to base prices if no variants selected
    price = price ?? product.basePrice;
    offerPrice = offerPrice ?? product.baseOfferPrice;

    if (price === undefined) {
      return res.status(400).json({
        success: false,
        message: 'No valid price configuration found for this product'
      });
    }

    // For logged-in users
    if (req.user) {
      let cart = await Cart.findOne({ userId: req.user.id }) || 
                 new Cart({ userId: req.user.id, items: [] });

      // Create comparison objects for variants
      const colorCompare = selectedColor ? { 
        colorName: selectedColor.colorName 
      } : null;

      const measurementCompare = selectedMeasurement ? { 
        measurement: selectedMeasurement.measurement 
      } : null;

      // Find existing item with same product and variants
      const existingItemIndex = cart.items.findIndex(item => 
        item.productId.toString() === productId &&
        JSON.stringify(item.selectedColor) === JSON.stringify(colorCompare) &&
        JSON.stringify(item.selectedMeasurement) === JSON.stringify(measurementCompare)
      );

      if (existingItemIndex >= 0) {
        // Item exists - update quantity
        cart.items[existingItemIndex].quantity += quantityNum;
      } else {
        // New item - add to cart
        cart.items.push({
          productId,
          title: product.title,
          image: product.images[0],
          price,
          offerPrice,
          selectedColor: colorCompare,
          selectedMeasurement: measurementCompare,
          quantity: quantityNum
        });
      }

      await cart.save();
      return res.json({
        success: true,
        message: 'Product added to cart',
        cart: cart.items
      });
    }

    // For guest users
    return res.json({
      success: true,
      isGuest: true,
      cartItem: {
        productId,
        title: product.title,
        image: product.images[0],
        price,
        offerPrice,
        selectedColor: selectedColor ? { 
          colorName: selectedColor.colorName 
        } : undefined,
        selectedMeasurement: selectedMeasurement ? { 
          measurement: selectedMeasurement.measurement 
        } : undefined,
        quantity: quantityNum
      }
    });

  } catch (error) {
    console.error('Error adding to cart:', error);
    res.status(500).json({
      success: false,
      message: 'Error adding to cart',
      error: error.message
    });
  }
};
// Get cart
exports.displayCart = async (req, res) => {
  try {
    let cartItems = [];
    let isGuest = true;
    let total = 0;

    if (req.user) {
      const userCart = await Cart.findOne({ userId: req.user.id }).populate("items.productId");
      if (userCart) {
        cartItems = userCart.items.map(item => ({
          _id: item._id, 
          productId: item.productId._id,
          title: item.productId.title,
          price: item.price || item.productId.price,
          offerPrice: item.offerPrice || item.productId.offerPrice,
          selectedMeasurement: item.selectedMeasurement,
          selectedColor: item.selectedColor,
          quantity: item.quantity,
          image: item.image || item.productId.images[0],
          subtotal: (item.offerPrice || item.price || item.productId.price) * item.quantity
        }));
        total = cartItems.reduce((sum, item) => sum + item.subtotal, 0);
      }
      isGuest = false;
    }
    
    res.render("cart", { 
      cartItems, 
      isGuest,
      subtotal: total,
      shipping: 50, 
      vat: 0, 
      total: total + 50 
    });
  } catch (error) {
    console.error('Error displaying cart:', error);
    res.status(500).json({ message: 'Error displaying cart' });
  }
};

// Update cart item quantity
exports.updateCartItem = async (req, res) => {
  try {
    const { itemId } = req.params;
    const { quantity } = req.body;
    
    // Validate inputs
    if (!mongoose.Types.ObjectId.isValid(itemId)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid item ID format'
      });
    }

    const quantityNum = parseInt(quantity);
    if (isNaN(quantityNum) || quantityNum < 1) {
      return res.status(400).json({
        success: false,
        message: 'Quantity must be a positive number'
      });
    }

    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: 'Authentication required'
      });
    }

    const cart = await Cart.findOne({ userId: req.user.id });
    if (!cart) {
      return res.status(404).json({
        success: false,
        message: 'Cart not found'
      });
    }

    // Find the item using Mongoose's equals() for ObjectId comparison
    const itemIndex = cart.items.findIndex(item => 
      item._id && item._id.equals(itemId)
    );

    if (itemIndex === -1) {
      return res.status(404).json({
        success: false,
        message: 'Item not found in cart'
      });
    }

    // Update quantity
    cart.items[itemIndex].quantity = quantityNum;
    await cart.save();

    // Calculate updated subtotal
    const updatedItem = cart.items[itemIndex];
    const subtotal = (updatedItem.offerPrice || updatedItem.price) * updatedItem.quantity;

    return res.json({
      success: true,
      updatedItem: {
        ...updatedItem.toObject(),
        subtotal: subtotal.toFixed(2)
      }
    });

  } catch (error) {
    console.error('Error updating cart item:', error);
    return res.status(500).json({
      success: false,
      message: 'Error updating cart item',
      error: error.message
    });
  }
};

// Remove from cart
exports.removeFromCart = async (req, res) => {
  try {
    const { itemId } = req.params;

    // Validate itemId
    if (!itemId || !mongoose.Types.ObjectId.isValid(itemId)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid item ID'
      });
    }

    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: 'Authentication required'
      });
    }

    const cart = await Cart.findOne({ userId: req.user.id });
    if (!cart) {
      return res.status(404).json({
        success: false,
        message: 'Cart not found'
      });
    }

    // Correct filtering - keep items that DON'T match the ID
    const initialCount = cart.items.length;
    cart.items = cart.items.filter(item => item._id.toString() !== itemId);

    if (cart.items.length === initialCount) {
      return res.status(404).json({
        success: false,
        message: 'Item not found in cart'
      });
    }

    await cart.save();

    return res.json({
      success: true,
      message: 'Item removed from cart'
    });

  } catch (error) {
    console.error('Error removing from cart:', error);
    return res.status(500).json({
      success: false,
      message: error.message || 'Error removing from cart'
    });
  }
};