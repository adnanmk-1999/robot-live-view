<!--
  BaseButton.vue — Flexible text-based button component
  
  Used for primary, secondary, and danger oriented text actions.
  Designed with the app's premium dark aesthetic.
-->
<script setup lang="ts">
defineProps({
  /** Button label */
  text: {
    type: String,
    required: true
  },
  /** Visual variant — 'primary' | 'secondary' | 'danger' */
  variant: {
    type: String,
    default: 'primary'
  },
  /** Whether the button is currently in a loading state */
  loading: {
    type: Boolean,
    default: false
  },
  /** Whether the button is interactive */
  disabled: {
    type: Boolean,
    default: false
  }
})

defineEmits(['click'])
</script>

<template>
  <button 
    class="base-btn" 
    :class="[variant, { 'is-loading': loading }]" 
    :disabled="disabled || loading"
    @click="$emit('click')"
  >
    <span v-if="!loading" class="btn-text">{{ text }}</span>
    <span v-else class="loader"></span>
  </button>
</template>

<style scoped>
.base-btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  padding: 0.625rem 1.25rem;
  font-size: 0.875rem;
  font-weight: 600;
  border-radius: var(--border-radius-md);
  cursor: pointer;
  border: 1px solid transparent;
  transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
  font-family: var(--font-sans);
  min-width: 100px;
  outline: none;
}

.base-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

/* Primary Variant (purple highlight) */
.base-btn.primary {
  background: var(--accent-color);
  color: white;
}
.base-btn.primary:hover:not(:disabled) {
  filter: brightness(1.1);
  box-shadow: 0 0 15px var(--accent-glow);
}

/* Secondary Variant (bordered/outline) */
.base-btn.secondary {
  background: var(--surface-light);
  border-color: var(--border-color);
  color: var(--text-primary);
}
.base-btn.secondary:hover:not(:disabled) {
  background: var(--surface-hover);
  border-color: var(--text-muted);
}

/* Danger Variant (red alert) */
.base-btn.danger {
  background: var(--danger);
  color: white;
}
.base-btn.danger:hover:not(:disabled) {
  filter: brightness(1.1);
  box-shadow: 0 0 15px rgba(239, 68, 68, 0.3);
}

/* Loading state spinner */
.loader {
  width: 16px;
  height: 16px;
  border: 2px solid rgba(255, 255, 255, 0.3);
  border-radius: 50%;
  border-top-color: white;
  animation: spin 0.8s linear infinite;
}

@keyframes spin {
  to { transform: rotate(360deg); }
}
</style>
