<!--
  Header.vue — Top navigation bar

  Persistent header rendered across all dashboard views. Contains:
  - Logo / home link (RouterLink to '/')
  - Header actions: "Upload Path Data" button (RouterLink to '/upload')
-->
<script setup lang="ts">
import { ref } from 'vue'
import IconButton from '../button/IconButton.vue'
import ConfirmModal from '../modals/ConfirmModal.vue'
import uploadIcon from '../../assets/icons/upload.svg'
import deleteIcon from '../../assets/icons/delete.svg'

import { telemetryStore } from '../../stores/telemetryStore'
import { liveViewStore } from '../../stores/liveViewStore'

const isConfirmModalOpen = ref(false)

const clearAllStores = () => {
  isConfirmModalOpen.value = true
}

const handleConfirmDelete = () => {
  telemetryStore.clear()
  liveViewStore.clearStore()
  isConfirmModalOpen.value = false
}
</script>

<template>
  <header class="header">
    <!-- Logo: home link with logo image and app name -->
    <RouterLink to="/" class="logo" title="Home">
      <img src="../../assets/logo.png" alt="Logo" class="logo-image" />
      <h1 class="logo-text">Robot Live View</h1>
    </RouterLink>

    <!-- Right-side action buttons -->
    <div class="header-actions">
      <!-- Delete button: visible only when data is loaded -->
      <IconButton v-if="telemetryStore.state.isLoaded" :src="deleteIcon" :width="16" title="Clear All Data"
        variant="danger" @click="clearAllStores" />

      <!-- Upload button: primary variant, routes to /upload -->
      <IconButton to="/upload" :src="uploadIcon" :width="16" title="Upload Data" text="Upload Path Data"
        variant="primary" />
    </div>

    <!-- Confirmation Modal for Deletion -->
    <ConfirmModal 
      :show="isConfirmModalOpen" 
      title="Delete Telemetry Data?" 
      message="This will permanently purge the currently loaded path and all its associated analytical metrics. Are you sure?"
      confirm-text="Delete Data"
      is-danger
      @confirm="handleConfirmDelete"
      @cancel="isConfirmModalOpen = false"
    />
  </header>
</template>

<style scoped>
/* Horizontal flex bar spanning the full header grid area */
.header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0 1.5rem;
  background-color: var(--bg-primary);
  border-bottom: 1px solid var(--border-color);
}

/* Logo link: flex row with logo image + text, no underline */
.logo {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  text-decoration: none;
  color: var(--text-primary);
  transition: opacity 0.2s;
}

.logo:hover {
  opacity: 0.8;
}

/* Fixed-height logo mark */
.logo-image {
  height: 32px;
  width: auto;
  object-fit: contain;
}

/* Application name text */
.logo-text {
  font-size: 1.1rem;
  font-weight: 600;
  letter-spacing: 0.5px;
  margin: 0;
}

/* Container for header action buttons (upload, future controls) */
.header-actions {
  display: flex;
  gap: 1rem;
}

/* Monospace keyboard shortcut badge style (unused currently) */
kbd {
  font-family: var(--font-mono);
  background: var(--surface-dark);
  padding: 0.1rem 0.3rem;
  border-radius: 4px;
  font-size: 0.75rem;
  color: var(--text-muted);
}
</style>
