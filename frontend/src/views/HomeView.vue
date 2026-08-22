<template>
  <div class="home-view">
    <!-- Hero Banner -->
    <header class="hero-section glass-panel">
      <h1 class="hero-title">Os melhores eventos do seu <br><span class="highlight">universo cultural</span></h1>
      <p class="hero-subtitle">Conecte-se com festivais de música, workshops tech, feiras gastronômicas e muito mais.</p>
    </header>

    <!-- Barra de Filtros e Busca -->
    <section class="filters-section glass-panel">
      <div class="search-box">
        <span class="search-icon">🔍</span>
        <input 
          v-model="filters.search" 
          type="text" 
          placeholder="Buscar eventos por título ou descrição..." 
          class="form-control"
          @input="debouncedFetch"
        />
      </div>

      <div class="filters-row">
        <!-- Filtro por Data -->
        <div class="date-picker-wrapper">
          <label class="form-label">A partir de</label>
          <div class="date-input-container">
            <input 
              v-model="filters.date" 
              type="date" 
              class="form-control"
              @change="fetchEvents"
            />
            <button v-if="filters.date" @click="clearDate" class="btn-clear-date" title="Limpar data">×</button>
          </div>
        </div>

        <!-- Categorias (Desktop: Pills, Mobile: Horizontal Scroll) -->
        <div class="categories-wrapper">
          <label class="form-label">Categorias</label>
          <div class="category-pills">
            <button 
              v-for="cat in categories" 
              :key="cat"
              @click="selectCategory(cat)"
              class="pill-btn"
              :class="{ 'active': filters.category === cat }"
            >
              {{ cat }}
            </button>
          </div>
        </div>
      </div>
    </section>

    <!-- Estado de Carregamento -->
    <div v-if="isLoading" class="loading-container glass-panel">
      <div class="loading-spinner"></div>
      <p>Buscando os melhores eventos para você...</p>
    </div>

    <!-- Lista de Eventos -->
    <div v-else>
      <div v-if="events.length > 0" class="events-grid">
        <EventCard 
          v-for="event in events" 
          :key="event.id" 
          :event="event"
          :user-role="userRole"
          @toggle-favorite="handleToggleFavorite"
          @toggle-participation="handleToggleParticipation"
        />
      </div>

      <!-- Estado Vazio -->
      <div v-else class="empty-state glass-panel">
        <span class="empty-state-icon">🎟️</span>
        <h3 class="empty-state-title">Nenhum evento encontrado</h3>
        <p class="empty-state-desc">Não encontramos eventos correspondentes aos filtros selecionados. Tente ajustar a busca ou a categoria.</p>
        <button @click="resetFilters" class="btn btn-primary">Limpar Filtros</button>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted, computed, onUnmounted } from 'vue';
import { api } from '../services/api';
import { showToast } from '../services/toast';
import EventCard from '../components/EventCard.vue';

const events = ref([]);
const isLoading = ref(false);
const user = ref(null);

const filters = reactive({
  search: '',
  category: 'Todos',
  date: ''
});

const categories = [
  'Todos',
  'Shows & Festivais',
  'Tecnologia',
  'Gastronomia',
  'Artes & Teatro',
  'Negócios & Networking'
];

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

// Buscar Eventos da API
async function fetchEvents() {
  isLoading.value = true;
  try {
    const apiFilters = {};
    if (filters.search.trim()) apiFilters.search = filters.search.trim();
    if (filters.category !== 'Todos') apiFilters.category = filters.category;
    if (filters.date) apiFilters.date = filters.date;

    const data = await api.events.getAll(apiFilters);
    events.value = data;
  } catch (err) {
    showToast('Falha ao carregar lista de eventos.', 'error');
  } finally {
    isLoading.value = false;
  }
}

// Debounce básico para busca por texto
let debounceTimeout = null;
function debouncedFetch() {
  clearTimeout(debounceTimeout);
  debounceTimeout = setTimeout(() => {
    fetchEvents();
  }, 400);
}

function selectCategory(category) {
  filters.category = category;
  fetchEvents();
}

function clearDate() {
  filters.date = '';
  fetchEvents();
}

function resetFilters() {
  filters.search = '';
  filters.category = 'Todos';
  filters.date = '';
  fetchEvents();
}

