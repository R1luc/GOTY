let express = require('express');
let db = require('../utils/db')
let router = express.Router();



router.get('/listar-categorias', function(req, res) {
    const cmd = `
      SELECT id_categoria, nome_categoria, desc_categoria 
      FROM tb_categoria
    `;
  
    db.query(cmd, [], function(err, rows) {
      if (err) return res.send(err);
      res.render('categoria-lista', { resultado: rows });
    });
  });

  router.get('/gnomos-categoria', function(req, res) {
    const idCategoria = req.query.id_categoria;
  
    const cmd = `
      SELECT 
        g.id_gnomo,
        g.nome_gnomo,
        IF(gc.id_categoria IS NULL, 0, 1) AS anexado
      FROM tb_gnomo g
      LEFT JOIN tb_gnomo_categoria gc
        ON g.id_gnomo = gc.id_gnomo
        AND gc.id_categoria = ?
      ORDER BY g.nome_gnomo
    `;
  
    db.query(cmd, [idCategoria], function(err, rows) {
      if (err) return res.status(500).json(err);
      res.json(rows);
    });
  });

  router.post('/votar-gnomos', function(req, res) {
    let { id_categoria, gnomos } = req.body;
  
    if (!gnomos) gnomos = [];
    if (!Array.isArray(gnomos)) gnomos = [gnomos];
  
    let count = 0;
  
    db.query(
        'INSERT INTO tb_voto (id_usuario, id_gnomo_categoria) VALUES (?, ?)',
        [Number(id_usuario), Number(id_gnomo_categoria)],
        
        function(err) {
                if (err) return res.send(err);
  
                count++;
                if (count === gnomos.length) {
                  res.redirect('/categoria/listar-categoria');
                }
              }
          );
    
    });
  module.exports = router;

  