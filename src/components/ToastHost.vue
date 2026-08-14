<template>
  <Teleport to="body">
    <div class="fixed top-4 left-1/2 -translate-x-1/2 z-[100] flex flex-col items-center gap-2 pointer-events-none">
      <TransitionGroup name="toast">
        <div v-for="t in toasts" :key="t.id"
          :class="['pointer-events-auto px-4 py-2.5 rounded-xl shadow-lg border text-xs md:text-sm font-medium flex items-center gap-2 bg-white', styleMap[t.type].border]">
          <AppIcon :name="styleMap[t.type].icon" :size="14" :class="styleMap[t.type].iconClass" />
          <span class="text-slate-700">{{ t.message }}</span>
        </div>
      </TransitionGroup>
    </div>
  </Teleport>
</template>

<script setup lang="ts">
import AppIcon from './AppIcon.vue'
import type { IconName } from './icons'
import { useToast, type ToastType } from '@/composables/useToast'

const { toasts } = useToast()

const styleMap: Record<ToastType, { border: string; icon: IconName; iconClass: string }> = {
  success: { border: 'border-emerald-200', icon: 'circle-check', iconClass: 'text-emerald-500' },
  error: { border: 'border-rose-200', icon: 'circle-x', iconClass: 'text-rose-500' },
  info: { border: 'border-sky-200', icon: 'lightbulb', iconClass: 'text-sky-500' },
  warning: { border: 'border-amber-300', icon: 'lightbulb', iconClass: 'text-amber-500' }
}
</script>

<style scoped>
.toast-enter-active,
.toast-leave-active {
  transition: all 0.25s ease;
}
.toast-enter-from {
  opacity: 0;
  transform: translateY(-8px);
}
.toast-leave-to {
  opacity: 0;
}
</style>
