<template>
  <div class="event-card glass-panel">
    <div class="card-image-wrapper">
      <img :src="resolvedImageSrc" :alt="event.title" class="card-image" loading="lazy" />
      <span class="badge badge-category card-category">{{ event.category }}</span>
      <button 
        v-if="userRole !== 'admin'"
        @click.stop="onFavoriteClick"
        class="card-favorite-btn" 
        :class="{ 'is-favorited': event.user_favorited }"
        title="Favoritar evento"
      >
        ♥
      </button>
    </div>

    <div class="card-content">
      <div class="card-date">{{ formattedDate }}</div>
      <h3 class="card-title">{{ event.title }}</h3>
      <p class="card-location">📍 {{ event.location }}</p>
      <p class="card-desc">{{ truncatedDescription }}</p>

      <!-- Progresso de capacidade -->
      <div class="capacity-progress-container">
        <div class="capacity-text-row">
          <span>Vagas preenchidas</span>
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
    </div>

    <div class="card-footer">
      <router-link :to="`/event/${event.id}`" class="btn btn-secondary btn-sm flex-grow">
        Ver Detalhes
      </router-link>

      <button 
        v-if="userRole === 'visitor'"
        @click="onParticipateClick"
        class="btn btn-sm"
        :class="event.user_registered ? 'btn-danger' : 'btn-primary'"
      >
        {{ event.user_registered ? 'Cancelar' : 'Participar' }}
      </button>

      <button
        v-else-if="!userRole"
        @click="redirectToLogin"
        class="btn btn-primary btn-sm"
      >
        Participar
      </button>
    </div>
  </div>
</template>

<script setup>
import { computed } from 'vue';
import { useRouter } from 'vue-router';
import { showToast } from '../services/toast';
import { BACKEND_URL } from '../services/api';

const props = defineProps({
  event: {
    type: Object,
    required: true
  },
  userRole: {
    type: String,
    default: ''
  }
});

const emit = defineEmits(['toggle-favorite', 'toggle-participation']);
const router = useRouter();

// Resolver URL da imagem: caminhos locais /uploads/ recebem o host do backend
const resolvedImageSrc = computed(() => {
  const src = props.event.image_url || '';
  if (src.startsWith('/uploads/')) return `${BACKEND_URL}${src}`;
  return src;
});

// Formatar data em português brasileiro (ex: 20 de Set de 2026 às 18:00)
const formattedDate = computed(() => {
  if (!props.event.date_time) return '';
  const date = new Date(props.event.date_time);
  return date.toLocaleDateString('pt-BR', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  }).replace('.', '');
});

// Truncar descrição do evento
const truncatedDescription = computed(() => {
  const desc = props.event.description || '';
  return desc.length > 100 ? desc.substring(0, 97) + '...' : desc;
});

// Percentual de vagas preenchidas
const capacityPercent = computed(() => {
  if (!props.event.capacity) return 0;
  const pct = (props.event.participant_count / props.event.capacity) * 100;
  return Math.min(Math.round(pct), 100);
});

// Classe de cor do texto de capacidade
const capacityStatusClass = computed(() => {
  const pct = capacityPercent.value;
  if (pct >= 100) return 'text-danger';
  if (pct >= 85) return 'text-warning';
  return 'text-success';
});

// Classe de cor da barra de preenchimento
const capacityFillClass = computed(() => {
  const pct = capacityPercent.value;
  if (pct >= 100) return 'danger';
  if (pct >= 85) return 'warning';
  return '';
});

// Tratar cliques de visitantes ou não logados
function onFavoriteClick() {
  if (!props.userRole) {
    showToast('Faça login para adicionar eventos aos seus favoritos.', 'info');
    router.push('/login');
    return;
  }
  emit('toggle-favorite', props.event.id);
}

function onParticipateClick() {
  emit('toggle-participation', props.event.id);
}

function redirectToLogin() {
  showToast('Faça login para confirmar sua presença nos eventos.', 'info');
  router.push('/login');
}
</script>

<style scoped>
.event-card {
  display: flex;
  flex-direction: column;
  height: 100%;
  padding: 0;
  overflow: hidden;
  border-radius: var(--border-radius-lg);
  background: var(--bg-card);
}

.event-card:hover {
  transform: translateY(-5px);
  box-shadow: var(--shadow-glow);
}

.card-image-wrapper {
  position: relative;
  width: 100%;
  height: 180px;
  overflow: hidden;
}

.card-image {
  width: 100%;
  height: 100%;
  object-fit: cover;
  transition: var(--transition-smooth);
}

.event-card:hover .card-image {
  transform: scale(1.05);
}

.card-category {
  position: absolute;
  top: 1rem;
  left: 1rem;
  z-index: 2;
}

.card-favorite-btn {
  position: absolute;
  top: 1rem;
  right: 1rem;
  z-index: 2;
  width: 36px;
  height: 36px;
  border-radius: 50%;
  background: rgba(18, 11, 36, 0.6);
  backdrop-filter: blur(8px);
  border: 1px solid var(--glass-border);
  color: #fff;
  font-size: 1.2rem;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: var(--transition-smooth);
}

.card-favorite-btn:hover {
  background: rgba(255, 0, 127, 0.2);
  border-color: var(--color-primary);
  color: var(--color-primary);
  transform: scale(1.1);
}

.card-favorite-btn.is-favorited {
  background: var(--color-primary);
  border-color: var(--color-primary);
  color: #fff;
  text-shadow: 0 0 5px rgba(255, 255, 255, 0.5);
}

.card-content {
  padding: 1.5rem;
  display: flex;
  flex-direction: column;
  flex: 1;
}

.card-date {
  font-family: var(--font-title);
  font-size: 0.8rem;
  font-weight: 600;
  text-transform: uppercase;
  color: var(--color-accent);
  margin-bottom: 0.5rem;
}

.card-title {
  font-size: 1.25rem;
  line-height: 1.3;
  margin-bottom: 0.5rem;
  color: var(--text-primary);
}

.card-location {
  font-size: 0.85rem;
  color: var(--text-secondary);
  margin-bottom: 0.75rem;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.card-desc {
  font-size: 0.9rem;
  color: var(--text-muted);
  line-height: 1.5;
  margin-bottom: 1.25rem;
}

.card-footer {
  padding: 1.25rem 1.5rem;
  background: rgba(18, 11, 36, 0.4);
  border-top: 1px solid var(--glass-border);
  display: flex;
  gap: 0.75rem;
  margin-top: auto;
}

.flex-grow {
  flex: 1;
}

.text-danger { color: #f87171; }
.text-warning { color: #fbbf24; }
.text-success { color: #34d399; }
</style>
