/**
 * @file main.ts
 * @description Application entry point. Bootstraps the Vue instance with global plugins.
 */

import { createApp } from 'vue'
import './style.css' // Import global design system / design tokens
import App from './App.vue'
import router from './router'

/**
 * Initialize the root Vue application.
 * Mounts the main App component and registers the router plugin.
 */
const app = createApp(App)

// Inject the router instance into the application context
app.use(router)

// Render the application into the DOM element with ID 'app'
app.mount('#app')
