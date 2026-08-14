<template>
  <svg
    :width="size"
    :height="size"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    stroke-width="2"
    stroke-linecap="round"
    stroke-linejoin="round"
    xmlns="http://www.w3.org/2000/svg"
    aria-hidden="true"
    v-html="ICONS[name]"
  ></svg>
</template>

<script setup lang="ts">
import { ICONS, type IconName } from './icons'

withDefaults(defineProps<{
  name: IconName
  /** 图标边长（px），对应旧 fa 图标的字号 */
  size?: number
}>(), { size: 16 })
</script>
