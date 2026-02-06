let express = require('express');
let db = require('../utils/db')
let router = express.Router();

function auth(req, res, next) {
    if (!req.session.user) {
        return res.redirect('/users/login');
    }
    next();
}

router.get('/config', auth, function(req, res, next) {
    res.render ('config');
});

module.exports = router;
