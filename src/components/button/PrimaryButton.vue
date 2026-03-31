<script setup lang="ts">
// PrimaryButton component
</script>

<template>
  <button class="primary-btn">
    <slot></slot>
  </button>
</template>

<style scoped>
.primary-btn {
  background-color: var(--accent-color);
  color: #fff;
  border: none;
  padding: 0.75rem 2rem;
  border-radius: var(--border-radius-md);
  font-size: 1rem;
  font-weight: 500;
  cursor: pointer;
  transition: opacity 0.2s, background-color 0.2s, transform 0.1s;
}

.primary-btn:hover {
  opacity: 0.9;
}

.primary-btn:active {
  transform: scale(0.98);
}

.primary-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
  transform: none;
}
</style>
