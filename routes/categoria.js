let express = require('express');
let db = require('../utils/db');
let router = express.Router();

/* LISTAR CATEGORIAS */
router.get('/listar-categoria', function(req, res) {
  const cmd = `
    SELECT id_categoria, nome_categoria, desc_categoria 
    FROM tb_categoria
  `;

  db.query(cmd, [], function(err, rows) {
    if (err) return res.send(err);
    res.render('categoria-lista', { resultado: rows });
  });
});

/* API – GNOMOS POR CATEGORIA */
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

/* ANEXAR / DESANEXAR GNOMOS */
router.post('/anexar-gnomos', function(req, res) {
  let { id_categoria, gnomos } = req.body;

  // 🔥 normalização correta
  if (!gnomos) gnomos = [];
  if (!Array.isArray(gnomos)) gnomos = [gnomos];

  // 1️⃣ apagar votos da categoria (FK)
  const deleteVotos = `
    DELETE v FROM tb_voto v
    JOIN tb_gnomo_categoria gc 
      ON v.id_gnomo_categoria = gc.id_gnomo_categoria
    WHERE gc.id_categoria = ?
  `;

  db.query(deleteVotos, [id_categoria], function(err) {
    if (err) return res.send(err);

    // 2️⃣ apagar vínculos antigos
    db.query(
      'DELETE FROM tb_gnomo_categoria WHERE id_categoria = ?',
      [id_categoria],
      function(err) {
        if (err) return res.send(err);

        if (gnomos.length === 0) {
          return res.redirect('/categoria/listar-categoria');
        }

        // 3️⃣ inserir UM POR UM (seguro)
        let count = 0;

        gnomos.forEach(idGnomo => {
          db.query(
            'INSERT INTO tb_gnomo_categoria (id_gnomo, id_categoria) VALUES (?, ?)',
            [Number(idGnomo), Number(id_categoria)],
            function(err) {
              if (err) return res.send(err);

              count++;
              if (count === gnomos.length) {
                res.redirect('/categoria/listar-categoria');
              }
            }
          );
        });
      }
    );
  });
});

module.exports = router;
