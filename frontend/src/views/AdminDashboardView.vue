<template>
  <div class="admin-dashboard">
    <!-- Header -->
    <header class="dashboard-header glass-panel">
      <div class="header-left">
        <h1 class="dashboard-title">Painel de <span class="highlight">Controle</span></h1>
        <p class="dashboard-subtitle">Crie, edite, remova e acompanhe as inscrições de todos os eventos da plataforma.</p>
      </div>
      <button @click="openCreateModal" class="btn btn-primary">
        ➕ Criar Novo Evento
      </button>
    </header>

    <!-- Estado de Carregamento Geral -->
    <div v-if="isLoading" class="loading-container glass-panel">
      <div class="loading-spinner"></div>
      <p>Carregando estatísticas e listagem do painel...</p>
    </div>

    <!-- Conteúdo do Dashboard -->
    <div v-else>
      <!-- Cartões de Métricas -->
      <section class="metrics-row">
        <div class="metric-card glass-panel metric-pink">
          <div class="metric-icon">📅</div>
          <div class="metric-data">
            <span class="metric-num">{{ stats.totalEvents }}</span>
            <span class="metric-label">Eventos Criados</span>
          </div>
        </div>
        <div class="metric-card glass-panel metric-purple">
          <div class="metric-icon">👥</div>
          <div class="metric-data">
            <span class="metric-num">{{ stats.totalRegistrations }}</span>
            <span class="metric-label">Presenças Confirmadas</span>
          </div>
        </div>
        <div class="metric-card glass-panel metric-cyan">
          <div class="metric-icon">📊</div>
          <div class="metric-data">
            <span class="metric-num">{{ occupancyRate }}%</span>
            <span class="metric-label">Taxa de Ocupação Média</span>
          </div>
        </div>
      </section>

      <!-- Painel Principal de Gerenciamento -->
      <section class="management-panel glass-panel">
        <div class="panel-header">
          <h3 class="panel-title">Lista de Eventos</h3>
          <div class="panel-search">
            <input
              v-model="searchText"
              type="text"
              placeholder="Filtrar eventos na tabela..."
              class="form-control"
            />
          </div>
        </div>

        <div v-if="filteredEvents.length > 0" class="custom-table-container">
          <table class="custom-table">
            <thead>
              <tr>
                <th>Evento</th>
                <th>Categoria</th>
                <th>Data e Hora</th>
                <th>Local</th>
                <th>Preenchimento</th>
                <th style="text-align: center;">Ações</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="event in filteredEvents" :key="event.id">
                <td class="font-bold">{{ event.title }}</td>
                <td><span class="badge badge-category">{{ event.category }}</span></td>
                <td class="date-cell">{{ formatTableDate(event.date_time) }}</td>
                <td class="location-cell">{{ event.location }}</td>
                <td>
                  <div class="occupancy-cell">
                    <span class="occupancy-numbers">{{ event.participant_count }} / {{ event.capacity }}</span>
                    <div class="mini-bar-bg">
                      <div
                        class="mini-bar-fill"
                        :style="{ width: `${(event.participant_count / event.capacity) * 100}%` }"
                        :class="getOccupancyClass(event.participant_count, event.capacity)"
                      ></div>
                    </div>
                  </div>
                </td>
                <td class="actions-cell">
                  <button @click="openEditModal(event)" class="btn-action btn-edit" title="Editar Evento">✏️</button>
                  <button @click="confirmDelete(event)" class="btn-action btn-delete" title="Excluir Evento">🗑️</button>
                </td>
              </tr>
            </tbody>
          </table>
        </div>

        <div v-else class="empty-table-state">
          <span class="empty-state-icon">🔎</span>
          <h4 class="empty-state-title">Nenhum evento localizado</h4>
          <p class="empty-state-desc">Não encontramos eventos com este filtro ou você ainda não possui registros cadastrados.</p>
        </div>
      </section>
    </div>

    <!-- ===== MODAL de Criar / Editar Evento ===== -->
    <div v-if="isModalOpen" class="modal-overlay" @click.self="closeModal">
      <div class="modal-card glass-panel">
        <div class="modal-header">
          <h3 class="modal-title">{{ isEditing ? 'Editar Evento' : 'Criar Novo Evento' }}</h3>
          <button @click="closeModal" class="btn-close-modal">×</button>
        </div>

        <form @submit.prevent="saveEvent" class="modal-form">
          <div class="form-grid">
            <!-- Título -->
            <div class="form-group col-span-2">
              <label class="form-label" for="m-title">Título do Evento</label>
              <input v-model="modalForm.title" type="text" id="m-title" required
                placeholder="Ex: Workshop Prático de Vue 3" class="form-control" />
            </div>

            <!-- Categoria e Capacidade -->
            <div class="form-group">
              <label class="form-label" for="m-category">Categoria</label>
              <select v-model="modalForm.category" id="m-category" required class="form-control">
                <option value="" disabled>Selecione...</option>
                <option v-for="cat in availableCategories" :key="cat" :value="cat">{{ cat }}</option>
              </select>
            </div>

            <div class="form-group">
              <label class="form-label" for="m-capacity">Capacidade de Ingressos</label>
              <input v-model.number="modalForm.capacity" type="number" id="m-capacity" required
                min="1" placeholder="Ex: 100" class="form-control" />
            </div>

            <!-- Data/Hora e Localização -->
            <div class="form-group">
              <label class="form-label" for="m-datetime">Data e Hora</label>
              <input v-model="modalForm.date_time" type="datetime-local" id="m-datetime" required class="form-control" />
            </div>

            <div class="form-group">
              <label class="form-label" for="m-location">Local / Endereço</label>
              <input v-model="modalForm.location" type="text" id="m-location" required
                placeholder="Ex: Av. Paulista, 1000 - SP" class="form-control" />
            </div>

            <!-- ===== CAMPO DE IMAGEM (URL OU UPLOAD) ===== -->
            <div class="form-group col-span-2">
              <label class="form-label">Imagem do Evento <span class="required-mark">*</span></label>

              <!-- Abas de seleção de modo -->
              <div class="image-mode-tabs" role="tablist">
                <button
                  type="button"
                  role="tab"
                  :aria-selected="imageMode === 'url'"
                  class="tab-mode-btn"
                  :class="{ active: imageMode === 'url' }"
                  @click="setImageMode('url')"
                >
                  🔗 URL da imagem
                </button>
                <button
                  type="button"
                  role="tab"
                  :aria-selected="imageMode === 'upload'"
                  class="tab-mode-btn"
                  :class="{ active: imageMode === 'upload' }"
                  @click="setImageMode('upload')"
                >
                  📁 Anexar imagem
                </button>
              </div>

              <!-- Modo: URL externa -->
              <div v-if="imageMode === 'url'">
                <input
                  v-model="modalForm.image_url"
                  type="url"
                  id="m-image-url"
                  placeholder="https://images.unsplash.com/..."
                  class="form-control"
                />
                <!-- Preview da URL atual -->
                <div v-if="currentImagePreview" class="preview-wrapper" style="margin-top:0.75rem;">
                  <img :src="currentImagePreview" class="image-preview-thumbnail" alt="Pré-visualização" />
                  <span style="font-size:0.8rem;color:var(--text-secondary);">Pré-visualização</span>
                </div>
              </div>

              <!-- Modo: Upload de arquivo -->
              <div v-else class="file-upload-container">
                <!-- Input de arquivo real (oculto, acionado pelo label) -->
                <input
                  ref="fileInputRef"
                  type="file"
                  id="m-image-file"
                  accept="image/jpeg,image/jpg,image/png,image/webp"
                  class="file-input-hidden"
                  aria-label="Selecionar arquivo de imagem"
                  @change="onFileChange"
                />

                <!-- Label clicável que abre o seletor de arquivo -->
                <label for="m-image-file" class="file-upload-label">
                  <span class="upload-icon">🖼️</span>
                  <span class="upload-text">
                    <strong>Clique para selecionar uma imagem</strong><br />
                    Formatos aceitos: JPG, JPEG, PNG, WEBP · Tamanho máximo: 5MB
                  </span>
                </label>

                <!-- Preview do arquivo selecionado -->
                <div v-if="selectedFile" class="preview-wrapper">
                  <img :src="filePreviewURL" class="image-preview-thumbnail" alt="Arquivo selecionado" />
                  <div style="flex:1;">
                    <p style="font-size:0.85rem;font-weight:600;">{{ selectedFile.name }}</p>
                    <p style="font-size:0.75rem;color:var(--text-muted);">{{ formatFileSize(selectedFile.size) }}</p>
                  </div>
                  <button type="button" class="btn-clear-file" @click="clearFile">Remover</button>
                </div>

                <!-- Preview da imagem já salva no evento (modo edição) -->
                <div v-else-if="isEditing && modalForm.image_url" class="preview-wrapper">
                  <img :src="resolveImageSrc(modalForm.image_url)" class="image-preview-thumbnail" alt="Imagem atual" />
                  <span style="font-size:0.8rem;color:var(--text-secondary);">Imagem atual (será mantida se nenhuma nova for selecionada)</span>
                </div>
              </div>

              <!-- Validação: mensagem de erro de imagem -->
              <p v-if="imageError" class="field-error">{{ imageError }}</p>
            </div>

            <!-- Descrição -->
            <div class="form-group col-span-2">
              <label class="form-label" for="m-desc">Descrição Completa</label>
              <textarea v-model="modalForm.description" id="m-desc" required
                placeholder="Descreva o cronograma, palestrantes, público-alvo..."
                class="form-control"></textarea>
            </div>
          </div>

          <div class="modal-footer">
            <button type="button" @click="closeModal" class="btn btn-secondary">Cancelar</button>
            <button type="submit" class="btn btn-primary" :disabled="isSaving">
              <span v-if="isSaving" class="mini-spinner"></span>
              <span v-else>{{ isEditing ? 'Salvar Alterações' : 'Criar Evento' }}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, computed, reactive, nextTick } from 'vue';
