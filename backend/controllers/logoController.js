const Logo = require('../models/Logo');
const Notification = require('../models/Notification');
const fs = require('fs');
const path = require('path');

// Create Logo
exports.createLogo = (req, res) => {
    const { title } = req.body;

    if (!req.file) {
        return res.status(400).json({ error: 'You must upload an image.' });
    }

    const imagePath = `uploads/${path.basename(req.file.path)}`;

    const newLogo = new Logo({
        title,
        image: imagePath
    });

    newLogo.save()
        .then(async logo => {
            await Notification.create({
                title: 'New Logo Added',
                message: `Logo "${logo.title}" was successfully added.`,
            });
            res.redirect('/admin-logo');
        })
        .catch(err => res.status(500).json({ error: err.message }));
};

// Get all Logos
exports.getAllLogos = (req, res) => {
    Logo.find()
        .then(logos => res.json(logos))
        .catch(err => res.status(500).json({ error: err.message }));
};

// Get single Logo by ID (if you need to re-enable this)
exports.getLogoById = (req, res) => {
    const { id } = req.params;

    Logo.findById(id)
        .then(logo => {
            if (!logo) {
                return res.status(404).json({ error: 'Logo not found' });
            }
            res.json(logo);
        })
        .catch(err => res.status(500).json({ error: err.message }));
};

// Edit Logo
exports.editLogo = (req, res) => {
    const { id } = req.params;
    const { title } = req.body;
    let image;
    if (req.file) {
        image = `uploads/${path.basename(req.file.path)}`;
    } else {
        image = req.body.existingImage; 
    }

    Logo.findByIdAndUpdate(id, {
        title,
        image 
    }, { new: true })
        .then(logo => {
            if (!logo) {
                return res.status(404).json({ error: 'Logo not found' });
            }
            res.redirect('/admin-logo');
        })
        .catch(err => res.status(500).json({ error: err.message }));
};

// Toggle Logo (Activate/Deactivate)
exports.toggleLogo = async (req, res) => {
    try {
      const logo = await Logo.findById(req.params.id);
      if (!logo) {
        return res.status(404).json({ success: false, message: 'Logo not found' });
      }
      logo.toggled = !logo.toggled;
      const updatedLogo = await logo.save();
      res.json({ success: true, logo: updatedLogo });
    } catch (err) {
      console.error(err);
      res.status(500).json({ success: false, message: 'Error toggling logo' });
    }
  };

// Delete Logo
exports.deleteLogo = (req, res) => {
    const { id } = req.params;

    Logo.findByIdAndDelete(id)
        .then(async logo => {
            if (!logo) {
                return res.status(404).json({ error: 'Logo not found' });
            }
            const imagePath = path.join(process.cwd(), logo.image);
            if (fs.existsSync(imagePath)) {
                fs.unlink(imagePath, (err) => {
                    if (err) {
                        console.error('Error deleting image:', err);
                    } else {
                        console.log('Image deleted successfully');
                    }
                });
            } else {
                console.warn('File not found:', imagePath);
            }

            await Notification.create({
                title: 'Logo Deleted',
                message: `Logo "${logo.title}" was successfully deleted.`,
            });

            res.json({ message: 'Logo deleted successfully' });
        })
        .catch(err => res.status(500).json({ error: err.message }));
};
