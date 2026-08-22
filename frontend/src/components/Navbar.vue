<template>
  <nav class="navbar">
    <div class="navbar-container">
      <!-- Logotipo da navbar — exibe apenas o texto "EventHub" sem ícone/imagem -->
      <router-link to="/" class="navbar-logo">
        <span class="logo-text">EventHub</span>
      </router-link>


      <!-- Botão do menu móvel -->
      <button class="menu-toggle" @click="toggleMenu" :class="{ 'is-active': isMenuOpen }">
        <span class="bar"></span>
        <span class="bar"></span>
        <span class="bar"></span>
      </button>

      <!-- Links de navegação -->
      <div class="navbar-links" :class="{ 'is-open': isMenuOpen }">
        <router-link to="/" class="nav-link" @click="closeMenu">
          Explorar
        </router-link>

        <template v-if="isAuthenticated">
          <router-link v-if="user.role === 'admin'" to="/admin" class="nav-link" @click="closeMenu">
            Painel Admin
          </router-link>
          <router-link v-else to="/dashboard" class="nav-link" @click="closeMenu">
            Meus Eventos
          </router-link>

          <div class="user-info">
            <span class="user-name">{{ user.name }}</span>
            <span class="user-role">{{ user.role === 'admin' ? 'Organizador' : 'Visitante' }}</span>
          </div>

          <button @click="logout" class="btn btn-secondary btn-sm nav-btn-logout">
            Sair
          </button>
        </template>

        <template v-else>
          <router-link to="/login" class="nav-link" @click="closeMenu">
            Entrar
          </router-link>
          <router-link to="/register" class="btn btn-primary btn-sm nav-btn-register" @click="closeMenu">
            Criar Conta
          </router-link>
        </template>
      </div>
    </div>
  </nav>
</template>

<script setup>
import { ref, computed, onMounted, onUnmounted } from 'vue';
import { useRouter } from 'vue-router';
// Import do logo removido — guia.png é utilizado apenas como favicon (via /public/guia.png)
import { showToast } from '../services/toast';

const router = useRouter();
const isMenuOpen = ref(false);

const user = ref(null);

const isAuthenticated = computed(() => !!user.value);

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

// Escuta mudanças de localStorage para sincronizar sessões (em guias diferentes ou eventos internos)
function handleStorageChange() {
  loadUser();
}

onMounted(() => {
  loadUser();
  window.addEventListener('storage', handleStorageChange);
  // Evento customizado para login imediato na mesma guia
  window.addEventListener('auth-change', loadUser);
});

onUnmounted(() => {
  window.removeEventListener('storage', handleStorageChange);
  window.removeEventListener('auth-change', loadUser);
});

function toggleMenu() {
  isMenuOpen.value = !isMenuOpen.value;
}

function closeMenu() {
  isMenuOpen.value = false;
}

function logout() {
  localStorage.removeItem('token');
  localStorage.removeItem('user');
  user.value = null;
  closeMenu();
  showToast('Você saiu da sua conta. Até logo!', 'info');
  
  // Dispara evento para notificar outros componentes
  window.dispatchEvent(new Event('auth-change'));
  
  router.push('/');
}
</script>

<style scoped>
.navbar {
  background: rgba(10, 5, 22, 0.8);
  backdrop-filter: blur(16px);
  -webkit-backdrop-filter: blur(16px);
  border-bottom: 1px solid var(--glass-border);
  position: sticky;
  top: 0;
  z-index: 999;
  padding: 1rem 0;
}

.navbar-container {
  max-width: 1200px;
  width: 100%;
  margin: 0 auto;
  padding: 0 1rem;
  display: flex;
  justify-content: space-between;
  align-items: center;
}

@media (min-width: 768px) {
  .navbar-container {
    padding: 0 2rem;
  }
}

.navbar-logo {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  text-decoration: none;
}

/* Classe .logo-icon-img removida — ícone não é mais exibido na navbar */

.logo-text {
  font-family: var(--font-title);
  font-weight: 800;
  font-size: 1.3rem;
  background: var(--gradient-vibrant);
  -webkit-background-clip: text;
  background-clip: text;
  -webkit-text-fill-color: transparent;
  color: transparent;
  letter-spacing: -0.03em;
}

.navbar-links {
  display: flex;
  align-items: center;
  gap: 1.5rem;
}

.nav-link {
  font-family: var(--font-title);
  font-weight: 500;
  color: var(--text-secondary);
  font-size: 0.95rem;
  padding: 0.25rem 0;
  border-bottom: 2px solid transparent;
  transition: var(--transition-smooth);
}

.nav-link:hover,
.router-link-active.nav-link {
  color: var(--text-primary);
  border-bottom-color: var(--color-primary);
}

.user-info {
  display: flex;
  flex-direction: column;
  align-items: flex-end;
  border-right: 1px solid var(--glass-border);
  padding-right: 1rem;
  margin-right: 0.25rem;
}

.user-name {
  font-size: 0.85rem;
  font-weight: 600;
  color: var(--text-primary);
}

.user-role {
  font-size: 0.7rem;
  color: var(--color-accent);
  text-transform: uppercase;
  font-weight: 700;
}

.menu-toggle {
  display: none;
  flex-direction: column;
  justify-content: space-between;
  width: 30px;
  height: 21px;
  background: transparent;
  border: none;
  cursor: pointer;
  z-index: 1000;
}

.menu-toggle .bar {
  width: 100%;
  height: 3px;
  background-color: var(--text-primary);
  border-radius: 10px;
  transition: var(--transition-smooth);
}

/* Responsividade Mobile */
@media (max-width: 768px) {
  .menu-toggle {
    display: flex;
  }

  .navbar-links {
    position: fixed;
    top: 0;
    right: -100%;
    width: 280px;
    height: 100vh;
    background: rgba(18, 11, 36, 0.95);
    backdrop-filter: blur(24px);
    border-left: 1px solid var(--glass-border);
    flex-direction: column;
    align-items: stretch;
    justify-content: flex-start;
    padding: 6rem 2rem 2rem;
    gap: 2rem;
    transition: right 0.4s cubic-bezier(0.16, 1, 0.3, 1);
  }

  .navbar-links.is-open {
    right: 0;
  }

  .nav-link {
    font-size: 1.1rem;
    padding: 0.5rem 0;
  }

  .user-info {
    align-items: flex-start;
    border-right: none;
    border-top: 1px solid var(--glass-border);
    border-bottom: 1px solid var(--glass-border);
    padding: 1rem 0;
    margin: 0;
  }

  .nav-btn-logout {
    width: 100%;
  }

  .nav-btn-register {
    width: 100%;
  }

  /* Hamburger Menu Animation */
  .menu-toggle.is-active .bar:nth-child(1) {
    transform: translateY(9px) rotate(45deg);
  }
  .menu-toggle.is-active .bar:nth-child(2) {
    opacity: 0;
  }
  .menu-toggle.is-active .bar:nth-child(3) {
    transform: translateY(-9px) rotate(-45deg);
  }
}
</style>
