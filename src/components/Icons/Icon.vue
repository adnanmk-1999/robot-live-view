<script setup lang="ts">
import { computed } from 'vue'

const props = defineProps({
  src: {
    type: String,
    required: true
  },
  width: {
    type: [Number, String],
    default: 24
  },
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
  <img :src="src" class="custom-icon" aria-hidden="true" alt="Icon" />
</template>

<style scoped>
.custom-icon {
  display: inline-block;
  vertical-align: middle;
  width: v-bind(sizeStr);
  height: v-bind(sizeStr);
  /* Note: img tags cannot natively inherit 'color' into typical flat SVGs without CSS filters or inline injection */
  color: v-bind('props.lineColor');
  object-fit: contain;
  transition: all 0.2s ease;
}
</style>
