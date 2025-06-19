const Banner = require('../models/Banner'); 
const Notification = require('../models/Notification');
const fs = require('fs');
const path = require('path'); 

exports.createBanner = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: 'Image file is required' });
    }
    const { title, description, link, toggled } = req.body; // Added toggled to destructuring
    const image = `uploads/${path.basename(req.file.path)}`; 
    const newBanner = new Banner({ image, title, description, link, toggled });
    const savedBanner = await newBanner.save();

    // Create a notification for the new banner
    await Notification.create({
      title: 'New Banner Added',
      message: `Banner "${savedBanner.title}" was successfully created.`,
    });

    return res.redirect('/admin-banner');
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Error creating banner' });
  }
};

exports.getAllBanners = async (req, res) => {
  try {
    const banners = await Banner.find();
    res.json(banners);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Error getting banners' });
  }
};

exports.getBannerById = async (req, res) => {
  try {
    const banner = await Banner.findById(req.params.id);
    if (!banner) {
      return res.status(404).json({ message: 'Banner not found' });
    }
    res.json(banner);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Error getting banner' });
  }
};

exports.editBanner = async (req, res) => {
  try {
    const bannerId = req.params.id;
    const banner = await Banner.findById(bannerId);
    if (!banner) {
      return res.status(404).json({ message: 'Banner not found' });
    }

    if (req.file) {
      banner.image = `uploads/${path.basename(req.file.path)}`; 
    }
    banner.title = req.body.title || banner.title;
    banner.description = req.body.description || banner.description;
    banner.link = req.body.link || banner.link;
    banner.toggled = req.body.toggled !== undefined ? req.body.toggled : banner.toggled;

    const updatedBanner = await banner.save();
    return res.redirect('/admin-banner');
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Error updating banner' });
  }
};

exports.toggleBanner = async (req, res) => {
  try {
    const banner = await Banner.findById(req.params.id);
    if (!banner) {
      return res.status(404).json({ message: 'Banner not found' });
    }
   
    banner.toggled = !banner.toggled; 
    const updatedBanner = await banner.save();

    res.json({ success: true, banner: updatedBanner });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Error toggling banner' });
  }
};

exports.deleteBanner = async (req, res) => {
  try {
    const banner = await Banner.findByIdAndDelete(req.params.id);
    if (!banner) {
      return res.status(404).json({ message: 'Banner not found' });
    }
    const imagePath = path.join(process.cwd(), banner.image);
    if (fs.existsSync(imagePath)) {
      fs.unlink(imagePath, (err) => {
        if (err) {
          console.error('Error deleting image:', err);
          return res.status(500).json({ message: 'Error deleting image' });
        } else {
          console.log('Image deleted successfully');
        }
      });
    } else {
      console.warn('File not found:', imagePath);
    }

    // Create a notification for the deleted banner
    await Notification.create({
      title: 'Banner Deleted',
      message: `Banner "${banner.title}" was successfully deleted.`,
    });

    res.json({ message: 'Banner deleted successfully', success: true });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Error deleting banner', success: false });
  }
};