<!--
  ConfirmModal.vue — Interactive glassmorphic confirmation modal

  Used for confirming destructive or critical actions with a premium dark aesthetic.
  Employs backdrop-filter: blur() and smooth CSS transitions.
-->
<script setup lang="ts">
import { onMounted, onUnmounted } from 'vue'
import BaseButton from '../button/BaseButton.vue'

const props = defineProps({
  /** Controls modal visibility */
  show: {
    type: Boolean,
    default: false
  },
  /** Header title text */
  title: {
    type: String,
    default: 'Confirm Action'
  },
  /** Primary body message */
  message: {
    type: String,
    default: 'Are you sure you want to proceed?'
  },
  /** Label for the confirmation button */
  confirmText: {
    type: String,
    default: 'Confirm'
  },
  /** Label for the cancellation button */
  cancelText: {
    type: String,
    default: 'Cancel'
  },
  /** Use the danger variant style for the confirm button */
  isDanger: {
    type: Boolean,
    default: false
  }
})

const emit = defineEmits(['confirm', 'cancel'])

/** Handle keyboard interaction (ESC to close) */
const handleKeyDown = (e: KeyboardEvent) => {
  if (e.key === 'Escape' && props.show) {
    emit('cancel')
  }
}

onMounted(() => window.addEventListener('keydown', handleKeyDown))
onUnmounted(() => window.removeEventListener('keydown', handleKeyDown))
</script>

<template>
  <Transition name="modal-fade">
    <div v-if="show" class="modal-backdrop" @click.self="emit('cancel')">
      <div class="modal-container">
        <!-- Header -->
        <div class="modal-header">
          <h3 class="modal-title">{{ title }}</h3>
        </div>

        <!-- Body -->
        <div class="modal-body">
          <p class="modal-message">{{ message }}</p>
        </div>

        <!-- Footer Actions -->
        <div class="modal-footer">
          <BaseButton 
            variant="secondary" 
            :text="cancelText" 
            @click="emit('cancel')" 
          />
          <BaseButton 
            :variant="isDanger ? 'danger' : 'primary'" 
            :text="confirmText" 
            @click="emit('confirm')" 
          />
        </div>
      </div>
    </div>
  </Transition>
</template>

<style scoped>
/* Backdrop - Glass effect */
.modal-backdrop {
  position: fixed;
  top: 0;
  left: 0;
  width: 100vw;
  height: 100vh;
  background: rgba(0, 0, 0, 0.4);
  backdrop-filter: blur(12px);
  z-index: 1000;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 1.5rem;
}

/* Modal Content Container */
.modal-container {
  background: var(--bg-secondary);
  border: 1px solid var(--border-color);
  border-radius: var(--border-radius-lg);
  width: 100%;
  max-width: 440px;
  box-shadow: 0 10px 40px rgba(0, 0, 0, 0.6), 
              0 0 10px rgba(126, 87, 194, 0.05); /* Subtle accent glow */
  overflow: hidden;
  transform: scale(1);
}

/* Header Sections */
.modal-header {
  padding: 1.5rem 1.5rem 1rem;
}
.modal-title {
  margin: 0;
  font-size: 1.125rem;
  font-weight: 700;
  color: var(--text-primary);
  letter-spacing: -0.01em;
}

/* Body Content */
.modal-body {
  padding: 0 1.5rem 1.5rem;
}
.modal-message {
  margin: 0;
  font-size: 0.9375rem;
  line-height: 1.6;
  color: var(--text-muted);
}

/* Footer Section */
.modal-footer {
  padding: 1rem 1.5rem 1.5rem;
  display: flex;
  justify-content: flex-end;
  gap: 0.75rem;
}

/* Transitions - Smooth Fade and Zoom */
.modal-fade-enter-active,
.modal-fade-leave-active {
  transition: opacity 0.25s ease;
}

.modal-fade-enter-from,
.modal-fade-leave-to {
  opacity: 0;
}

.modal-fade-enter-active .modal-container,
.modal-fade-leave-active .modal-container {
  transition: transform 0.3s cubic-bezier(0.16, 1, 0.3, 1);
}

.modal-fade-enter-from .modal-container {
  transform: scale(0.95) translateY(10px);
}
.modal-fade-leave-to .modal-container {
  transform: scale(0.98);
}
</style>
