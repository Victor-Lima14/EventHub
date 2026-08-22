const multer = require('multer');
const path = require('path');
const fs = require('fs');

// AVISO DE PERSISTÊNCIA (Render Free Tier):
// O sistema de arquivos do Render é efêmero — os arquivos salvos na pasta 'uploads'
// são perdidos a cada novo deploy ou reinicialização do serviço.
// Para um projeto em produção real, considere usar um serviço de armazenamento externo
// como AWS S3, Cloudinary ou similar. Para uso em portfólio, este comportamento é aceitável.
const uploadsDir = path.join(__dirname, '../uploads');
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

// Configuração do armazenamento do Multer
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadsDir);
  },
  filename: (req, file, cb) => {
    // Gera um nome de arquivo único com timestamp e sufixo randômico
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
    cb(null, uniqueSuffix + path.extname(file.originalname));
  }
});

// Filtro para garantir apenas arquivos do tipo Imagem
const fileFilter = (req, file, cb) => {
  const filetypes = /jpeg|jpg|png|webp|gif/;
  const mimetype = filetypes.test(file.mimetype);
  const extname = filetypes.test(path.extname(file.originalname).toLowerCase());

  if (mimetype && extname) {
    return cb(null, true);
  }
  cb(new Error('Apenas arquivos de imagem são permitidos (jpg, jpeg, png, webp, gif).'));
};

const upload = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024 }, // Limite de 5MB
  fileFilter
});

module.exports = upload;
