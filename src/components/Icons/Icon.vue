<!--
  Icon.vue — Reusable SVG icon component

  Renders a pre-imported SVG asset as a sized inline image.
  Size is controlled via the `width` prop (applied to both width and height
  for square icons). The `lineColor` prop is available for future filter-based
  tinting but has no visual effect on img-rendered SVGs without additional CSS.

  Usage:
    import myIcon from '@/assets/icons/my-icon.svg'
    <Icon :src="myIcon" :width="20" />
-->
<script setup lang="ts">
import { computed } from 'vue'

const props = defineProps({
  /** URL of the imported SVG asset */
  src: {
    type: String,
    required: true
  },
  /** Width (and height) of the icon in px, or a CSS string value */
  width: {
    type: [Number, String],
    default: 24
  },
  /** Intended tint color — currently informational only for img-based SVGs */
  lineColor: {
    type: String,
    default: 'currentColor'
  }
})

const sizeStr = computed(() => {
  return typeof props.width === 'number' ? `${props.width}px` : props.width
})
</script>

<template>
  <!-- aria-hidden: decorative icons should not be announced by screen readers -->
  <img :src="src" class="custom-icon" aria-hidden="true" alt="Icon" />
</template>

<style scoped>
/* Square icon — width and height are both driven by the `sizeStr` computed */
.custom-icon {
  display: inline-block;
  vertical-align: middle;
  /* Aligns icon baseline with surrounding text */
  width: v-bind(sizeStr);
  height: v-bind(sizeStr);
  color: v-bind('props.lineColor');
  object-fit: contain;
  /* Preserves aspect ratio without cropping */
  transition: all 0.2s ease;
}
</style>
