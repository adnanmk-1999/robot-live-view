<script setup lang="ts">
import { UploadCloud } from 'lucide-vue-next'
</script>

<template>
  <div class="upload-view">
    <div class="upload-container">
      <div class="upload-box">
        <UploadCloud :size="48" class="upload-icon" />
        <h2>Upload Telemetry Data</h2>
        <p>Drag and drop your robot log files here, or click to browse.</p>
        <button class="browse-btn">Browse Files</button>
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
}

.upload-box:hover {
  border-color: var(--accent-color);
  background-color: var(--surface-hover);
}

.upload-icon {
  color: var(--text-muted);
  margin-bottom: 1rem;
}

.upload-box:hover .upload-icon {
  color: var(--accent-color);
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

.browse-btn {
  background-color: var(--accent-color);
  color: #fff;
  border: none;
  padding: 0.75rem 2rem;
  border-radius: var(--border-radius-md);
  font-size: 1rem;
  font-weight: 500;
  cursor: pointer;
  transition: opacity 0.2s;
}

.browse-btn:hover {
  opacity: 0.9;
}
</style>
