const jwt = require('jsonwebtoken');

module.exports = (req, res, next) => {
    if (req.session.user) {
        next();
    } else {
        res.redirect('/login'); 
    }
};

const authenticateUser = (req, res, next) => {
    const token = req.cookies.token; 

    if (!token) {
        req.user = null; 
        return next();
    }
    try {
        const decoded = jwt.verify(token, process.env.SESSION_SECRET);
        req.user = decoded; 
        next();
    } catch (error) {
        req.user = null;
        next();
    }
};

module.exports = authenticateUser;