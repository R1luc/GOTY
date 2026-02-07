let express = require('express');
let db = require('../utils/db');
let router = express.Router();

function auth(req, res, next) {
  if (!req.session.user) {
      return res.redirect('/users/login');
  }
  next();
}

router.get('/listar-categoria', auth, function(req, res) {
  const cmd = `
    SELECT id_categoria, nome_categoria, desc_categoria 
    FROM tb_categoria
  `;

  db.query(cmd, [], function(err, rows) {
    if (err) return res.send(err);
    res.render('categoria-lista', { resultado: rows });
  });
});

router.get('/gnomos-categoria', auth, function(req, res) {
  const idCategoria = req.query.id_categoria;

  const cmd = `
    SELECT 
      g.id_gnomo,
      g.nome_gnomo,
      IFNULL(g.foto_gnomo, '') AS foto_gnomo,
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

router.post('/anexar-gnomos', function(req, res) {
  let { id_categoria, gnomos } = req.body;

  if (!gnomos) gnomos = [];
  if (!Array.isArray(gnomos)) gnomos = [gnomos];
  const idCategoriaNum = Number(id_categoria);
  gnomos = Array.from(new Set(gnomos.map(id => Number(id)).filter(id => Number.isFinite(id))));

  if (!Number.isFinite(idCategoriaNum)) {
    return res.status(400).send('Categoria inválida');
  }

  const ensureAutoInc = `
    ALTER TABLE tb_gnomo_categoria
    MODIFY id_gnomo_categoria BIGINT UNSIGNED AUTO_INCREMENT
  `;
  const getNextAuto = `
    SELECT IFNULL(MAX(id_gnomo_categoria), 0) + 1 AS next_id
    FROM tb_gnomo_categoria
  `;
  db.query(ensureAutoInc, function() {
    db.query(getNextAuto, function(errAuto, rowsAuto) {
      if (errAuto) return res.send(errAuto);
      const nextId = rowsAuto && rowsAuto[0] ? Number(rowsAuto[0].next_id) : 1;

      db.query('ALTER TABLE tb_gnomo_categoria AUTO_INCREMENT = ?', [nextId], function(errSet) {
        if (errSet) return res.send(errSet);

        db.query(
          'SELECT id_gnomo FROM tb_gnomo_categoria WHERE id_categoria = ?',
          [idCategoriaNum],
          function(err, rows) {
            if (err) return res.send(err);

            const existentes = rows.map(r => Number(r.id_gnomo));
            const setExistentes = new Set(existentes);
            const setSelecionados = new Set(gnomos);

            const remover = existentes.filter(id => !setSelecionados.has(id));
            const adicionar = gnomos.filter(id => !setExistentes.has(id));

            const inserirNovos = () => {
              if (adicionar.length === 0) return res.redirect('/categoria/listar-categoria');

              const values = adicionar.map(idGnomo => [idGnomo, idCategoriaNum]);
              db.query(
                'INSERT INTO tb_gnomo_categoria (id_gnomo, id_categoria) VALUES ?',
                [values],
                function(errIns) {
                  if (errIns) return res.send(errIns);
                  res.redirect('/categoria/listar-categoria');
                }
              );
            };

            if (remover.length === 0) {
              return inserirNovos();
            }

            const deleteVotos = `
              DELETE v FROM tb_voto v
              INNER JOIN tb_gnomo_categoria gc
                ON v.id_gnomo_categoria = gc.id_gnomo_categoria
              WHERE gc.id_categoria = ?
                AND gc.id_gnomo IN (?)
            `;

            db.query(deleteVotos, [idCategoriaNum, remover], function(errDelVotos) {
              if (errDelVotos) return res.send(errDelVotos);

              db.query(
                'DELETE FROM tb_gnomo_categoria WHERE id_categoria = ? AND id_gnomo IN (?)',
                [idCategoriaNum, remover],
                function(errDelLinks) {
                  if (errDelLinks) return res.send(errDelLinks);
                  inserirNovos();
                }
              );
            });
          }
        );
      });
    });
  });
});

module.exports = router;
