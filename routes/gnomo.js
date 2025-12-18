let express = require('express');
let db = require('../utils/db')
let router = express.Router();
let multer = require('multer');

let storage = multer.memoryStorage(); // mantém em memória (Buffer)
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
    var foto_gnomo = req.file.buffer;

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

router.get('/foto/:id', function(req, res) {
    const id = req.params.id;

    const cmd = 'SELECT foto_gnomo FROM tb_gnomo WHERE id_gnomo = ?';

    db.query(cmd, [id], function(err, result) {
        if (err) return res.sendStatus(500);
        if (result.length === 0) return res.sendStatus(404);

        // ⚠️ ajuste se for PNG
        res.setHeader('Content-Type', 'image/jpeg');
        res.end(result[0].foto_gnomo);
    });
});


module.exports = router;