const jwt = require('jsonwebtoken');
require('dotenv').config();

const JWT_SECRET = process.env.JWT_SECRET || 'super_secret_festival_key_2026_dev';

function authenticateToken(req, res, next) {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({ message: 'Token de autenticação não fornecido ou inválido.' });
  }

  jwt.verify(token, JWT_SECRET, (err, user) => {
    if (err) {
      return res.status(403).json({ message: 'Token expirado ou inválido. Faça login novamente.' });
    }
    req.user = user;
    next();
  });
}

function isAdmin(req, res, next) {
  if (!req.user || req.user.role !== 'admin') {
    return res.status(403).json({ message: 'Acesso negado. Apenas administradores podem realizar esta ação.' });
  }
  next();
}

function isVisitor(req, res, next) {
  if (!req.user || req.user.role !== 'visitor') {
    return res.status(403).json({ message: 'Acesso negado. Apenas visitantes autenticados podem realizar esta ação.' });
  }
  next();
}

module.exports = {
  authenticateToken,
  isAdmin,
  isVisitor
};