import { api } from '../services/api';
import { showToast } from '../services/toast';

const BACKEND_URL = 'http://localhost:3000';

const stats = ref({ totalEvents: 0, totalRegistrations: 0, eventsDetail: [] });
const isLoading = ref(true);
const isModalOpen = ref(false);
const isEditing = ref(false);
const isSaving = ref(false);
const searchText = ref('');

// ── Estado do campo de imagem ──────────────────────────────────────────────
const imageMode = ref('url');           // 'url' | 'upload'
const selectedFile = ref(null);         // File object quando modo upload
const filePreviewURL = ref('');         // URL.createObjectURL para preview local
const imageError = ref('');             // Mensagem de erro de validação
const fileInputRef = ref(null);         // Ref do <input type="file">

const availableCategories = [
  'Shows & Festivais',
  'Tecnologia',
  'Gastronomia',
  'Artes & Teatro',
  'Negócios & Networking'
];

const modalForm = reactive({
  id: null,
  title: '',
  description: '',
  date_time: '',
  location: '',
  category: '',
  image_url: '',
  capacity: null
});

// ── Computed ───────────────────────────────────────────────────────────────
const occupancyRate = computed(() => {
  if (!stats.value.eventsDetail?.length) return 0;
  let totalCap = 0, totalPart = 0;
  stats.value.eventsDetail.forEach(e => { totalCap += e.capacity; totalPart += e.participant_count; });
  return totalCap === 0 ? 0 : Math.round((totalPart / totalCap) * 100);
});

