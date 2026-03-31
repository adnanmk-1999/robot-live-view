<script setup lang="ts">
import Icon from '../Icons/Icon.vue'

defineProps({
  src: {
    type: String,
    default: ''
  },
  width: {
    type: [Number, String],
    default: 18
  },
  title: {
    type: String,
    default: ''
  },
  text: {
    type: String,
    default: ''
  },
  variant: {
    type: String,
    default: 'default' // 'default' | 'primary'
  },
  to: {
    type: String,
    default: ''
  }
})
</script>

<template>
  <component 
    :is="to ? 'router-link' : 'button'"
    :to="to"
    class="icon-btn" 
    :class="[variant, { 'icon-only': src && !text }]"
    :title="title || text"
  >
    <Icon v-if="src" :src="src" :width="width" />
    <span v-if="text">{{ text }}</span>
  </component>
</template>

<style scoped>
.icon-btn {
  background: transparent;
  border: 1px solid transparent;
  color: var(--text-muted);
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;
  padding: 0.5rem 1rem;
  border-radius: var(--border-radius-md);
  font-size: 0.875rem;
  font-weight: 500;
  cursor: pointer;
  text-decoration: none;
  transition: all 0.2s ease;
}

.icon-btn.icon-only {
  width: 36px;
  height: 36px;
  padding: 0;
  border-radius: 50%;
}

.icon-btn:hover {
  background: var(--surface-hover);
  color: var(--text-primary);
}

.icon-btn:hover :deep(.custom-icon) {
  transform: scale(1.1);
}

/* Primary Variant (Header) */
.icon-btn.primary {
  background-color: var(--surface-light);
  color: var(--text-primary);
  border-color: var(--border-color);
}
.icon-btn.primary:hover {
  background-color: var(--surface-hover);
  border-color: var(--text-muted);
}
</style>
