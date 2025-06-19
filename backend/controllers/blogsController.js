const Blog = require('../models/Blog');
const Notification = require('../models/Notification');
const fs = require('fs');
const path = require('path');

// Create a new Blog
exports.createBlog = async (req, res) => {
    try {
        const { title, description, author, date, metatitle, metadescription } = req.body;

        // Save the blog image in the uploads directory
        const blogImagePath = req.file ? path.join('uploads', req.file.filename) : null;

        const newBlog = new Blog({
            title,
            description,
            author,
            date,
            metatitle,
            metadescription,
            image: blogImagePath,
        });

        await newBlog.save();

        // Create a notification for the new blog
        await Notification.create({
            title: 'New Blog Added',
            message: `Blog "${newBlog.title}" was successfully created.`,
        });

        res.redirect('/admin-blogs');
    } catch (error) {
        res.status(500).json({ message: 'Error creating blog', error: error.message });
    }
};

// Get all Blogs
exports.getAllBlogs = async (req, res) => {
    try {
        const blogs = await Blog.find();
        res.status(200).json(blogs);
    } catch (error) {
        res.status(500).json({ message: 'Error fetching blogs', error: error.message });
    }
};

// Edit a Blog
exports.editBlog = async (req, res) => {
    try {
        const { id } = req.params;
        const { title, description, author, date, metatitle, metadescription } = req.body;

        const blog = await Blog.findById(id);
        if (!blog) {
            return res.status(404).json({ message: 'Blog not found' });
        }

        // Determine the blog image path
        let blogImagePath = blog.image;
        if (req.file) {
            blogImagePath = req.file.path;
        }

        const updatedData = {
            title,
            description,
            author,
            date,
            metatitle,
            metadescription,
            image: blogImagePath
        };

        const updatedBlog = await Blog.findByIdAndUpdate(id, updatedData, { new: true });

        res.redirect('/admin-blogs');
    } catch (error) {
        res.status(500).json({ message: 'Error updating blog', error: error.message });
    }
};

// Delete a Blog
exports.deleteBlog = async (req, res) => {
    const { id } = req.params;
    try {
        const blog = await Blog.findByIdAndDelete(id);
        if (!blog) {
            return res.status(404).json({ success: false, message: 'Blog not found' });
        }

        if (blog.image) {
            const fullPath = path.join(process.cwd(), blog.image);
            if (fs.existsSync(fullPath)) {
                fs.unlink(fullPath, (err) => {
                    if (err) {
                        console.error('Error deleting blog image:', err);
                    }
                });
            }
        }

        // Create a notification for the deleted blog
        await Notification.create({
            title: 'Blog Deleted',
            message: `Blog "${blog.title}" was successfully deleted.`,
        });

        return res.status(200).json({ success: true, message: 'Blog deleted successfully' });
    } catch (err) {
        return res.status(500).json({ success: false, error: 'Error deleting blog', message: err.message });
    }
};