const filteredEvents = computed(() => {
  const text = searchText.value.toLowerCase().trim();
  if (!text) return stats.value.eventsDetail;
  return stats.value.eventsDetail.filter(e =>
    e.title.toLowerCase().includes(text) ||
    e.category.toLowerCase().includes(text) ||
    e.location.toLowerCase().includes(text)
  );
});

// Preview da URL digitada no modo URL
const currentImagePreview = computed(() => {
  if (imageMode.value !== 'url') return '';
  const url = modalForm.image_url?.trim();
  return url ? resolveImageSrc(url) : '';
});

// ── Helpers ────────────────────────────────────────────────────────────────
// Resolve URLs: caminhos locais /uploads/… ficam preenchidos com o host do backend
function resolveImageSrc(src) {
  if (!src) return '';
  if (src.startsWith('/uploads/')) return `${BACKEND_URL}${src}`;
  return src;
}

function formatTableDate(dateTimeString) {
  if (!dateTimeString) return '';
  const date = new Date(dateTimeString);
  return date.toLocaleDateString('pt-BR', {
    day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit'
  }).replace('.', '');
}

function getOccupancyClass(current, max) {
  const pct = (current / max) * 100;
  if (pct >= 100) return 'danger';
  if (pct >= 85) return 'warning';
  return 'success';
}

