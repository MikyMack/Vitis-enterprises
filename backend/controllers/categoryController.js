const Category = require('../models/Category');
const Notification = require('../models/Notification');
const fs = require('fs');
const path = require('path');

// Create Category
exports.createCategory = async (req, res) => {
    const { title, description, toggled, subCategory = [] } = req.body;

    let imagePaths = [];
    if (req.files && req.files.length > 0) {
        imagePaths = req.files.map(file => `uploads/${path.basename(file.path)}`);
        const allImagesValid = imagePaths.every(imagePath => fs.existsSync(imagePath));
        if (!allImagesValid) {
            return res.status(400).json({ error: 'Some images were not uploaded correctly' });
        }
    }

    try {
        const newCategory = new Category({
            title,
            description,
            toggled,
            images: imagePaths,
            subCategory
        });
        const category = await newCategory.save();

        await Notification.create({
            title: 'New Category Added',
            message: `Category "${category.title}" was successfully created.`,
        });

        return res.redirect('/admin-category-list');
    } catch (err) {
        return res.status(500).json({ error: err.message });
    }
};

exports.getAllCategories = (req, res) => {
    Category.find()
        .then(categories => res.json(categories))
        .catch(err => res.status(500).json({ error: err.message }));
};

exports.getCategoryById = (req, res) => {
    const { id } = req.params;

    Category.findById(id)
        .then(category => {
            if (!category) {
                return res.status(404).json({ error: 'Category not found' });
            }
            res.json(category);
        })
        .catch(err => res.status(500).json({ error: err.message }));
};

// Edit Category
exports.editCategory = async (req, res) => {
    const { id } = req.params;
    const { title, description, toggled, subCategory } = req.body;

    const existingCategory = await Category.findById(id);
    if (!existingCategory) {
        return res.status(404).json({ error: 'Category not found' });
    }

    let images;
    if (req.files && req.files.length > 0) {
        images = req.files.map(file => `uploads/${path.basename(file.path)}`);
    } else {
        images = existingCategory.images || [];
    }

    try {
        await Category.findByIdAndUpdate(id, {
            title,
            description,
            toggled,
            images,
            subCategory
        }, { new: true });
        return res.redirect('/admin-category-list');
    } catch (err) {
        return res.status(500).json({ error: err.message });
    }
};

// Delete Category
exports.deleteCategory = async (req, res) => {
    const { id } = req.params;
    try {
        const category = await Category.findByIdAndDelete(id);
        if (!category) {
            return res.status(404).json({ success: false, error: 'Category not found' });
        }

        if (category.images && category.images.length > 0) {
            category.images.forEach(imagePath => {
                const fullPath = path.join(process.cwd(), imagePath);
                if (fs.existsSync(fullPath)) {
                    fs.unlink(fullPath, (err) => {
                        if (err) {
                            console.error('Error deleting image:', err);
                        } else {
                            console.log('Image deleted successfully:');
                        }
                    });
                } else {
                    console.warn('File not found:', fullPath);
                }
            });
        }

        // Create a notification for the deleted category
        await Notification.create({
            title: 'Category Deleted',
            message: `Category "${category.title}" was successfully deleted.`,
        });

        return res.status(200).json({ success: true, message: 'Category deleted successfully' });
    } catch (err) {
        console.error('Error deleting category:', err);
        return res.status(500).json({ success: false, error: 'Error deleting category', message: err.message });
    }
};

// Toggle Category images
exports.toggleCategory = async (req, res) => {
    const { id } = req.params;
    const { toggled } = req.body;

    try {
        const category = await Category.findByIdAndUpdate(id, { toggled }, { new: true });
        if (!category) {
            return res.status(404).json({ success: false, error: 'Category not found' });
        }
        // Return a success response
        res.status(200).json({ success: true, category });
    } catch (err) {
        console.error('Error toggling category:', err);
        res.status(500).json({ success: false, error: err.message });
    }
};
