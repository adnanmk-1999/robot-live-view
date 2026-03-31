<!--
  UploadDataView.vue — Telemetry file upload screen (route: '/upload')

  Provides a drag-and-drop / file-browse interface for loading a robot
  telemetry JSON file into the application.

  File handling flow:
    1. User drops or selects a .json file
    2. processFile() validates the file extension
    3. FileReader parses the raw text as JSON
    4. Schema is validated (path, robot, cleaning_gadget must be present)
    5. liveViewStore.loadTelemetry() is called — this triggers all metric
       computations (path length, swept area, traversal time) synchronously
    6. Router navigates to '/' (LiveViewDashboard)

  Error states are displayed inline below the Browse Files button.
-->
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

// Reactive state for drag highlight, file input ref, and error display
const isDragging = ref(false)
const fileInput = ref<HTMLInputElement | null>(null)
const errorMsg = ref('')

/** Activates the drag-over highlight on the drop zone */
const handleDragOver = (e: DragEvent) => {
  e.preventDefault()
  isDragging.value = true
}

/** Removes the drag-over highlight when the cursor leaves the drop zone */
const handleDragLeave = (e: DragEvent) => {
  e.preventDefault()
  isDragging.value = false
}

/** Handles a file dropped onto the drop zone */
const handleDrop = (e: DragEvent) => {
  e.preventDefault()
  isDragging.value = false
  const files = e.dataTransfer?.files
  if (files && files.length > 0) {
    processFile(files[0])
  }
}

/** Handles a file selected via the hidden <input type="file"> */
const handleFileSelect = (e: Event) => {
  const target = e.target as HTMLInputElement
  if (target.files && target.files.length > 0) {
    processFile(target.files[0])
  }
}

/** Programmatically opens the OS file picker dialog */
const triggerBrowse = () => {
  fileInput.value?.click()
}

/**
 * Validates and processes the selected file:
 * - Rejects non-.json extensions immediately
 * - Uses FileReader to read the file as plain text
 * - Parses and validates the resulting JSON against TelemetryData schema
 * - Calls loadTelemetry() which triggers all metric computations
 * - Navigates to the dashboard on success, or sets errorMsg on failure
 */
const processFile = (file: File) => {
  errorMsg.value = ''

  // Guard: only accept JSON files
  if (!file.name.endsWith('.json')) {
    errorMsg.value = 'Error: Please upload a .json file.'
    return
  }

  const reader = new FileReader()
  reader.onload = (e) => {
    try {
      const result = e.target?.result as string
      const json = JSON.parse(result) as TelemetryData

      // Schema guard: ensure all required top-level keys are present
      if (!json.path || !json.robot || !json.cleaning_gadget) {
        throw new Error('Invalid schema: Missing telemetry properties.')
      }

      // Trigger full metric computation pipeline via the store
      liveViewStore.loadTelemetry(json)
      router.push('/')

    } catch (err: any) {
      errorMsg.value = 'Failed to parse JSON: ' + err.message
    }
  }
  reader.readAsText(file) // Reads file content as UTF-8 string, triggers onload
}
</script>

<template>
  <!-- Full-height centred wrapper for the upload card -->
  <div class="upload-view">
    <div class="upload-container">
      <!-- Drop zone: receives drag events and applies .is-dragging highlight class -->
      <div
        class="upload-box"
        :class="{ 'is-dragging': isDragging }"
        @dragover="handleDragOver"
        @dragleave="handleDragLeave"
        @drop="handleDrop"
      >
        <!-- Close button — routes back to the live view dashboard -->
        <div class="close-action">
          <IconButton to="/" :src="closeSrc" :width="16" title="Close" variant="primary" />
        </div>

        <!-- Upload icon; scales up on hover via .upload-box:hover .upload-icon -->
        <Icon :src="uploadSrc" :width="48" class="upload-icon" />

        <h2>Upload Telemetry Data</h2>
        <p>Drag and drop your robot log files here, or click to browse.</p>

        <!-- Hidden native file input — triggered programmatically by triggerBrowse() -->
        <input
          type="file"
          ref="fileInput"
          accept=".json"
          style="display: none"
          @change="handleFileSelect"
        />

        <!-- Visible browse button; delegates click to the hidden input above -->
        <PrimaryButton @click="triggerBrowse">Browse Files</PrimaryButton>

        <!-- Error message: only rendered when processFile() sets errorMsg -->
        <p v-if="errorMsg" class="error-msg">{{ errorMsg }}</p>
      </div>
    </div>
  </div>
</template>

<style scoped>
/* Full-height centred layout for the view */
.upload-view {
  width: 100%;
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 2rem;
}

/* Constrains the card width on wide screens */
.upload-container {
  max-width: 600px;
  width: 100%;
}

/* Main upload card — dashed border signals an interactive drop target */
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
  position: relative; /* Anchor for absolutely-positioned close button */
}

/* Hover state: accent border highlights the drop area */
.upload-box:hover {
  border-color: var(--accent-color);
  background-color: var(--surface-hover);
}

/* Dragging state (class toggled by handleDragOver/handleDragLeave) */
.upload-box.is-dragging {
  border-color: var(--accent-color);
  background-color: var(--surface-hover);
}

/* Close button anchored to the top-right corner of the card */
.close-action {
  position: absolute;
  top: 1rem;
  right: 1rem;
}

/* Upload icon with subtle scale-up on parent hover */
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

/* Inline validation / parse error message */
.error-msg {
  color: #ff5555 !important;
  font-size: 0.875rem;
  font-weight: 500;
  margin-top: 1rem !important;
  margin-bottom: 0 !important;
}
</style>