function formatFileSize(bytes) {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

// ── Lógica do campo de imagem ──────────────────────────────────────────────
function setImageMode(mode) {
  imageMode.value = mode;
  imageError.value = '';
  if (mode === 'url') {
    clearFile();
  }
}

function onFileChange(event) {
  imageError.value = '';
  const file = event.target.files[0];
  if (!file) return;

  const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
  if (!allowedTypes.includes(file.type)) {
    imageError.value = 'Formato inválido. Apenas JPG, JPEG, PNG e WEBP são aceitos.';
    clearFile();
    return;
  }

  const maxSize = 5 * 1024 * 1024; // 5MB
  if (file.size > maxSize) {
    imageError.value = `Arquivo muito grande (${formatFileSize(file.size)}). O limite é de 5MB.`;
    clearFile();
    return;
  }

  selectedFile.value = file;
  filePreviewURL.value = URL.createObjectURL(file);
}

function clearFile() {
  // Revogar a URL de objeto criada para evitar vazamento de memória
  if (filePreviewURL.value) {
    URL.revokeObjectURL(filePreviewURL.value);
  }
  selectedFile.value = null;
  filePreviewURL.value = '';
  imageError.value = '';

  // Limpar o valor do input de arquivo nativo para permitir re-selecionar o mesmo arquivo
  if (fileInputRef.value) {
    fileInputRef.value.value = '';
  }
}

// ── Carregamento de dados ──────────────────────────────────────────────────
async function loadDashboardData() {
  isLoading.value = true;
  try {
    const data = await api.dashboard.getAdminStats();
    stats.value = data;
  } catch (err) {
    showToast(err.message || 'Erro ao carregar dados administrativos.', 'error');
  } finally {
    isLoading.value = false;
  }
}

// ── Modais ─────────────────────────────────────────────────────────────────
function resetModalForm() {
  modalForm.id = null;
  modalForm.title = '';
  modalForm.description = '';
  modalForm.date_time = '';
  modalForm.location = '';
  modalForm.category = '';
  modalForm.image_url = '';
  modalForm.capacity = null;
  imageMode.value = 'url';
  imageError.value = '';
  clearFile();
}

function openCreateModal() {
  isEditing.value = false;
  resetModalForm();
  isModalOpen.value = true;
}

function openEditModal(event) {
  isEditing.value = true;
  resetModalForm();

  modalForm.id = event.id;
  modalForm.title = event.title;
  modalForm.category = event.category;
  modalForm.location = event.location;
  modalForm.capacity = event.capacity;

  // Converter para datetime-local (YYYY-MM-DDTHH:mm)
  if (event.date_time) {
    const dt = new Date(event.date_time);
    const offset = dt.getTimezoneOffset() * 60000;
    modalForm.date_time = new Date(dt - offset).toISOString().slice(0, 16);
  }

  // Definir modo de imagem baseado no valor existente
  if (event.image_url && event.image_url.startsWith('/uploads/')) {
    // Imagem é um arquivo local -> mostra no modo upload com preview da imagem atual
    imageMode.value = 'upload';
    modalForm.image_url = event.image_url;
  } else {
    imageMode.value = 'url';
    modalForm.image_url = event.image_url || '';
  }

  // Buscar descrição e demais campos completos do evento
  fetchFullEventData(event.id);

  isModalOpen.value = true;
}

async function fetchFullEventData(id) {
  try {
    const fullEvent = await api.events.getById(id);
    modalForm.description = fullEvent.description;
    // Garantir que a image_url já atribuída seja a mais completa
    if (!modalForm.image_url) {
      modalForm.image_url = fullEvent.image_url || '';
    }
  } catch (err) {
    showToast('Não foi possível carregar os dados completos do evento.', 'error');
  }
}

function closeModal() {
  isModalOpen.value = false;
  clearFile();
}

// ── Salvar evento ──────────────────────────────────────────────────────────
async function saveEvent() {
  imageError.value = '';

  // Validação do campo de imagem antes de enviar
  if (imageMode.value === 'url') {
    if (!modalForm.image_url?.trim()) {
      imageError.value = 'Informe a URL da imagem do evento.';
      return;
    }
  } else {
    // Modo upload: arquivo obrigatório somente na criação; na edição pode manter a imagem existente
    if (!selectedFile.value && !isEditing.value) {
      imageError.value = 'Selecione um arquivo de imagem para continuar.';
      return;
    }
  }

  isSaving.value = true;
  try {
    let payload;

    if (imageMode.value === 'upload' && selectedFile.value) {
      // ── Envio via multipart/form-data (novo arquivo selecionado) ──
      const fd = new FormData();
      fd.append('title', modalForm.title);
      fd.append('description', modalForm.description);
      fd.append('date_time', modalForm.date_time);
      fd.append('location', modalForm.location);
      fd.append('category', modalForm.category);
      fd.append('capacity', String(modalForm.capacity));
      fd.append('image_file', selectedFile.value);   // Campo esperado pelo multer
      payload = fd;
    } else {
      // ── Envio via JSON (URL ou edição mantendo imagem existente) ──
      payload = {
        title: modalForm.title,
        description: modalForm.description,
        date_time: modalForm.date_time,
        location: modalForm.location,
        category: modalForm.category,
        capacity: modalForm.capacity,
        image_url: imageMode.value === 'url' ? modalForm.image_url : modalForm.image_url
      };
    }

    let res;
    if (isEditing.value) {
      res = await api.events.update(modalForm.id, payload);
    } else {
      res = await api.events.create(payload);
    }

    showToast(res.message, 'success');
    closeModal();
    loadDashboardData();
  } catch (err) {
    showToast(err.message || 'Erro ao gravar informações do evento.', 'error');
  } finally {
    isSaving.value = false;
  }
}

// ── Exclusão ───────────────────────────────────────────────────────────────
function confirmDelete(event) {
  const confirmed = window.confirm(
    `Tem certeza que deseja excluir o evento "${event.title}"? Todos os registros serão apagados permanentemente.`
  );
  if (confirmed) deleteEvent(event.id);
}

async function deleteEvent(id) {
  try {
    const res = await api.events.delete(id);
    showToast(res.message, 'success');
    loadDashboardData();
  } catch (err) {
    showToast(err.message || 'Falha ao excluir o evento.', 'error');
  }
}

onMounted(() => { loadDashboardData(); });
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
  .dashboard-header { flex-direction: row; align-items: center; }
}

