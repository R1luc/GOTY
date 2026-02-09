var express = require('express');
var router = express.Router();
var db = require('../utils/db');

function auth(req, res, next) {
  if (!req.session.user) {
      return res.redirect('/users/login');
  }
  next();
}

/* GET home page. */
router.get('/', auth, function(req, res) {
  res.render('index', { title: 'Express', user: req.session.user || null
   });
});

router.get('/index', auth, function(req, res, next) {
  res.render('index', { title: 'Express', user: req.session.user || null
    
   });
});

module.exports = router;
