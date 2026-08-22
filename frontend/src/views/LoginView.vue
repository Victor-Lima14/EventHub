<template>
  <div class="auth-view">
    <div class="auth-card glass-panel">
      <div class="auth-header">
        <span class="auth-logo">✨</span>
        <h1 class="auth-title">Bem-vindo de volta!</h1>
        <p class="auth-subtitle">Conecte-se para gerenciar ou participar de eventos incríveis.</p>
      </div>

      <!-- Mensagem de Erro -->
      <div v-if="errorMessage" class="error-banner">
        <span class="error-icon">⚠️</span>
        <p class="error-text">{{ errorMessage }}</p>
      </div>

      <form @submit.prevent="handleLogin" class="auth-form">
        <div class="form-group">
          <label class="form-label" for="email">Endereço de E-mail</label>
          <input 
            v-model="form.email" 
            type="email" 
            id="email" 
            required 
            placeholder="seuemail@exemplo.com" 
            class="form-control"
            :disabled="isLoading"
          />
        </div>

        <div class="form-group">
          <label class="form-label" for="password">Sua Senha</label>
          <input 
            v-model="form.password" 
            type="password" 
            id="password" 
            required 
            placeholder="Digite sua senha..." 
            class="form-control"
            :disabled="isLoading"
          />
        </div>

        <button type="submit" class="btn btn-primary w-full" :disabled="isLoading">
          <span v-if="isLoading" class="mini-spinner"></span>
          <span v-else>Entrar na Conta</span>
        </button>
      </form>

      <div class="auth-footer">
        <p>Não tem uma conta de visitante? <router-link to="/register" class="link-highlight">Cadastre-se</router-link></p>
        
        <!-- Dica de demonstração para portfólio -->
        <div class="demo-tip glass-panel">
          <h4 class="tip-title">💡 Credenciais de Demonstração (Admin)</h4>
          <p class="tip-desc">E-mail: <strong>admin@eventos.com</strong> <br> Senha: <strong>admin123</strong></p>
        </div>
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
  email: '',
  password: ''
});

async function handleLogin() {
  errorMessage.value = '';
  isLoading.value = true;
  try {
    const data = await api.auth.login(form.email, form.password);
    
    // Salvar no LocalStorage
    localStorage.setItem('token', data.token);
    localStorage.setItem('user', JSON.stringify(data.user));

    showToast(`Bem-vindo, ${data.user.name}!`, 'success');

    // Notificar Navbar e outras partes do sistema
    window.dispatchEvent(new Event('auth-change'));

    // Redirecionar dependendo da Role
    if (data.user.role === 'admin') {
      router.push('/admin');
    } else {
      router.push('/dashboard');
    }
  } catch (err) {
    errorMessage.value = err.message || 'Falha ao realizar login. Verifique suas credenciais.';
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

.demo-tip {
  margin-top: 1.5rem;
  padding: 1rem;
  background: rgba(0, 240, 255, 0.03);
  border-color: rgba(0, 240, 255, 0.1);
  text-align: left;
  border-radius: var(--border-radius-md);
}

.tip-title {
  font-size: 0.85rem;
  color: var(--color-accent);
  margin-bottom: 0.35rem;
}

.tip-desc {
  font-size: 0.8rem;
  color: var(--text-muted);
  line-height: 1.4;
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
