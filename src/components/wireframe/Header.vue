<script setup lang="ts">
import IconButton from '../button/IconButton.vue'
import uploadIcon from '../../assets/icons/upload.svg'
</script>

<template>
  <header class="header">
    <router-link to="/" class="logo" title="Home">
      <img src="../../assets/logo.png" alt="Logo" class="logo-image" />
      <h1 class="logo-text">Robot Live View</h1>
    </router-link>

    <div class="header-actions">
      <IconButton 
        to="/upload" 
        :src="uploadIcon" 
        :width="16" 
        title="Upload Data" 
        text="Upload Path Data" 
        variant="primary" 
      />
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



kbd {
  font-family: var(--font-mono);
  background: var(--surface-dark);
  padding: 0.1rem 0.3rem;
  border-radius: 4px;
  font-size: 0.75rem;
  color: var(--text-muted);
}
</style>
