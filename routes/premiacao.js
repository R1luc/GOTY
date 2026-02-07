let express = require('express');
let db = require('../utils/db')
let router = express.Router();

function auth(req, res, next) {
    if (!req.session.user) {
        return res.redirect('/users/login');
    }
    next();
}

// Listar todas as categorias
router.get('/', auth, function(req, res) {
    const cmd = `
        SELECT id_categoria, nome_categoria, desc_categoria 
        FROM tb_categoria
        ORDER BY id_categoria ASC
    `;
    
    db.query(cmd, [], function(err, rows) {
        if (err) return res.send(err);
        res.render('premiacao', { categorias: rows });
    });
});

// Buscar top 3 gnomos por categoria com contagem de votos
router.get('/top3-categoria', auth, function(req, res) {
    const idCategoria = req.query.id_categoria;
    
    const cmd = `
        SELECT 
            g.id_gnomo,
            g.nome_gnomo,
            IFNULL(g.foto_gnomo, '') AS foto_gnomo,
            COUNT(v.id_voto) AS total_votos
        FROM tb_gnomo g
        INNER JOIN tb_gnomo_categoria gc
            ON g.id_gnomo = gc.id_gnomo
            AND gc.id_categoria = ?
        LEFT JOIN tb_voto v
            ON gc.id_gnomo_categoria = v.id_gnomo_categoria
        GROUP BY g.id_gnomo, g.nome_gnomo, g.foto_gnomo
        HAVING total_votos > 0
        ORDER BY total_votos DESC, g.nome_gnomo ASC
        LIMIT 3
    `;
    
    db.query(cmd, [idCategoria], function(err, rows) {
        if (err) return res.status(500).json({ erro: err });
        
        // Adicionar colocação com empate (prioriza posição mais alta)
        let posicaoAtual = 0;
        let votosAnterior = null;
        const resultado = rows.map((row, index) => {
            if (votosAnterior === null || row.total_votos !== votosAnterior) {
                posicaoAtual = index + 1;
                votosAnterior = row.total_votos;
            }
            return {
                ...row,
                colocacao: posicaoAtual
            };
        });
        
        res.json(resultado);
    });
});

module.exports = router;
