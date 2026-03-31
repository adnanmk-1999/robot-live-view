<!--
  PrimaryButton.vue — Accent-coloured call-to-action button

  A simple slot-based button with the application's primary accent colour.
  Handles hover, active press, and disabled states.

  Usage:
    <PrimaryButton @click="doSomething">Browse Files</PrimaryButton>
    <PrimaryButton disabled>Unavailable</PrimaryButton>
-->
<script setup lang="ts">
// Intentionally prop-free; all content is provided via the default slot.
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