.dashboard-title { font-size: 1.8rem; margin-bottom: 0.5rem; }
.highlight {
  background: var(--gradient-primary);
  -webkit-background-clip: text;
  background-clip: text;
  -webkit-text-fill-color: transparent;
  color: transparent;
}
.dashboard-subtitle { color: var(--text-secondary); font-size: 0.95rem; line-height: 1.5; }

/* Metrics */
.metrics-row {
  display: grid;
  grid-template-columns: 1fr;
  gap: 1.5rem;
  margin-bottom: 2.5rem;
}
@media (min-width: 640px) { .metrics-row { grid-template-columns: repeat(2, 1fr); } }
@media (min-width: 1024px) { .metrics-row { grid-template-columns: repeat(3, 1fr); } }

.metric-card {
  display: flex;
  align-items: center;
  gap: 1.25rem;
  padding: 1.5rem;
  border-left: 4px solid var(--glass-border);
}
.metric-pink  { border-left-color: var(--color-primary); }
.metric-purple{ border-left-color: var(--color-secondary); }
.metric-cyan  { border-left-color: var(--color-accent); }
.metric-icon {
  font-size: 2rem;
  background: rgba(255,255,255,0.04);
  width: 55px; height: 55px;
  border-radius: var(--border-radius-md);
  display: flex; align-items: center; justify-content: center;
  border: 1px solid var(--glass-border);
  flex-shrink: 0;
}
.metric-data { display: flex; flex-direction: column; }
.metric-num { font-family: var(--font-title); font-size: 1.75rem; font-weight: 800; line-height: 1.2; }
.metric-label { font-size: 0.8rem; text-transform: uppercase; color: var(--text-secondary); font-weight: 600; letter-spacing: 0.05em; margin-top: 0.15rem; }

/* Management Panel */
.management-panel { padding: 1.5rem; }
@media (min-width: 768px) { .management-panel { padding: 2rem; } }

