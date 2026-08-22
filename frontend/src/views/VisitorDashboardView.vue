<template>
  <div class="visitor-dashboard">
    <!-- Header -->
    <header class="dashboard-header glass-panel">
      <div class="header-left">
        <h1 class="dashboard-title">Olá, <span class="highlight">{{ userName }}</span>!</h1>
        <p class="dashboard-subtitle">Acompanhe suas programações confirmadas e salve seus eventos preferidos.</p>
      </div>
      <router-link to="/" class="btn btn-primary">
        Explorar Eventos
      </router-link>
    </header>

    <!-- Seletor de Abas (Tabs) -->
    <div class="tab-selector-wrapper">
      <button 
        class="tab-btn" 
        :class="{ 'active': activeTab === 'registrations' }"
        @click="activeTab = 'registrations'"
      >
        📅 Minha Presença Confirmada ({{ registrations.length }})
      </button>
      <button 
        class="tab-btn" 
        :class="{ 'active': activeTab === 'favorites' }"
        @click="activeTab = 'favorites'"
      >
        ❤️ Eventos Favoritos ({{ favorites.length }})
      </button>
    </div>

    <!-- Conteúdo Principal -->
    <div v-if="isLoading" class="loading-container glass-panel">
      <div class="loading-spinner"></div>
      <p>Atualizando sua programação...</p>
    </div>

    <div v-else>
      <!-- Aba de Presenças -->
      <div v-if="activeTab === 'registrations'">
        <div v-if="registrations.length > 0" class="events-grid">
          <EventCard 
            v-for="event in registrations" 
            :key="event.id" 
            :event="event"
            user-role="visitor"
            @toggle-favorite="handleToggleFavorite"
            @toggle-participation="handleToggleParticipation"
          />
        </div>
        <div v-else class="empty-state glass-panel">
          <span class="empty-state-icon">📅</span>
          <h3 class="empty-state-title">Nenhuma presença confirmada</h3>
          <p class="empty-state-desc">Você ainda não confirmou presença em nenhum evento próximo. Explore a página principal e garanta sua vaga!</p>
          <router-link to="/" class="btn btn-primary">Buscar Eventos</router-link>
        </div>
      </div>

      <!-- Aba de Favoritos -->
      <div v-if="activeTab === 'favorites'">
        <div v-if="favorites.length > 0" class="events-grid">
          <EventCard 
            v-for="event in favorites" 
            :key="event.id" 
            :event="event"
            user-role="visitor"
            @toggle-favorite="handleToggleFavorite"
            @toggle-participation="handleToggleParticipation"
          />
        </div>
        <div v-else class="empty-state glass-panel">
          <span class="empty-state-icon">❤️</span>
          <h3 class="empty-state-title">Nenhum evento favoritado</h3>
          <p class="empty-state-desc">Sua lista de favoritos está vazia. Salve os eventos que te interessam para acompanhar as novidades.</p>
          <router-link to="/" class="btn btn-primary">Explorar Agora</router-link>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, computed } from 'vue';
import { api } from '../services/api';
import { showToast } from '../services/toast';
import EventCard from '../components/EventCard.vue';

const registrations = ref([]);
const favorites = ref([]);
const isLoading = ref(true);
const activeTab = ref('registrations'); // 'registrations' ou 'favorites'

const user = ref(null);

const userName = computed(() => user.value?.name || 'Visitante');

function loadUser() {
  const userString = localStorage.getItem('user');
  if (userString) {
    try {
      user.value = JSON.parse(userString);
    } catch (e) {
      user.value = null;
    }
  }
}

// Buscar dados do Dashboard do Visitante
async function fetchDashboardData() {
  isLoading.value = true;
  try {
    const data = await api.dashboard.getVisitorStats();
    registrations.value = data.registrations;
    favorites.value = data.favorites;
  } catch (err) {
    showToast('Erro ao obter seus dados de participação.', 'error');
  } finally {
    isLoading.value = false;
  }
}

// Tratar alteração de favoritos (remoção do grid ou atualização)
async function handleToggleFavorite(eventId) {
  try {
    const res = await api.events.toggleFavorite(eventId);
    showToast(res.message, 'success');
    
    // Atualiza localmente
    favorites.value = favorites.value.filter(e => e.id !== eventId);
    
    // Atualiza o estado no array de inscrições caso o evento esteja lá também
    const regEvent = registrations.value.find(e => e.id === eventId);
    if (regEvent) {
      regEvent.user_favorited = res.user_favorited;
    }
  } catch (err) {
    showToast(err.message || 'Erro ao atualizar favoritos.', 'error');
  }
}

// Tratar cancelamento de presença
async function handleToggleParticipation(eventId) {
  try {
    const res = await api.events.toggleParticipation(eventId);
    showToast(res.message, 'success');
    
    // Remove do array de inscrições se cancelou
    if (!res.user_registered) {
      registrations.value = registrations.value.filter(e => e.id !== eventId);
    }

    // Atualiza o estado no array de favoritos caso o evento esteja lá também
    const favEvent = favorites.value.find(e => e.id === eventId);
    if (favEvent) {
      favEvent.user_registered = res.user_registered;
      favEvent.participant_count = res.participant_count;
    }
  } catch (err) {
    showToast(err.message || 'Erro ao cancelar presença.', 'error');
  }
}

onMounted(() => {
  loadUser();
  fetchDashboardData();
});
</script>

<style scoped>
.dashboard-header {
  display: flex;
  flex-direction: column;
  justify-content: space-between;
  align-items: flex-start;
  gap: 1.5rem;
  padding: 2rem;
  margin-bottom: 2rem;
}

@media (min-width: 768px) {
  .dashboard-header {
    flex-direction: row;
    align-items: center;
  }
}

.dashboard-title {
  font-size: 1.8rem;
  margin-bottom: 0.5rem;
}

.highlight {
  background: var(--gradient-primary);
  -webkit-background-clip: text;
  background-clip: text;
  -webkit-text-fill-color: transparent;
  color: transparent;
}

.dashboard-subtitle {
  color: var(--text-secondary);
  font-size: 0.95rem;
  line-height: 1.5;
}

.tab-selector-wrapper {
  display: flex;
  gap: 1rem;
  border-bottom: 1px solid var(--glass-border);
  padding-bottom: 1rem;
  margin-bottom: 2rem;
  overflow-x: auto;
}

.tab-btn {
  background: transparent;
  border: none;
  font-family: var(--font-title);
  color: var(--text-secondary);
  font-weight: 600;
  font-size: 1rem;
  padding: 0.5rem 1rem;
  cursor: pointer;
  white-space: nowrap;
  border-radius: var(--border-radius-md);
  transition: var(--transition-smooth);
}

.tab-btn:hover {
  color: var(--text-primary);
  background: rgba(255, 255, 255, 0.04);
}

.tab-btn.active {
  color: var(--color-accent);
  background: rgba(0, 240, 255, 0.08);
  border: 1px solid rgba(0, 240, 255, 0.2);
}
</style>
