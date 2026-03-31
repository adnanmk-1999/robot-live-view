/**
 * @file router/index.ts
 * @description Vue Router configuration defining application routes and navigation history.
 */

import { createRouter, createWebHistory } from 'vue-router'
import LiveViewDashboard from '../views/LiveViewDashboard.vue'

/**
 * Global Router instance.
 * Maps URL paths to Vue components.
 */
const router = createRouter({
  /** Uses HTML5 History API for clean URLs (no hash). */
  history: createWebHistory(import.meta.env.BASE_URL),
  
  routes: [
    {
      /** Main Dashboard view — the default landing page. */
      path: '/',
      name: 'home',
      component: LiveViewDashboard
    },
    {
      /** File upload view — lazy-loaded to reduce initial bundle size. */
      path: '/upload',
      name: 'upload',
      // route level code-splitting for potentially large components
      component: () => import('../views/UploadDataView.vue')
    }
  ]
})

export default router
