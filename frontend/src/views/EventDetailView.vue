<template>
  <div class="event-detail-view">
    <!-- Botão de Voltar -->
    <div class="navigation-row">
      <router-link to="/" class="btn-back">
        ← Voltar para Eventos
      </router-link>
    </div>

    <!-- Estado de Carregamento -->
    <div v-if="isLoading" class="loading-container glass-panel">
      <div class="loading-spinner"></div>
      <p>Carregando todos os detalhes do evento...</p>
    </div>

    <!-- Conteúdo do Evento -->
    <div v-else-if="event" class="detail-grid">
      <!-- Coluna Principal (Esquerda) -->
      <section class="main-column glass-panel">
        <div class="image-wrapper">
          <img :src="resolvedImageSrc" :alt="event.title" class="event-image" />
          <span class="badge badge-category event-category">{{ event.category }}</span>
        </div>

        <div class="content-body">
          <h1 class="event-title">{{ event.title }}</h1>
          
          <div class="description-section">
            <h3 class="section-title">Sobre o evento</h3>
            <p class="event-description">{{ event.description }}</p>
          </div>
        </div>
      </section>

      <!-- Coluna Lateral (Direita - Painel de Detalhes) -->
      <aside class="sidebar-column">
        <div class="details-card glass-panel">
          <h3 class="card-section-title">Informações Gerais</h3>

          <!-- Data e Hora -->
          <div class="info-item">
            <div class="info-icon">📅</div>
            <div class="info-text">
              <span class="info-label">Data e Hora</span>
              <span class="info-value">{{ formattedDate }}</span>
            </div>
          </div>

          <!-- Localização -->
          <div class="info-item">
            <div class="info-icon">📍</div>
            <div class="info-text">
              <span class="info-label">Localização</span>
              <span class="info-value">{{ event.location }}</span>
            </div>
          </div>

          <!-- Ocupação e Ingressos -->
          <div class="info-item">
            <div class="info-icon">🎫</div>
            <div class="info-text">
              <span class="info-label">Disponibilidade</span>
              <span class="info-value">{{ remainingTickets }} vagas restantes</span>
            </div>
          </div>

          <!-- Progresso de capacidade -->
          <div class="capacity-progress-container">
            <div class="capacity-text-row">
              <span>Capacidade Geral</span>
              <span :class="capacityStatusClass">
                {{ event.participant_count }} / {{ event.capacity }}
              </span>
            </div>
            <div class="capacity-progress-bar">
              <div 
                class="capacity-progress-fill" 
                :style="{ width: `${capacityPercent}%` }"
                :class="capacityFillClass"
              ></div>
            </div>
          </div>

          <!-- Painel de Ações do Usuário -->
          <div class="action-buttons">
            <template v-if="userRole === 'visitor'">
              <button 
                @click="toggleParticipation" 
                class="btn flex-grow"
                :class="event.user_registered ? 'btn-danger' : 'btn-primary'"
                :disabled="isToggling"
              >
                <span v-if="event.user_registered">Cancelar Minha Presença</span>
                <span v-else>Confirmar Presença</span>
              </button>

              <button 
                @click="toggleFavorite"
                class="btn btn-favorite"
                :class="{ 'active': event.user_favorited }"
                :disabled="isToggling"
                title="Favoritar evento"
              >
                ♥
              </button>
            </template>

            <template v-else-if="userRole === 'admin'">
              <router-link to="/admin" class="btn btn-primary flex-grow">
                Gerenciar no Painel
              </router-link>
            </template>

            <template v-else>
              <button @click="redirectToLogin('participar')" class="btn btn-primary flex-grow">
                Confirmar Presença
              </button>
              <button @click="redirectToLogin('favoritar')" class="btn btn-favorite" title="Favoritar evento">
                ♥
              </button>
            </template>
          </div>
        </div>
      </aside>
    </div>

    <!-- Evento Não Encontrado -->
    <div v-else class="empty-state glass-panel">
      <span class="empty-state-icon">🔎</span>
      <h3 class="empty-state-title">Evento não encontrado</h3>
      <p class="empty-state-desc">O evento solicitado pode ter sido cancelado pelo administrador ou não existe em nossa base de dados.</p>
      <router-link to="/" class="btn btn-primary">Voltar para a Home</router-link>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, computed, onUnmounted } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { api } from '../services/api';
import { showToast } from '../services/toast';

const route = useRoute();
const router = useRouter();
const event = ref(null);
const isLoading = ref(true);
const isToggling = ref(false);
const user = ref(null);

const userRole = computed(() => user.value?.role || '');

function loadUser() {
  const userString = localStorage.getItem('user');
  if (userString) {
    try {
      user.value = JSON.parse(userString);
    } catch (e) {
      user.value = null;
    }
  } else {
    user.value = null;
  }
}
// Resolver URL da imagem (uploads locais vs URLs remotas)
const resolvedImageSrc = computed(() => {
  const src = event.value?.image_url || '';
  if (src.startsWith('/uploads/')) return `http://localhost:3000${src}`;
  return src;
});

// Data formatada em pt-BR
const formattedDate = computed(() => {
  if (!event.value?.date_time) return '';
  const date = new Date(event.value.date_time);
  return date.toLocaleDateString('pt-BR', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });
});

// Vagas restantes
const remainingTickets = computed(() => {
  if (!event.value) return 0;
  return Math.max(event.value.capacity - event.value.participant_count, 0);
});

