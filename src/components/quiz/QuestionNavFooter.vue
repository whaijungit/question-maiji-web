<template>
  <div class="pt-4 border-t border-slate-100 flex items-center justify-between gap-3 flex-shrink-0">
    <button @click="emit('prev')" class="px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl font-semibold text-xs md:text-sm flex items-center gap-1.5">
      <AppIcon name="chevron-left" :size="14" /> 上一题
    </button>
    <button :disabled="submitted" @click="emit('submit')"
      class="px-6 py-2.5 bg-amber-500 hover:bg-amber-600 disabled:bg-slate-300 disabled:text-slate-600 text-white rounded-xl font-bold text-xs md:text-sm shadow-md transition-all flex items-center gap-2">
      <AppIcon name="send" :size="14" /> {{ submitLabel }}
    </button>
    <button @click="emit('next')" class="px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl font-semibold text-xs md:text-sm flex items-center gap-1.5">
      下一题 <AppIcon name="chevron-right" :size="14" />
    </button>
  </div>
</template>

<script setup lang="ts">
import AppIcon from '@/components/AppIcon.vue'

defineProps<{
  submitted: boolean
  submitLabel: string
}>()

const emit = defineEmits<{
  (e: 'prev'): void
  (e: 'submit'): void
  (e: 'next'): void
}>()
</script>
