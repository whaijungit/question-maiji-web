import { createRouter, createWebHistory } from 'vue-router'

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    {
      path: '/',
      name: 'home',
      // 路由级代码分割：按需加载刷题主界面（单独 chunk）
      component: () => import('../views/QuizeView.vue'),
    },
  ],
})

export default router
