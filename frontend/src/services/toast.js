import { ref } from 'vue';

const toasts = ref([]);

export function showToast(message, type = 'info', duration = 3500) {
  const id = Date.now() + Math.random();
  toasts.value.push({ id, message, type });
  
  setTimeout(() => {
    toasts.value = toasts.value.filter(t => t.id !== id);
  }, duration);
}

export { toasts };
export default showToast;
