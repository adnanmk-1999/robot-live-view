import { createRouter, createWebHistory } from 'vue-router'
import LiveViewDashboard from '../views/LiveViewDashboard.vue'

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    {
      path: '/',
      name: 'home',
      component: LiveViewDashboard
    },
    {
      path: '/upload',
      name: 'upload',
      // route level code-splitting
      // this generates a separate chunk (About.[hash].js) for this route
      // which is lazy-loaded when the route is visited.
      component: () => import('../views/UploadDataView.vue')
    }
  ]
})

export default router
