<template>
  <div class="app-container">
    <Navbar />

    <main class="main-content">
      <router-view v-slot="{ Component }">
        <transition name="fade" mode="out-in">
          <component :is="Component" />
        </transition>
      </router-view>
    </main>

    <!-- Toast Notifications System -->
    <div class="toast-container">
      <div 
        v-for="toast in toasts" 
        :key="toast.id" 
        class="toast-notification"
        :class="`toast-${toast.type}`"
      >
        <span class="toast-icon">
          <span v-if="toast.type === 'success'">✔️</span>
          <span v-else-if="toast.type === 'error'">❌</span>
          <span v-else>ℹ️</span>
        </span>
        <div class="toast-message">{{ toast.message }}</div>
      </div>
    </div>
  </div>
</template>

<script setup>
import Navbar from './components/Navbar.vue';
import { toasts } from './services/toast';
</script>

<style>
/* Efeito de Transição de Rota Suave */
.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.2s ease;
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}

/* Container de Toasts */
.toast-container {
  position: fixed;
  bottom: 2rem;
  right: 2rem;
  z-index: 1001;
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
  pointer-events: none;
}

.toast-notification {
  pointer-events: auto;
}

.toast-icon {
  font-size: 1.1rem;
  display: flex;
  align-items: center;
  justify-content: center;
}

.toast-message {
  font-family: var(--font-body);
  font-size: 0.9rem;
}
</style>
