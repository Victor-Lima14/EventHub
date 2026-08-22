const routes = [
  {
    path: '/',
    name: 'home',
    component: () => import('../views/HomeView.vue')
  },
  {
    path: '/event/:id',
    name: 'event-detail',
    component: () => import('../views/EventDetailView.vue')
  },
  {
    path: '/login',
    name: 'login',
    component: () => import('../views/LoginView.vue'),
    meta: { guestOnly: true }
  },
  {
    path: '/register',
    name: 'register',
    component: () => import('../views/RegisterView.vue'),
    meta: { guestOnly: true }
  },
  {
    path: '/dashboard',
    name: 'visitor-dashboard',
    component: () => import('../views/VisitorDashboardView.vue'),
    meta: { requiresAuth: true, role: 'visitor' }
  },
  {
    path: '/admin',
    name: 'admin-dashboard',
    component: () => import('../views/AdminDashboardView.vue'),
    meta: { requiresAuth: true, role: 'admin' }
  },
  // Redirecionar rotas inválidas
  {
    path: '/:pathMatch(.*)*',
    redirect: '/'
  }
];

import { createRouter, createWebHistory } from 'vue-router';

const router = createRouter({
  history: createWebHistory(),
  routes
});

// Guard de navegação para rotas protegidas
router.beforeEach((to, from, next) => {
  const token = localStorage.getItem('token');
  const userString = localStorage.getItem('user');
  let user = null;

  if (userString) {
    try {
      user = JSON.parse(userString);
    } catch (e) {
      localStorage.removeItem('user');
      localStorage.removeItem('token');
    }
  }

  const isAuthenticated = !!token && !!user;

  // 1. Verificar se a rota exige autenticação
  if (to.matched.some(record => record.meta.requiresAuth)) {
    if (!isAuthenticated) {
      return next({ name: 'login' });
    }

    // Verificar restrição de role
    const requiredRole = to.meta.role;
    if (requiredRole && user.role !== requiredRole) {
      // Redireciona para o painel correto de acordo com a role
      if (user.role === 'admin') {
        return next({ name: 'admin-dashboard' });
      } else {
        return next({ name: 'visitor-dashboard' });
      }
    }
    
    return next();
  }

  // 2. Verificar se a rota é exclusiva para deslogados (Login / Registro)
  if (to.matched.some(record => record.meta.guestOnly)) {
    if (isAuthenticated) {
      if (user.role === 'admin') {
        return next({ name: 'admin-dashboard' });
      } else {
        return next({ name: 'visitor-dashboard' });
      }
    }
    return next();
  }

  // Rota pública
  next();
});

export default router;
