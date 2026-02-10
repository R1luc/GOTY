let express = require('express');
let db = require('../utils/db')
let router = express.Router();

function auth(req, res, next) {
  if (!req.session.user) {
      return res.redirect('/users/login');
  }
  next();
}

router.get('/listar-categorias', auth, function(req, res) {
    const cmd = `
      SELECT id_categoria, nome_categoria, desc_categoria 
      FROM tb_categoria
      ORDER BY id_categoria DESC
    `;
  
    db.query(cmd, [], function(err, rows) {
      if (err) return res.send(err);
      res.render('voto', { resultado: rows });
    });
  });

  router.get('/gnomos-voto-lista', auth, function(req, res) {
    const idCategoria = req.query.id_categoria;
    const idUsuario = req.session.user.id;
  
    const cmd = `
      SELECT 
        g.id_gnomo,
        IFNULL(g.foto_gnomo, '') AS foto_gnomo,
        g.nome_gnomo,
        IF(v.id_voto IS NULL, 0, 1) AS anexado
      FROM tb_gnomo g
      INNER JOIN tb_gnomo_categoria gc
        ON g.id_gnomo = gc.id_gnomo
        AND gc.id_categoria = ?
      LEFT JOIN tb_voto v
        ON gc.id_gnomo_categoria = v.id_gnomo_categoria
        AND v.id_usuario = ?
      LEFT JOIN tb_usuario s
        ON s.id_usuario = v.id_usuario
        AND s.id_usuario = ?
      ORDER BY g.nome_gnomo      
    `;
  
    db.query(cmd, [idCategoria, idUsuario, idUsuario], function(err, rows) {
      if (err) return res.status(500).json(err);
      res.json(rows);
    });
  });

  router.post('/votar-gnomos', auth, function(req, res) {
    const idUsuario = req.session.user.id;
    const idCategoria = Number(req.body.id_categoria);
    const idGnomo = req.body.gnomos ? Number(req.body.gnomos) : null;

    // Sempre remove o voto anterior do usuário nessa categoria
    const deleteVoto = `
      DELETE v FROM tb_voto v
      INNER JOIN tb_gnomo_categoria gc
        ON gc.id_gnomo_categoria = v.id_gnomo_categoria
      WHERE v.id_usuario = ?
        AND gc.id_categoria = ?
    `;

    db.query(deleteVoto, [idUsuario, idCategoria], function(err) {
        if (err) return res.send(err);

        // Se nenhum radio foi marcado → só remove e acabou
        if (!idGnomo) {
            return res.redirect('/votos/listar-categorias');
        }

        // Busca o id_gnomo_categoria do gnomo escolhido
        const selectGc = `
          SELECT id_gnomo_categoria
          FROM tb_gnomo_categoria
          WHERE id_gnomo = ?
            AND id_categoria = ?
        `;

        db.query(selectGc, [idGnomo, idCategoria], function(err2, rows) {
            if (err2) return res.send(err2);

            const idGnomoCategoria = rows[0].id_gnomo_categoria;

            // Insere o novo voto
            db.query(
                'INSERT INTO tb_voto (id_usuario, id_gnomo_categoria) VALUES (?, ?)',
                [idUsuario, idGnomoCategoria],
                function(err3) {
                    if (err3) return res.send(err3);
                    res.redirect('/votos/listar-categorias');
                }
            );
        });
    });
});
  module.exports = router;

  