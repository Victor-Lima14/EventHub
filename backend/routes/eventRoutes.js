const express = require('express');
const router = express.Router();
const eventController = require('../controllers/eventController');
const { authenticateToken, isAdmin, isVisitor } = require('../middleware/auth');
const upload = require('../middleware/upload');

// Middleware de tratamento de erros do Multer (deve vir ANTES das rotas que o usam)
function handleUploadErrors(err, req, res, next) {
  if (err) {
    if (err.code === 'LIMIT_FILE_SIZE') {
      return res.status(400).json({ message: 'Arquivo muito grande. O tamanho máximo permitido é de 5MB.' });
    }
    return res.status(400).json({ message: err.message || 'Erro ao processar o arquivo de imagem.' });
  }
  next();
}

// Rotas públicas
router.get('/', eventController.getAllEvents);
router.get('/:id', eventController.getEventById);

// Rotas de controle administrativo (Admin Only)
// upload.single('image_file') processa o campo de arquivo se enviado; se não houver arquivo, req.file fica undefined
router.post('/', authenticateToken, isAdmin, (req, res, next) => {
  upload.single('image_file')(req, res, (err) => {
    if (err) return handleUploadErrors(err, req, res, next);
    next();
  });
}, eventController.createEvent);

router.put('/:id', authenticateToken, isAdmin, (req, res, next) => {
  upload.single('image_file')(req, res, (err) => {
    if (err) return handleUploadErrors(err, req, res, next);
    next();
  });
}, eventController.updateEvent);

router.delete('/:id', authenticateToken, isAdmin, eventController.deleteEvent);

// Rotas de interação do visitante (Visitor Only)
router.post('/:id/participate', authenticateToken, isVisitor, eventController.toggleParticipation);
router.post('/:id/favorite', authenticateToken, isVisitor, eventController.toggleFavorite);

module.exports = router;
