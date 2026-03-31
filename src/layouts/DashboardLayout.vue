<!--
  DashboardLayout.vue — Main application shell

  Provides the full-viewport CSS grid layout that frames all views:
    ┌──────────────────────────┐
    │         Header           │  ← fixed top bar
    ├──────────┬───────────────┤
    │ Sidebar  │  <RouterView> │  ← active view rendered here
    ├──────────┴───────────────┤
    │         Footer           │  ← fixed bottom bar
    └──────────────────────────┘

  Grid dimensions are controlled via CSS variables:
    --header-height, --footer-height, --sidebar-width
-->
<script setup lang="ts">
import Header from '../components/wireframe/Header.vue'
import Sidebar from '../components/wireframe/Sidebar.vue'
import Footer from '../components/wireframe/Footer.vue'
</script>

<template>
  <!-- Root grid container — defines all four layout zones -->
  <div class="dashboard-layout">
    <!-- Top bar: always on top (z-index 10) -->
    <Header class="dashboard-header" />
    <!-- Left panel: telemetry metrics (z-index 5) -->
    <Sidebar class="dashboard-sidebar" />
    <!-- Main content: routed view fills the centre cell -->
    <main class="dashboard-main">
      <RouterView />
    </main>
    <!-- Bottom bar: playback controls (z-index 10) -->
    <Footer class="dashboard-footer" />
  </div>
</template>

<style scoped>
/*
  CSS grid layout:
    rows:    header | main+sidebar | footer
    columns: sidebar | main
  Each child is assigned a named grid-area.
*/
.dashboard-layout {
  display: grid;
  height: 100svh;       /* Full viewport height, accounting for mobile address bars */
  width: 100%;
  overflow: hidden;     /* Prevents any child from causing scrollbars on the shell */
  background-color: var(--bg-primary);
  color: var(--text-primary);
  grid-template-rows: var(--header-height) 1fr var(--footer-height);
  grid-template-columns: var(--sidebar-width) 1fr;
  grid-template-areas:
    "header  header"
    "sidebar main"
    "footer  footer";
}

/* Header spans both columns — sits above sidebar and main */
.dashboard-header {
  grid-area: header;
  z-index: 10; /* Above sidebar and main content */
}

/* Sidebar occupies the left column in the middle row */
.dashboard-sidebar {
  grid-area: sidebar;
  z-index: 5;
}

/* Main content area: routed view is rendered here */
.dashboard-main {
  grid-area: main;
  position: relative;   /* Anchors absolutely-positioned overlays (e.g. canvas controls) */
  overflow: hidden;
  background-color: var(--bg-secondary);
  border-radius: var(--border-radius-lg) 0 0 0; /* Rounded top-left corner for inset look */
  box-shadow: inset 0 4px 20px rgba(0, 0, 0, 0.5);
}

/* Footer spans both columns — sits below sidebar and main */
.dashboard-footer {
  grid-area: footer;
  z-index: 10; /* Above sidebar and main content */
}
</style>
