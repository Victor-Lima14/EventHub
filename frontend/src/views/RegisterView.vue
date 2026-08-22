<template>
  <div class="auth-view">
    <div class="auth-card glass-panel">
      <div class="auth-header">
        <span class="auth-logo">🚀</span>
        <h1 class="auth-title">Criar Conta</h1>
        <p class="auth-subtitle">Cadastre-se como visitante para confirmar presenças e favoritar seus eventos favoritos.</p>
      </div>

      <!-- Mensagem de Erro -->
      <div v-if="errorMessage" class="error-banner">
        <span class="error-icon">⚠️</span>
        <p class="error-text">{{ errorMessage }}</p>
      </div>

      <form @submit.prevent="handleRegister" class="auth-form">
        <div class="form-group">
          <label class="form-label" for="name">Nome Completo</label>
          <input 
            v-model="form.name" 
            type="text" 
            id="name" 
            required 
            placeholder="Seu nome completo..." 
            class="form-control"
            :disabled="isLoading"
          />
        </div>

        <div class="form-group">
          <label class="form-label" for="email">Endereço de E-mail</label>
          <input 
            v-model="form.email" 
            type="email" 
            id="email" 
            required 
            placeholder="exemplo@email.com" 
            class="form-control"
            :disabled="isLoading"
          />
        </div>

        <div class="form-group">
          <label class="form-label" for="password">Crie uma Senha</label>
          <input 
            v-model="form.password" 
            type="password" 
            id="password" 
            required 
            placeholder="Mínimo de 6 caracteres..." 
            class="form-control"
            :disabled="isLoading"
          />
        </div>

        <div class="form-group">
          <label class="form-label" for="confirmPassword">Confirme sua Senha</label>
          <input 
            v-model="form.confirmPassword" 
            type="password" 
            id="confirmPassword" 
            required 
            placeholder="Confirme sua senha..." 
            class="form-control"
            :disabled="isLoading"
          />
        </div>

        <button type="submit" class="btn btn-primary w-full" :disabled="isLoading">
          <span v-if="isLoading" class="mini-spinner"></span>
          <span v-else>Criar Minha Conta</span>
        </button>
      </form>

      <div class="auth-footer">
        <p>Já possui uma conta? <router-link to="/login" class="link-highlight">Faça Login</router-link></p>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, reactive } from 'vue';
import { useRouter } from 'vue-router';
import { api } from '../services/api';
import { showToast } from '../services/toast';

const router = useRouter();
const isLoading = ref(false);
const errorMessage = ref('');

const form = reactive({
  name: '',
  email: '',
  password: '',
  confirmPassword: ''
});

async function handleRegister() {
  errorMessage.value = '';
  
  // Validações básicas no cliente
  if (form.password.length < 6) {
    errorMessage.value = 'A senha deve conter no mínimo 6 caracteres.';
    showToast(errorMessage.value, 'error');
    return;
  }

  if (form.password !== form.confirmPassword) {
    errorMessage.value = 'As senhas digitadas não coincidem.';
    showToast(errorMessage.value, 'error');
    return;
  }

  isLoading.value = true;
  try {
    const data = await api.auth.register(form.name, form.email, form.password);
    
    // Armazenar sessão
    localStorage.setItem('token', data.token);
    localStorage.setItem('user', JSON.stringify(data.user));

    showToast(`Conta criada com sucesso! Bem-vindo, ${data.user.name}!`, 'success');
    
    // Notificar Navbar e outras partes
    window.dispatchEvent(new Event('auth-change'));

    // Visitantes são direcionados ao dashboard do visitante
    router.push('/dashboard');
  } catch (err) {
    errorMessage.value = err.message || 'Falha ao registrar conta. Tente novamente.';
    showToast(errorMessage.value, 'error');
  } finally {
    isLoading.value = false;
  }
}
</script>

<style scoped>
.auth-view {
  display: flex;
  justify-content: center;
  align-items: center;
  min-height: calc(100vh - 160px);
  padding: 1rem 0;
}

.auth-card {
  width: 100%;
  max-width: 450px;
}

.auth-header {
  text-align: center;
  margin-bottom: 2rem;
}

.auth-logo {
  font-size: 2.5rem;
  display: inline-block;
  margin-bottom: 0.5rem;
}

.auth-title {
  font-size: 1.75rem;
  margin-bottom: 0.5rem;
  background: var(--gradient-primary);
  -webkit-background-clip: text;
  background-clip: text;
  -webkit-text-fill-color: transparent;
  color: transparent;
}

.auth-subtitle {
  color: var(--text-secondary);
  font-size: 0.9rem;
  line-height: 1.5;
}

.error-banner {
  background: rgba(239, 68, 68, 0.15);
  border: 1px solid rgba(239, 68, 68, 0.3);
  padding: 0.75rem 1rem;
  border-radius: var(--border-radius-md);
  display: flex;
  align-items: center;
  gap: 0.75rem;
  margin-bottom: 1.5rem;
}

.error-icon {
  font-size: 1.2rem;
  flex-shrink: 0;
}

.error-text {
  color: #ff8b8b;
  font-size: 0.85rem;
  line-height: 1.4;
}

.auth-form {
  margin-bottom: 1.5rem;
}

.w-full {
  width: 100%;
}

.auth-footer {
  text-align: center;
  font-size: 0.9rem;
  color: var(--text-secondary);
}

.link-highlight {
  color: var(--color-accent);
  font-weight: 600;
}

.link-highlight:hover {
  text-decoration: underline;
}

.mini-spinner {
  display: inline-block;
  width: 1.2rem;
  height: 1.2rem;
  border: 2px solid rgba(255, 255, 255, 0.2);
  border-radius: 50%;
  border-top-color: var(--text-primary);
  animation: spin 0.8s linear infinite;
}
</style>
