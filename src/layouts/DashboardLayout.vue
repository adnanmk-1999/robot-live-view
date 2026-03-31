<script setup lang="ts">
import Header from '../components/wireframe/Header.vue'
import Sidebar from '../components/wireframe/Sidebar.vue'
import Footer from '../components/wireframe/Footer.vue'
</script>

<template>
  <div class="dashboard-layout">
    <Header class="dashboard-header" />
    <Sidebar class="dashboard-sidebar" />
    <main class="dashboard-main">
      <router-view />
    </main>
    <Footer class="dashboard-footer" />
  </div>
</template>

<style scoped>
.dashboard-layout {
  display: grid;
  height: 100svh;
  width: 100%;
  overflow: hidden;
  background-color: var(--bg-primary);
  color: var(--text-primary);
  grid-template-rows: var(--header-height) 1fr var(--footer-height);
  grid-template-columns: var(--sidebar-width) 1fr;
  grid-template-areas:
    "header header"
    "sidebar main"
    "footer footer";
}

.dashboard-header {
  grid-area: header;
  z-index: 10;
}

.dashboard-sidebar {
  grid-area: sidebar;
  z-index: 5;
}

.dashboard-main {
  grid-area: main;
  position: relative;
  overflow: hidden;
  background-color: var(--bg-secondary);
  border-radius: var(--border-radius-lg) 0 0 0;
  box-shadow: inset 0 4px 20px rgba(0,0,0,0.5);
}

.dashboard-footer {
  grid-area: footer;
  z-index: 10;
}
</style>
