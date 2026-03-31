<!--
  IconButton.vue — Flexible icon/text button component

  Renders as a <button> by default, or as a <RouterLink> when the `to` prop is set.
  Automatically applies circular "icon-only" styling when only `src` is provided.

  Layout behaviour:
    - Icon only  → circular 36×36 button  (src provided, no text)
    - Text only  → standard padded button  (text provided, no src)
    - Icon+text  → icon on the left, label on the right

  Variants:
    'default'  — transparent background, subtle hover
    'primary'  — bordered surface style (used in Header / Upload close)

  Usage:
    <IconButton :src="uploadIcon" :width="16" text="Upload" to="/upload" variant="primary" />
    <IconButton :src="playIcon"   :width="18" title="Play" />
-->
<script setup lang="ts">
import Icon from '../Icons/Icon.vue'

defineProps({
  /** URL of the imported SVG asset. Omit for text-only buttons. */
  src: {
    type: String,
    default: ''
  },
  /** Width (and height) passed to the inner Icon component */
  width: {
    type: [Number, String],
    default: 18
  },
  /** Tooltip text shown on hover */
  title: {
    type: String,
    default: ''
  },
  /** Label rendered beside (or instead of) the icon */
  text: {
    type: String,
    default: ''
  },
  /** Visual variant — 'default' | 'primary' */
  variant: {
    type: String,
    default: 'default'
  },
  /** When set, renders the button as a RouterLink to this path */
  to: {
    type: String,
    default: ''
  }
})
</script>

<template>
  <!--
    Renders as <RouterLink> when `to` is set, otherwise as a plain <button>.
    `icon-only` class is applied automatically when src is given but text is not.
    `title` falls back to `text` so keyboard/screen-reader users always get a label.
  -->
  <component :is="to ? 'RouterLink' : 'button'" :to="to" class="icon-btn"
    :class="[variant, { 'icon-only': src && !text }]" :title="title || text">
    <!-- Icon — only rendered when an src asset is provided -->
    <Icon v-if="src" :src="src" :width="width" />
    <!-- Label text — only rendered when text prop is provided -->
    <span v-if="text">{{ text }}</span>
  </component>
</template>

<style scoped>
/* Base button: shared by all variants */
.icon-btn {
  background: transparent;
  border: 1px solid transparent; /* Transparent border reserves space so layout doesn't shift on hover */
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
  text-decoration: none; /* Removes underline when rendered as RouterLink */
  transition: all 0.2s ease;
}

/* Icon-only mode: collapses to a circular 36×36 hit target */
.icon-btn.icon-only {
  width: 36px;
  height: 36px;
  padding: 0;
  border-radius: 50%;
}

/* Default hover state */
.icon-btn:hover {
  background: var(--surface-hover);
  color: var(--text-primary);
}

/* Micro-animation: icon scales up slightly on hover via the child component's class */
.icon-btn:hover :deep(.custom-icon) {
  transform: scale(1.1); /* :deep() pierces the scoped boundary to reach Icon's img */
}

/* Primary Variant — bordered surface style used in Header and upload close button */
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