.panel-header {
  display: flex;
  flex-direction: column;
  gap: 1rem;
  margin-bottom: 1.5rem;
}
@media (min-width: 768px) {
  .panel-header { flex-direction: row; justify-content: space-between; align-items: center; }
}

.panel-title { font-size: 1.3rem; color: var(--color-accent); }
.panel-search { width: 100%; }
@media (min-width: 768px) { .panel-search { width: 300px; } }

.font-bold { font-weight: 600; }
.date-cell, .location-cell { font-size: 0.85rem; color: var(--text-secondary); }

.actions-cell { display: flex; gap: 0.5rem; justify-content: center; }
.btn-action {
  background: rgba(255,255,255,0.05);
  border: 1px solid var(--glass-border);
  width: 34px; height: 34px;
  border-radius: var(--border-radius-sm);
  display: flex; align-items: center; justify-content: center;
  cursor: pointer; font-size: 0.95rem;
  transition: var(--transition-smooth);
}
.btn-action:hover { transform: scale(1.1); }
.btn-edit:hover { background: rgba(0,240,255,0.15); border-color: var(--color-accent); }
.btn-delete:hover { background: rgba(239,68,68,0.15); border-color: var(--color-danger); }

.occupancy-cell { display: flex; flex-direction: column; gap: 0.35rem; width: 100px; }
.occupancy-numbers { font-size: 0.8rem; color: var(--text-secondary); }
.mini-bar-bg { height: 4px; background: rgba(255,255,255,0.08); border-radius: 20px; overflow: hidden; }
.mini-bar-fill { height: 100%; border-radius: 20px; }
.mini-bar-fill.success { background: var(--color-success); }
.mini-bar-fill.warning { background: var(--color-warning); }
.mini-bar-fill.danger  { background: var(--color-danger); }

.empty-table-state { text-align: center; padding: 3rem 1.5rem; color: var(--text-secondary); }

/* Modal */
.modal-overlay {
  position: fixed;
  top: 0; left: 0; width: 100%; height: 100%;
  background: rgba(5,2,13,0.85);
  backdrop-filter: blur(8px);
  z-index: 1002;
  display: flex; align-items: center; justify-content: center;
  padding: 1rem;
  overflow-y: auto;
}

.modal-card {
  width: 100%;
  max-width: 650px;
  max-height: 92vh;
  display: flex;
  flex-direction: column;
  padding: 0;
  overflow: hidden;
  box-shadow: 0 15px 45px rgba(0,0,0,0.7);
}

.modal-header {
  padding: 1.5rem;
  border-bottom: 1px solid var(--glass-border);
  display: flex; justify-content: space-between; align-items: center;
  flex-shrink: 0;
}
.modal-title {
  font-size: 1.4rem;
  background: var(--gradient-primary);
  -webkit-background-clip: text;
  background-clip: text;
  -webkit-text-fill-color: transparent;
  color: transparent;
}
.btn-close-modal {
  background: transparent; border: none;
  color: var(--text-secondary);
  font-size: 2rem; cursor: pointer; line-height: 1;
}
.btn-close-modal:hover { color: var(--text-primary); }

.modal-form {
  overflow-y: auto;
  padding: 1.5rem;
  display: flex; flex-direction: column; flex: 1;
}

.form-grid {
  display: grid;
  grid-template-columns: 1fr;
  gap: 1.25rem;
}
@media (min-width: 640px) {
  .form-grid { grid-template-columns: repeat(2, 1fr); }
  .col-span-2 { grid-column: span 2; }
}

.modal-footer {
  margin-top: 2rem;
  padding-top: 1.25rem;
  border-top: 1px solid var(--glass-border);
  display: flex; justify-content: flex-end; gap: 1rem;
  flex-shrink: 0;
}

.required-mark { color: var(--color-primary); }

.field-error {
  margin-top: 0.5rem;
  font-size: 0.82rem;
  color: #f87171;
  font-weight: 500;
}

.mini-spinner {
  display: inline-block;
  width: 1.2rem; height: 1.2rem;
  border: 2px solid rgba(255,255,255,0.2);
  border-radius: 50%;
  border-top-color: var(--text-primary);
  animation: spin 0.8s linear infinite;
}
</style>
