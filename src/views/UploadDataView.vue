<script setup lang="ts">
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { liveViewStore } from '../stores/liveViewStore'
import type { TelemetryData } from '../types/telemetry'

import PrimaryButton from '../components/button/PrimaryButton.vue'
import Icon from '../components/Icons/Icon.vue'
import IconButton from '../components/button/IconButton.vue'
import uploadSrc from '../assets/icons/upload.svg'
import closeSrc from '../assets/icons/close.svg'

const router = useRouter()
const isDragging = ref(false)
const fileInput = ref<HTMLInputElement | null>(null)
const errorMsg = ref('')

const handleDragOver = (e: DragEvent) => {
  e.preventDefault()
  isDragging.value = true
}

const handleDragLeave = (e: DragEvent) => {
  e.preventDefault()
  isDragging.value = false
}

const handleDrop = (e: DragEvent) => {
  e.preventDefault()
  isDragging.value = false
  const files = e.dataTransfer?.files
  if (files && files.length > 0) {
    processFile(files[0])
  }
}

const handleFileSelect = (e: Event) => {
  const target = e.target as HTMLInputElement
  if (target.files && target.files.length > 0) {
    processFile(target.files[0])
  }
}

const triggerBrowse = () => {
  fileInput.value?.click()
}

const processFile = (file: File) => {
  errorMsg.value = ''
  
  if (!file.name.endsWith('.json')) {
    errorMsg.value = 'Error: Please upload a .json file.'
    return
  }

  const reader = new FileReader()
  reader.onload = (e) => {
    try {
      const result = e.target?.result as string
      const json = JSON.parse(result) as TelemetryData
      
      if (!json.path || !json.robot || !json.cleaning_gadget) {
        throw new Error('Invalid schema: Missing telemetry properties.')
      }

      liveViewStore.loadTelemetry(json)
      console.log("Telemetry Data:",json)
      router.push('/')
      
    } catch (err: any) {
      errorMsg.value = 'Failed to parse JSON: ' + err.message
    }
  }
  reader.readAsText(file)
}
</script>

<template>
  <div class="upload-view">
    <div class="upload-container">
      <div 
        class="upload-box" 
        :class="{ 'is-dragging': isDragging }"
        @dragover="handleDragOver"
        @dragleave="handleDragLeave"
        @drop="handleDrop"
      >
        <div class="close-action">
          <IconButton to="/" :src="closeSrc" :width="16" title="Close" variant="primary"/>
        </div>
        <Icon :src="uploadSrc" :width="48" class="upload-icon" />
        <h2>Upload Telemetry Data</h2>
        <p>Drag and drop your robot log files here, or click to browse.</p>
        
        <input 
          type="file" 
          ref="fileInput" 
          accept=".json" 
          style="display: none" 
          @change="handleFileSelect"
        />
        
        <PrimaryButton @click="triggerBrowse">Browse Files</PrimaryButton>

        <p v-if="errorMsg" class="error-msg">{{ errorMsg }}</p>
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

.upload-box.is-dragging {
  border-color: var(--accent-color);
  background-color: var(--surface-hover);
}

.error-msg {
  color: #ff5555 !important;
  font-size: 0.875rem;
  font-weight: 500;
  margin-top: 1rem !important;
  margin-bottom: 0 !important;
}

</style>