// Alternar Favorito na API e atualizar estado local
async function handleToggleFavorite(eventId) {
  try {
    const res = await api.events.toggleFavorite(eventId);
    const event = events.value.find(e => e.id === eventId);
    if (event) {
      event.user_favorited = res.user_favorited;
    }
    showToast(res.message, 'success');
  } catch (err) {
    showToast(err.message || 'Erro ao favoritar evento.', 'error');
  }
}

// Alternar Presença na API e atualizar estado local
async function handleToggleParticipation(eventId) {
  try {
    const res = await api.events.toggleParticipation(eventId);
    const event = events.value.find(e => e.id === eventId);
    if (event) {
      event.user_registered = res.user_registered;
      event.participant_count = res.participant_count;
    }
    showToast(res.message, 'success');
  } catch (err) {
    showToast(err.message || 'Erro ao confirmar presença.', 'error');
  }
}

onMounted(() => {
  loadUser();
  fetchEvents();
  window.addEventListener('auth-change', loadUser);
});

onUnmounted(() => {
  window.removeEventListener('auth-change', loadUser);
});
</script>

<style scoped>
.hero-section {
  text-align: center;
  background: var(--gradient-card);
  padding: 3rem 1.5rem;
  margin-bottom: 2rem;
  border-radius: var(--border-radius-xl);
}

.hero-title {
  font-size: 2.2rem;
  line-height: 1.2;
  margin-bottom: 1rem;
}

@media (min-width: 768px) {
  .hero-title {
    font-size: 3rem;
  }
}

.highlight {
  background: var(--gradient-vibrant);
  -webkit-background-clip: text;
  background-clip: text;
  -webkit-text-fill-color: transparent;
  color: transparent;
}

.hero-subtitle {
  color: var(--text-secondary);
  font-size: 1rem;
  max-width: 600px;
  margin: 0 auto;
  line-height: 1.6;
}

@media (min-width: 768px) {
  .hero-subtitle {
    font-size: 1.15rem;
  }
}

.filters-section {
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
  margin-bottom: 2rem;
  padding: 1.5rem;
}

.search-box {
  position: relative;
  width: 100%;
}

.search-icon {
  position: absolute;
  left: 1.2rem;
  top: 50%;
  transform: translateY(-50%);
  font-size: 1.1rem;
  opacity: 0.6;
}

.search-box .form-control {
  padding-left: 3rem;
}

.filters-row {
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
}

@media (min-width: 768px) {
  .filters-row {
    flex-direction: row;
    align-items: flex-end;
  }
}

.date-picker-wrapper {
  width: 100%;
}

@media (min-width: 768px) {
  .date-picker-wrapper {
    width: 250px;
    flex-shrink: 0;
  }
}

.date-input-container {
  position: relative;
  display: flex;
  align-items: center;
}

.btn-clear-date {
  position: absolute;
  right: 1rem;
  background: transparent;
  border: none;
  color: var(--text-secondary);
  font-size: 1.4rem;
  cursor: pointer;
  line-height: 1;
}

.btn-clear-date:hover {
  color: var(--text-primary);
}

.categories-wrapper {
  flex-grow: 1;
  overflow: hidden;
}

.category-pills {
  display: flex;
  gap: 0.6rem;
  overflow-x: auto;
  padding-bottom: 0.5rem;
  scrollbar-width: thin;
  scrollbar-color: var(--glass-border) transparent;
}

/* Custom horizontal scrollbar styling for Chrome/Safari */
.category-pills::-webkit-scrollbar {
  height: 4px;
}

.category-pills::-webkit-scrollbar-thumb {
  background: var(--glass-border);
  border-radius: 4px;
}

.pill-btn {
  background: rgba(255, 255, 255, 0.04);
  color: var(--text-secondary);
  font-family: var(--font-title);
  font-weight: 600;
  font-size: 0.85rem;
  padding: 0.55rem 1.1rem;
  border-radius: 50px;
  border: 1px solid var(--glass-border);
  cursor: pointer;
  white-space: nowrap;
  transition: var(--transition-smooth);
}

.pill-btn:hover {
  background: rgba(255, 255, 255, 0.08);
  color: var(--text-primary);
  border-color: rgba(255, 255, 255, 0.2);
}

.pill-btn.active {
  background: var(--gradient-primary);
  color: var(--text-primary);
  border-color: transparent;
  box-shadow: var(--shadow-glow);
}
</style>
