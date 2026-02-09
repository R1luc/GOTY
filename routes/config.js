let express = require('express');
let db = require('../utils/db')
let router = express.Router();

function auth(req, res, next) {
    if (!req.session.user) {
        return res.redirect('/users/login');
    }
    if (req.session.user.id !== 1) {
        // Usuário não é admin, redireciona para a página inicial
        return res.redirect('/index');
    }
    next();
}

router.get('/config', auth, function(req, res, next) {
    res.render ('config');
});

module.exports = router;
