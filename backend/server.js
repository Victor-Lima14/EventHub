const express = require('express');
const cors = require('cors');
const path = require('path');
require('dotenv').config();

// Inicializar banco de dados para criar tabelas no arranque
require('./database/db');

const app = express();
const PORT = process.env.PORT || 3000;

// Origem permitida para requisições CORS.
// Em produção (Render), FRONTEND_URL deve ser configurado no painel de variáveis de ambiente
// com o domínio real do frontend no Vercel (ex: https://meu-app.vercel.app).
// Em desenvolvimento local, usa http://localhost:5173 como fallback.
const allowedOrigin = process.env.FRONTEND_URL || 'http://localhost:5173';

const corsOptions = {
  origin: allowedOrigin,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  credentials: true,
};

// Middleware
app.use(cors(corsOptions));
app.use(express.json());
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Rotas
const authRoutes = require('./routes/authRoutes');
const eventRoutes = require('./routes/eventRoutes');
const dashboardRoutes = require('./routes/dashboardRoutes');

app.use('/api/auth', authRoutes);
app.use('/api/events', eventRoutes);
app.use('/api/dashboard', dashboardRoutes);

// Endpoint básico de saúde da API
app.get('/api/health', (req, res) => {
  res.status(200).json({ status: 'API rodando perfeitamente!', timestamp: new Date() });
});

// Middleware Global de Tratamento de Erros
app.use((err, req, res, next) => {
  console.error('Erro detectado no servidor:', err.stack);
  res.status(500).json({
    message: 'Ocorreu um erro interno no servidor ao processar sua requisição.',
    error: process.env.NODE_ENV === 'development' ? err.message : {}
  });
});

// Inicialização do servidor
app.listen(PORT, () => {
  console.log(`====================================================`);
  console.log(`Servidor rodando com sucesso na porta: ${PORT}`);
  console.log(`Acesse a saúde da API em: http://localhost:${PORT}/api/health`);
  console.log(`====================================================`);
});
