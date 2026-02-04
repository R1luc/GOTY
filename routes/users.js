var express = require('express');
var router = express.Router();
var bcrypt = require('bcryptjs');
var db = require('../utils/db');

// Rota de exemplo: pode ser adaptada para listar usuários, etc.
router.get('/', function(req, res, next) {
  res.send('respond with a resource');
});

// Exibe o formulário de login
router.get('/login', function(req, res, next) {
  res.render('login', { error: null });
});

// Exibe o formulário de registro
router.get('/register', function(req, res, next) {
  res.render('register', { error: null });
});

// Handler de registro (POST /users/register)
// - valida campos
// - garante a existência básica da tabela `tb_usuario` (sem alterar dados existentes)
// - gera hash bcrypt da senha e insere o usuário
router.post('/register', function(req, res, next) {
  const username = req.body.username;
  const password = req.body.password;

  if (!username || !password) {
    return res.render('register', { error: 'Informe usuário e senha' });
  }

  // Cria a tabela se não existir.
  const ensureTable = `CREATE TABLE IF NOT EXISTS tb_usuario (
    id_usuario INT AUTO_INCREMENT PRIMARY KEY,
    nome_usuario VARCHAR(100) UNIQUE,
    senha_usuario VARCHAR(100)
  )`;

  db.query(ensureTable, function(err) {
    if (err) return res.render('register', { error: 'Erro no banco (CREATE)' });

    // Tenta ajustar o tamanho da coluna para comportar hashes longos.
    // Se a alteração falhar por qualquer motivo, continuamos; não é
    // crítico para o fluxo, apenas uma tentativa de compatibilidade.
    db.query('ALTER TABLE tb_usuario MODIFY senha_usuario VARCHAR(255)', function(err2) {
      // continue mesmo se der erro no ALTER

      // Verifica se o usuário já existe
      db.query('SELECT id_usuario FROM tb_usuario WHERE nome_usuario = ?', [username], function(err3, results) {
        if (err3) return res.render('register', { error: 'Erro no banco (SELECT)' });
        if (results && results.length > 0) return res.render('register', { error: 'Usuário já existe' });

        // Gera hash da senha com bcrypt e insere no banco
        const hash = bcrypt.hashSync(password, 10);
        db.query('INSERT INTO tb_usuario (nome_usuario, senha_usuario) VALUES (?, ?)', [username, hash], function(err4, result) {
          if (err4) return res.render('register', { error: 'Erro ao registrar' });
          req.session.user = { id: result.insertId, username };
          res.redirect('/');
        });
      });
    });
  });
});

// Handler de login (POST /users/login)
// Aceita senhas armazenadas em bcrypt ou em texto plano.
router.post('/login', function(req, res, next) {
  const username = req.body.username;
  const password = req.body.password;

  if (!username || !password) return res.render('login', { error: 'Informe usuário e senha' });

  // Busca o usuário pelo nome
  db.query('SELECT id_usuario, nome_usuario, senha_usuario FROM tb_usuario WHERE nome_usuario = ?', [username], function(err, results) {
    if (err) return res.render('login', { error: 'Erro no banco' });
    if (!results || results.length === 0) return res.render('login', { error: 'Usuário não encontrado' });

    const user = results[0];
    const stored = user.senha_usuario || '';

    // Se o valor armazenado começar com "$2" é muito provável que seja um
    // hash bcrypt (formato padrão). Nesse caso usamos bcrypt.compareSync.
    // Caso contrário assumimos que é texto plano e comparamos diretamente.
    let valid = false;
    if (typeof stored === 'string' && stored.startsWith('$2')) {
      valid = bcrypt.compareSync(password, stored);
    } else {
      valid = (password === stored);
    }

    if (!valid) return res.render('login', { error: 'Senha incorreta' });

    // Autenticação OK — grava usuário na sessão
    req.session.user = { id: user.id_usuario, username: user.nome_usuario };
    res.redirect('/');
  });
});

router.get('/logout', function(req, res, next) {
  req.session.destroy(function() {
    res.redirect('/');
  });
});

module.exports = router;
