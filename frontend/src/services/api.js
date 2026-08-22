// Configuração da URL base do backend obtida das variáveis de ambiente do Vite.
// Em desenvolvimento local: VITE_API_URL=http://localhost:3000
// Em produção (Render/Vercel): VITE_API_URL=https://eventhub-ka7u.onrender.com
export const BACKEND_URL = (import.meta.env.VITE_API_URL || 'http://localhost:3000').replace(/\/$/, '');
const BASE_URL = `${BACKEND_URL}/api`;


async function apiRequest(endpoint, options = {}) {
  const token = localStorage.getItem('token');
  const headers = { ...options.headers };

  // Se o body é FormData, não forçamos Content-Type nem stringificamos o corpo
  // O browser define automaticamente o Content-Type com o boundary correto
  const isFormData = options.body instanceof FormData;

  if (!isFormData) {
    headers['Content-Type'] = 'application/json';
  }

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const response = await fetch(`${BASE_URL}${endpoint}`, {
    ...options,
    headers
  });

  let data;
  try {
    data = await response.json();
  } catch (err) {
    data = { message: 'Erro ao processar resposta do servidor.' };
  }

  if (!response.ok) {
    const error = new Error(data.message || 'Ocorreu um erro na requisição.');
    error.status = response.status;
    throw error;
  }

  return data;
}

export const api = {
  // Autenticação
  auth: {
    login(email, password) {
      return apiRequest('/auth/login', {
        method: 'POST',
        body: JSON.stringify({ email, password })
      });
    },
    register(name, email, password) {
      return apiRequest('/auth/register', {
        method: 'POST',
        body: JSON.stringify({ name, email, password })
      });
    }
  },

  // Eventos
  events: {
    getAll(filters = {}) {
      const params = new URLSearchParams();
      if (filters.search) params.append('search', filters.search);
      if (filters.category) params.append('category', filters.category);
      if (filters.date) params.append('date', filters.date);

      const queryString = params.toString() ? `?${params.toString()}` : '';
      return apiRequest(`/events${queryString}`);
    },
    getById(id) {
      return apiRequest(`/events/${id}`);
    },
    // eventData pode ser um objeto JSON simples (URL) ou um FormData (upload de arquivo)
    create(eventData) {
      const isForm = eventData instanceof FormData;
      return apiRequest('/events', {
        method: 'POST',
        body: isForm ? eventData : JSON.stringify(eventData)
      });
    },
    update(id, eventData) {
      const isForm = eventData instanceof FormData;
      return apiRequest(`/events/${id}`, {
        method: 'PUT',
        body: isForm ? eventData : JSON.stringify(eventData)
      });
    },
    delete(id) {
      return apiRequest(`/events/${id}`, {
        method: 'DELETE'
      });
    },
    toggleParticipation(id) {
      return apiRequest(`/events/${id}/participate`, {
        method: 'POST'
      });
    },
    toggleFavorite(id) {
      return apiRequest(`/events/${id}/favorite`, {
        method: 'POST'
      });
    }
  },

  // Dashboards
  dashboard: {
    getAdminStats() {
      return apiRequest('/dashboard/admin');
    },
    getVisitorStats() {
      return apiRequest('/dashboard/visitor');
    }
  }
};
