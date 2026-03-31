<script setup lang="ts">
import Icon from '../Icons/Icon.vue'
import uploadIcon from '../../assets/icons/upload.svg'
</script>

<template>
  <header class="header">
    <router-link to="/" class="logo" title="Home">
      <img src="../../assets/logo.png" alt="Logo" class="logo-image" />
      <h1 class="logo-text">Robot Live View</h1>
    </router-link>

    <div class="header-actions">
      <router-link to="/upload" class="action-btn primary" title="Upload Data">
        <Icon :src="uploadIcon" :width="16" />
        <span>Upload Path Data</span>
      </router-link>
    </div>
  </header>
</template>

<style scoped>
.header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0 1.5rem;
  background-color: var(--bg-primary);
  border-bottom: 1px solid var(--border-color);
}

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

.logo-image {
  height: 32px;
  width: auto;
  object-fit: contain;
}

.logo-text {
  font-size: 1.1rem;
  font-weight: 600;
  letter-spacing: 0.5px;
  margin: 0;
}

.header-actions {
  display: flex;
  gap: 1rem;
}


.action-btn:hover .custom-icon {
  transform: scale(1.1);
}

.action-btn {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.5rem 1rem;
  border-radius: var(--border-radius-md);
  font-size: 0.875rem;
  font-weight: 500;
  cursor: pointer;
  text-decoration: none;
  transition: all 0.2s ease;
  border: 1px solid transparent;
}

.action-btn.primary {
  background-color: var(--surface-light);
  color: var(--text-primary);
  border-color: var(--border-color);
}

.action-btn.primary:hover {
  background-color: var(--surface-hover);
  border-color: var(--text-muted);
}

kbd {
  font-family: var(--font-mono);
  background: var(--surface-dark);
  padding: 0.1rem 0.3rem;
  border-radius: 4px;
  font-size: 0.75rem;
  color: var(--text-muted);
}
</style>
