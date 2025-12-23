let express = require('express');
let db = require('../utils/db')
let router = express.Router();
let multer = require('multer');

const path = require('path');

let storage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, 'public/images');
    },
    filename: function (req, file, cb) {
        const ext = path.extname(file.originalname);
        const nomeArquivo = Date.now() + '-' + Math.round(Math.random() * 1E9) + ext;
        cb(null, nomeArquivo);
    }
});

let upload = multer({ storage });

router.get('/listar-gnomo', function(req, res) {
    var cmd = `SELECT id_gnomo, nome_gnomo, desc_gnomo, foto_gnomo FROM tb_gnomo`;

    db.query(cmd, [], function(erro, listagem) {
        if (erro) {
            res.send(erro);
        }
        res.render ('gnomo-lista', {resultado: listagem});
    });
});

router.get('/add', function(req, res) {
    res.render ('gnomo-add');
});

router.post('/add', upload.single('foto_gnomo'), function(req, res){
    var nome_gnomo = req.body.nome_gnomo;
    var desc_gnomo = req.body.desc_gnomo;
    var foto_gnomo = req.file ? `/images/${req.file.filename}` : null;

    var cmd = `INSERT INTO tb_gnomo (nome_gnomo, desc_gnomo, foto_gnomo)
                VALUES (?, ?, ?)`
    db.query(cmd, [nome_gnomo, desc_gnomo, foto_gnomo],
    function(erro){
        if (erro){
            res.send(erro);
        }
        res.redirect('/gnomo/listar-gnomo');
    });
});


module.exports = router;