// Percentual de ocupação
const capacityPercent = computed(() => {
  if (!event.value) return 0;
  const pct = (event.value.participant_count / event.value.capacity) * 100;
  return Math.min(Math.round(pct), 100);
});

const capacityStatusClass = computed(() => {
  const pct = capacityPercent.value;
  if (pct >= 100) return 'text-danger';
  if (pct >= 85) return 'text-warning';
  return 'text-success';
});

const capacityFillClass = computed(() => {
  const pct = capacityPercent.value;
  if (pct >= 100) return 'danger';
  if (pct >= 85) return 'warning';
  return '';
});

// Buscar detalhes do evento
async function fetchEventDetails() {
  isLoading.value = true;
  try {
    const eventId = route.params.id;
    const data = await api.events.getById(eventId);
    event.value = data;
  } catch (err) {
    showToast('Falha ao carregar detalhes do evento.', 'error');
  } finally {
    isLoading.value = false;
  }
}

// Favoritar/Desfavoritar
async function toggleFavorite() {
  if (isToggling.value) return;
  isToggling.value = true;
  try {
    const res = await api.events.toggleFavorite(event.value.id);
    event.value.user_favorited = res.user_favorited;
    showToast(res.message, 'success');
  } catch (err) {
    showToast(err.message || 'Erro ao alternar favorito.', 'error');
  } finally {
    isToggling.value = false;
  }
}

// Participar/Cancelar Presença
async function toggleParticipation() {
  if (isToggling.value) return;
  isToggling.value = true;
  try {
    const res = await api.events.toggleParticipation(event.value.id);
    event.value.user_registered = res.user_registered;
    event.value.participant_count = res.participant_count;
    showToast(res.message, 'success');
  } catch (err) {
    showToast(err.message || 'Erro ao atualizar presença.', 'error');
  } finally {
    isToggling.value = false;
  }
}

function redirectToLogin(action) {
  showToast(`Faça login para poder ${action} no evento.`, 'info');
  router.push('/login');
}

onMounted(() => {
  loadUser();
  fetchEventDetails();
  window.addEventListener('auth-change', loadUser);
});

onUnmounted(() => {
  window.removeEventListener('auth-change', loadUser);
});
</script>

<style scoped>
.navigation-row {
  margin-bottom: 1.5rem;
}

.btn-back {
  display: inline-flex;
  align-items: center;
  font-family: var(--font-title);
  font-weight: 600;
  font-size: 0.95rem;
  color: var(--color-accent);
  transition: var(--transition-smooth);
}

.btn-back:hover {
  color: var(--text-primary);
  transform: translateX(-4px);
}

.detail-grid {
  display: grid;
  grid-template-columns: 1fr;
  gap: 2rem;
}

@media (min-width: 1024px) {
  .detail-grid {
    grid-template-columns: 2fr 1fr;
  }
}

.main-column {
  padding: 0;
  overflow: hidden;
  display: flex;
  flex-direction: column;
}

.image-wrapper {
  position: relative;
  width: 100%;
  max-height: 400px;
  overflow: hidden;
}

.event-image {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.event-category {
  position: absolute;
  top: 1.5rem;
  left: 1.5rem;
  z-index: 2;
}

.content-body {
  padding: 2rem;
}

.event-title {
  font-size: 1.8rem;
  line-height: 1.25;
  margin-bottom: 1.5rem;
  background: var(--gradient-primary);
  -webkit-background-clip: text;
  background-clip: text;
  -webkit-text-fill-color: transparent;
  color: transparent;
}

@media (min-width: 768px) {
  .event-title {
    font-size: 2.5rem;
  }
}

.description-section {
  border-top: 1px solid var(--glass-border);
  padding-top: 1.5rem;
}

.section-title {
  font-size: 1.25rem;
  margin-bottom: 1rem;
  color: var(--color-accent);
}

.event-description {
  color: var(--text-secondary);
  font-size: 1rem;
  line-height: 1.7;
  white-space: pre-wrap;
}

/* Sidebar Column */
.sidebar-column {
  display: flex;
  flex-direction: column;
  height: max-content;
  position: sticky;
  top: 100px;
}

.details-card {
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
}

.card-section-title {
  font-size: 1.2rem;
  border-bottom: 1px solid var(--glass-border);
  padding-bottom: 0.75rem;
  margin-bottom: 0.5rem;
}

.info-item {
  display: flex;
  gap: 1rem;
  align-items: flex-start;
}

.info-icon {
  font-size: 1.4rem;
  background: rgba(255, 255, 255, 0.05);
  border: 1px solid var(--glass-border);
  width: 44px;
  height: 44px;
  border-radius: var(--border-radius-sm);
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

.info-text {
  display: flex;
  flex-direction: column;
}

.info-label {
  font-size: 0.75rem;
  color: var(--text-muted);
  text-transform: uppercase;
  font-weight: 700;
  letter-spacing: 0.05em;
}

.info-value {
  font-size: 0.95rem;
  color: var(--text-primary);
  font-weight: 500;
  line-height: 1.4;
  margin-top: 0.15rem;
}

.action-buttons {
  display: flex;
  gap: 0.75rem;
  margin-top: 1rem;
}

.flex-grow {
  flex: 1;
}

.text-danger { color: #f87171; }
.text-warning { color: #fbbf24; }
.text-success { color: #34d399; }
</style>
