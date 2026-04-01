<!--
  App.vue — Root component
  
  The application entry point. Mounts the DashboardLayout which provides
  the persistent shell (Header, Sidebar, Footer) around all routed views.
  Global #app sizing overrides are applied here to ensure full-viewport coverage.
-->
<script setup lang="ts">
import DashboardLayout from './layouts/DashboardLayout.vue'
</script>

<template>
  <DashboardLayout />
</template>

<style>
/* Global styles overriding scoped #app */
#app {
  width: 100%;
  height: 100svh;
  max-width: none;
  margin: 0;
  border: none;
}
</style>
