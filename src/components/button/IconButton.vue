<script setup lang="ts">
import Icon from '../Icons/Icon.vue'

defineProps({
  src: {
    type: String,
    required: true
  },
  width: {
    type: [Number, String],
    default: 18
  },
  title: {
    type: String,
    default: ''
  },
  variant: {
    type: String,
    default: 'default' // 'default' | 'play'
  }
})
</script>

<template>
  <button 
    class="control-btn" 
    :class="{ play: variant === 'play' }"
    :title="title"
  >
    <Icon :src="src" :width="width" />
  </button>
</template>

<style scoped>
.control-btn {
  background: transparent;
  border: none;
  color: var(--text-muted);
  width: 36px;
  height: 36px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: all 0.2s ease;
}

.control-btn:hover {
  background: var(--surface-hover);
  color: var(--text-primary);
}

.control-btn:hover :deep(.custom-icon) {
  transform: scale(1.1);
}

.control-btn.play {
  background: var(--surface-light);
  color: var(--accent-color);
}
.control-btn.play:hover {
  background: var(--accent-glow);
}
</style>
