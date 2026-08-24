const db = require('../database/db');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
require('dotenv').config();

// JWT_SECRET deve ser definido como variável de ambiente (sem fallback em produção).
const JWT_SECRET = process.env.JWT_SECRET;

exports.register = (req, res) => {
  const { name, email, password } = req.body;

  if (!name || !email || !password) {
    return res.status(400).json({ message: 'Todos os campos (nome, email, senha) são obrigatórios.' });
  }

  if (password.length < 6) {
    return res.status(400).json({ message: 'A senha deve conter no mínimo 6 caracteres.' });
  }

  // Verificar se o email já existe
  db.get('SELECT id FROM users WHERE email = ?', [email], (err, user) => {
    if (err) {
      return res.status(500).json({ message: 'Erro no servidor ao verificar usuário.', error: err.message });
    }
    if (user) {
      return res.status(409).json({ message: 'Este endereço de e-mail já está cadastrado.' });
    }

    // Hash da senha e inserção
    const salt = bcrypt.genSaltSync(10);
    const hashedPassword = bcrypt.hashSync(password, salt);

    db.run(
      'INSERT INTO users (name, email, password, role) VALUES (?, ?, ?, ?)',
      [name, email, hashedPassword, 'visitor'],
      function (err) {
        if (err) {
          return res.status(500).json({ message: 'Erro ao registrar usuário no banco de dados.', error: err.message });
        }

        // Emitir JWT imediatamente após cadastro
        const token = jwt.sign(
          { id: this.lastID, name, email, role: 'visitor' },
          JWT_SECRET,
          { expiresIn: '7d' }
        );

        res.status(201).json({
          message: 'Usuário registrado com sucesso!',
          token,
          user: {
            id: this.lastID,
            name,
            email,
            role: 'visitor'
          }
        });
      }
    );
  });
};

exports.login = (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ message: 'E-mail e senha são obrigatórios.' });
  }

  db.get('SELECT * FROM users WHERE email = ?', [email], (err, user) => {
    if (err) {
      return res.status(500).json({ message: 'Erro no servidor ao autenticar usuário.', error: err.message });
    }
    if (!user) {
      return res.status(401).json({ message: 'E-mail ou senha incorretos.' });
    }

    const isMatch = bcrypt.compareSync(password, user.password);
    if (!isMatch) {
      return res.status(401).json({ message: 'E-mail ou senha incorretos.' });
    }

    const token = jwt.sign(
      { id: user.id, name: user.name, email: user.email, role: user.role },
      JWT_SECRET,
      { expiresIn: '7d' }
    );

    res.status(200).json({
      message: 'Login realizado com sucesso!',
      token,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role
      }
    });
  });
};
