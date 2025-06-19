const Testimonial = require('../models/Testimonial');
const Notification = require('../models/Notification');
const fs = require('fs');
const path = require('path');

// Create a new Testimonial
exports.createTestimonial = async (req, res) => {
    try {
        const { title, stars, description } = req.body;

        // Validate stars
        if (stars < 1 || stars > 5) {
            return res.status(400).json({ message: 'Stars value must be between 1 and 5.' });
        }

        // Save the profile picture in the uploads directory
        const profilePicPath = req.file ? path.join('uploads', req.file.filename) : null;

        const newTestimonial = new Testimonial({
            title,
            stars,
            description,
            profilePic: profilePicPath,
        });

        await newTestimonial.save();

        // Create a notification for the new testimonial
        await Notification.create({
            title: 'New Testimonial Added',
            message: `Testimonial "${newTestimonial.title}" was successfully created.`,
        });

        res.redirect('/admin-testimonial');
    } catch (error) {
        res.status(500).json({ message: 'Error creating testimonial', error: error.message });
    }
};

// Get all Testimonials
exports.getAllTestimonials = async (req, res) => {
    try {
        const testimonials = await Testimonial.find();
        res.status(200).json(testimonials);
    } catch (error) {
        res.status(500).json({ message: 'Error fetching testimonials', error: error.message });
    }
};

// Edit a Testimonial
exports.editTestimonial = async (req, res) => {
    try {
        const { id } = req.params;
        const { title, stars, description } = req.body;

        // Validate stars
        if (stars && (stars < 1 || stars > 5)) {
            return res.status(400).json({ message: 'Stars value must be between 1 and 5.' });
        }

        const testimonial = await Testimonial.findById(id);
        if (!testimonial) {
            return res.status(404).json({ message: 'Testimonial not found' });
        }

        // Determine the profile picture path
        let profilePicPath = testimonial.profilePic;
        if (req.file) {
            profilePicPath = req.file.path;
        }

        const updatedData = {
            title,
            stars,
            description,
            profilePic: profilePicPath
        };

        const updatedTestimonial = await Testimonial.findByIdAndUpdate(id, updatedData, { new: true });

        res.redirect('/admin-testimonial');
    } catch (error) {
        res.status(500).json({ message: 'Error updating testimonial', error: error.message });
    }
};

// Toggle Testimonial (Enable/Disable)
exports.toggleTestimonial = async (req, res) => {
    try {
        const { id } = req.params;

        const testimonial = await Testimonial.findById(id);
        if (!testimonial) {
            return res.status(404).json({ message: 'Testimonial not found' });
        }

        testimonial.toggled = !testimonial.toggled;
        await testimonial.save();

        res.status(200).json({ message: 'Testimonial toggled successfully!', testimonial });
    } catch (error) {
        res.status(500).json({ message: 'Error toggling testimonial', error: error.message });
    }
};

// Delete a Testimonial
exports.deleteTestimonial = async (req, res) => {
    const { id } = req.params;
    try {
        const testimonial = await Testimonial.findByIdAndDelete(id);
        if (!testimonial) {
            return res.status(404).json({ success: false, message: 'Testimonial not found' });
        }

        if (testimonial.profilePic) {
            const fullPath = path.join(process.cwd(), testimonial.profilePic);
            if (fs.existsSync(fullPath)) {
                fs.unlink(fullPath, (err) => {
                    if (err) {
                        console.error('Error deleting profile picture:', err);
                    }
                });
            }
        }

        // Create a notification for the deleted testimonial
        await Notification.create({
            title: 'Testimonial Deleted',
            message: `Testimonial "${testimonial.title}" was successfully deleted.`,
        });

        return res.status(200).json({ success: true, message: 'Testimonial deleted successfully' });
    } catch (err) {
        return res.status(500).json({ success: false, error: 'Error deleting testimonial', message: err.message });
    }
};
