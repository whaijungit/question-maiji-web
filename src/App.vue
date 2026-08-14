<template>
  <RouterView />
  <!-- 全局消息提示 -->
  <ToastHost />
</template>

<script setup lang="ts">
import ToastHost from '@/components/ToastHost.vue'
</script>
