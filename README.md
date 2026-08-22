# EventHub - Sistema de Gerenciamento e Organização de Eventos

[![Vue 3](https://img.shields.io/badge/Frontend-Vue%203-4fc08d?style=for-the-badge&logo=vue.js&logoColor=white)](https://vuejs.org/)
[![Node.js](https://img.shields.io/badge/Backend-Node.js-339933?style=for-the-badge&logo=nodedotjs&logoColor=white)](https://nodejs.org/)
[![Express](https://img.shields.io/badge/API-Express-000000?style=for-the-badge&logo=express&logoColor=white)](https://expressjs.com/)
[![SQLite3](https://img.shields.io/badge/Database-SQLite3-003b57?style=for-the-badge&logo=sqlite&logoColor=white)](https://sqlite.org/)

O **EventHub** é uma plataforma completa e responsiva de gerenciamento de eventos desenvolvida como um projeto de portfólio profissional de alta qualidade. O sistema simula um ambiente real onde organizadores podem criar e monitorar eventos, enquanto os visitantes podem buscar programações, favoritar atividades e confirmar sua presença online.

---

## 🌟 Funcionalidades Principais

### Área do Visitante (Pública e Privada)
- **Showcase de Eventos (Público)**: Grade moderna com imagens e detalhes resumidos dos eventos cadastrados.
- **Filtros e Buscas Dinâmicas**: Busca textual por título ou descrição, filtro por categoria (pills interativas) e filtro de data retroativa.
- **Página de Detalhes Completa**: Exibição detalhada com data/hora, endereço completo, quantidade de vagas em tempo real e descrição informativa.
- **Autenticação de Visitantes**: Cadastro seguro de nova conta e login persistido com JWT.
- **Painel de Presenças ("Vou participar")**: Confirmação ou cancelamento de vaga com atualização automática de capacidade no evento.
- **Painel de Favoritos**: Lista pessoal de eventos marcados como favoritos.
- **Dashboard do Visitante**: Visualização centralizada de todas as presenças confirmadas e favoritos.

### Área Administrativa (Restrita)
- **Estatísticas Rápidas**: Visualização de métricas de desempenho (Total de Eventos, Total de Presenças Confirmadas e Taxa de Ocupação Média).
- **CRUD Completo de Eventos**:
  - Cadastro de novos eventos com suporte duplo para imagens (URL colada diretamente ou envio por upload de arquivo local), local e capacidade.
  - Edição de eventos existentes com preenchimento automático em modal e suporte a alteração de imagem (URL ou novo upload).
  - Exclusão com confirmação de segurança.
- **Monitoramento de Ocupação**: Exibição da contagem exata de participantes inscritos por evento através de barras de status coloridas (Sucesso/Alerta/Esgotado).

---

## 🎨 Visual e Interface (Design System)
O design foi construído sobre uma proposta **Festival & Event-App**, utilizando:
- Temática Dark Mode com efeitos em **glassmorphism** (fundos semitransparentes com `backdrop-filter: blur`).
- Paleta de cores vibrantes baseada em gradientes de **Rosa Neon (`#ff007f`)**, **Roxo (`#8a2be2`)** e **Ciano Elétrico (`#00f0ff`)**.
- Seletores e menus de categoria estilizados com alto contraste para leitura e usabilidade impecáveis no escuro.
- Tipografia moderna do Google Fonts (**Outfit** para títulos e **Inter** para corpos de texto).
- Responsividade mobile-first completa testada em dispositivos móveis, tablets e desktops.

---

## 💻 Tecnologias Utilizadas

### Frontend
- **Vue 3 (Composition API)**: Estrutura lógica leve, reativa e modular.
- **Vue Router (v4)**: Roteamento de páginas com guards de acesso baseados em autenticação e cargos (admin vs visitante).
- **Vanilla CSS**: Estilização robusta sem a sobrecarga de frameworks externos pesados, utilizando variáveis CSS nativas.

### Backend
- **Node.js + Express**: API RESTful estruturada em camadas lógicas de responsabilidade.
- **Multer**: Middleware para processamento e gerenciamento de upload de arquivos de imagem (`multipart/form-data`).
- **SQLite3**: Banco de dados relacional leve e embutido.
- **Bcrypt.js**: Criptografia de senhas (hashing) no cadastro e login.
- **JSON Web Tokens (JWT)**: Autenticação stateless segura baseada em tokens.
- **Cors**: Middleware para controle de acesso HTTP e compartilhamento de recursos entre origens.
- **Dotenv**: Centralização de variáveis de ambiente.

---

## 📂 Estrutura do Projeto

```text
EventHub/
├── backend/                  # Servidor de API Node.js + Express
│   ├── controllers/          # Lógica de controle de rotas (authController, eventController, dashboardController)
│   ├── database/             # Conexão SQLite3, esquema e arquivo do banco
│   │   ├── db.js             # Configuração, criação de tabelas e seeding do admin padrão
│   │   └── db.sqlite         # Arquivo do banco local (gerado no primeiro boot)
│   ├── middleware/           # Proteção de endpoints (auth.js para JWT/cargos e upload.js para Multer)
│   ├── routes/               # Definição das rotas REST (authRoutes, eventRoutes, dashboardRoutes)
│   ├── uploads/              # Armazenamento dinâmico das imagens de eventos enviadas por upload (deve existir e ter permissão de escrita)
│   ├── .env.example          # Exemplo de configuração de variáveis
│   ├── .env                  # Variáveis de ambiente ativas (JWT_SECRET, PORT)
│   ├── package.json          # Dependências e scripts do backend
│   └── server.js             # Ponto de entrada do backend e distribuição estática da pasta /uploads
│
└── frontend/                 # Aplicação Vue 3 SPA (Single Page Application)
    ├── public/               # Ativos estáticos públicos servidos diretamente pelo Vite
    │   └── guia.png          # Favicon servido na raiz (referenciado em index.html)
    ├── src/
    │   ├── assets/           # Ativos visuais do projeto
    │   │   └── images/       # Imagens estáticas fixas do projeto (logo EventHub, favicon, gráficos de interface)
    │   ├── components/       # Componentes reutilizáveis (Navbar, EventCard)
    │   ├── router/           # Configuração de rotas e guards de navegação
    │   ├── services/         # Integração com API backend e utilitário Toast
    │   ├── views/            # Visões da aplicação (HomeView, AdminDashboardView, VisitorDashboardView, EventDetailView, LoginView, RegisterView)
    │   ├── App.vue           # Componente raiz do Vue
    │   ├── main.js           # Ponto de entrada do Vue 3
    │   └── style.css         # Design System e estilos globais
    ├── index.html            # Ponto de entrada HTML com metadados SEO e favicon estático
    ├── package.json          # Dependências e scripts do frontend
    └── vite.config.js        # Configurações do compilador Vite
```

---

## ⚙️ Instalação e Execução

### Pré-requisitos
- Node.js (versão `>= 18.0.0`)
- NPM ou Yarn instalado

### Passo 1: Configurar e Iniciar o Backend

1. Navegue até o diretório do backend:
   ```bash
   cd backend
   ```

2. Instale as dependências:
   ```bash
   npm install
   ```

3. Crie e configure o arquivo `.env`:
   Copie as variáveis do arquivo de exemplo:
   ```bash
   cp .env.example .env
   ```
   *(No Windows PowerShell, use: `copy .env.example .env`)*

4. Verifique se a pasta `backend/uploads/` existe e possui permissões de escrita para receber os arquivos de imagem de eventos enviados no runtime (o servidor a cria automaticamente se não existir).

5. Inicie o servidor:
   ```bash
   npm start
   ```
   A API rodará por padrão em `http://localhost:3000`. Você pode verificar seu status acessando a rota de saúde: `http://localhost:3000/api/health`.
   > O admin padrão é criado automaticamente na primeira inicialização (via `db.js`). Nenhum script seed precisa ser executado.

### Passo 2: Configurar e Iniciar o Frontend

1. Abra um novo terminal e navegue até a pasta do frontend:
   ```bash
   cd frontend
   ```

2. Instale as dependências do Vue:
   ```bash
   npm install
   ```

3. Inicie o servidor de desenvolvimento do Vite:
   ```bash
   npm run dev
   ```

4. Abra o navegador no endereço exibido no terminal (geralmente `http://localhost:5173`).

---

## 🔑 Credenciais para Demonstração

Para facilitar a navegação nos painéis durante os testes de recrutamento ou avaliação:

### Conta de Administrador (Event Organizer)
- **E-mail**: `admin@eventos.com`
- **Senha**: `admin123`

### Conta de Visitante
Crie uma conta diretamente na interface clicando em **Criar Conta** na barra de navegação superior. Não há dados de visitantes pré-cadastrados — o banco inicia limpo, pronto para uma demonstração real.
