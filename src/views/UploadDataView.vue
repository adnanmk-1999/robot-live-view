<script setup lang="ts">
import PrimaryButton from '../components/button/PrimaryButton.vue'
import Icon from '../components/Icons/Icon.vue'
import IconButton from '../components/button/IconButton.vue'
import uploadSrc from '../assets/icons/upload.svg'
import closeSrc from '../assets/icons/close.svg'
</script>

<template>
  <div class="upload-view">
    <div class="upload-container">
      <div class="upload-box">
        <div class="close-action">
          <IconButton to="/" :src="closeSrc" :width="16" title="Close" variant="primary"/>
        </div>
        <Icon :src="uploadSrc" :width="48" class="upload-icon" />
        <h2>Upload Telemetry Data</h2>
        <p>Drag and drop your robot log files here, or click to browse.</p>
        <PrimaryButton>Browse Files</PrimaryButton>
      </div>
    </div>
  </div>
</template>

<style scoped>
.upload-view {
  width: 100%;
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 2rem;
}

.upload-container {
  max-width: 600px;
  width: 100%;
}

.upload-box {
  background-color: var(--surface-light);
  border: 2px dashed var(--border-color);
  border-radius: var(--border-radius-lg);
  padding: 4rem 2rem;
  text-align: center;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 1rem;
  transition: all 0.3s ease;
  position: relative;
}

.upload-box:hover {
  border-color: var(--accent-color);
  background-color: var(--surface-hover);
}

.close-action {
  position: absolute;
  top: 1rem;
  right: 1rem;
}

.upload-icon {
  margin-bottom: 1rem;
  transition: transform 0.3s ease;
}

.upload-box:hover .upload-icon {
  transform: scale(1.05);
}

.upload-box h2 {
  margin: 0;
  color: var(--text-primary);
  font-weight: 500;
}

.upload-box p {
  color: var(--text-muted);
  margin: 0 0 1.5rem 0;
}

</style>
