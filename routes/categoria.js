let express = require('express');
let db = require('../utils/db')
let router = express.Router();

router.get('/listar-categoria', function(req, res) {
    var cmd = `SELECT id_categoria, nome_categoria, desc_categoria FROM tb_categoria`;

    db.query(cmd, [], function(erro, listagem) {
        if (erro) {
            res.send(erro);
        }
        res.render ('categoria-lista', {resultado: listagem});
    });
});

module.exports = router;
