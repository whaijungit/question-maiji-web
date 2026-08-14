<template>
  <!-- 错题列表弹窗 -->
  <div v-if="visible" class="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
    <div class="bg-white rounded-2xl border border-slate-200 shadow-2xl w-full max-w-xl p-5 space-y-4 max-h-[85vh] flex flex-col">
      <div class="flex items-center justify-between border-b border-slate-100 pb-3 flex-shrink-0">
        <h3 class="font-bold text-rose-700 text-sm md:text-base"><AppIcon name="circle-x" :size="16" /> 错题汇总列表</h3>
        <button @click="emit('update:visible', false)" class="text-slate-400 hover:text-slate-600"><AppIcon name="x" :size="18" /></button>
      </div>
      <div class="flex-1 min-h-0 flex flex-col space-y-2.5">
        <!-- 错题标题搜索 -->
        <div class="relative flex-shrink-0">
          <input v-model="keyword" type="text" placeholder="搜索错题标题..."
            class="w-full bg-slate-50 border border-slate-200 rounded-lg text-base px-3 py-2 pr-8 outline-none focus:border-amber-400 focus:ring-2 focus:ring-amber-400/20 transition-all" />
          <AppIcon name="search" :size="14" class="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
        </div>

        <div class="flex-1 min-h-0 overflow-y-auto custom-scrollbar space-y-2.5">
          <div v-if="filteredItems.length === 0" class="text-center py-8 text-slate-400">
            <AppIcon :name="keyword.trim() ? 'search' : 'circle-check'" :size="30" :class="keyword.trim() ? 'text-slate-300 mb-2' : 'text-emerald-500 mb-2'" />
            <p class="text-xs font-medium text-slate-600">
              {{ keyword.trim() ? `没有找到包含「${keyword.trim()}」的错题` : '目前暂无错题，继续加油！🎉' }}
            </p>
          </div>
          <div v-for="(item, idx) in filteredItems" :key="idx" @click="emit('jump', item.catIdx, item.qIdx)"
          class="p-3 bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded-xl flex items-center justify-between gap-3 cursor-pointer group">
          <div>
            <div class="flex items-center space-x-2 mb-1">
              <span class="text-[10px] font-bold px-1.5 py-0.5 rounded bg-slate-200 text-slate-700">{{ item.categoryName }}</span>
              <span class="text-[10px] font-bold text-slate-400">#{{ item.question.id || (item.qIdx + 1) }}</span>
            </div>
            <p class="text-xs font-medium text-slate-800 group-hover:text-amber-600">{{ item.question.title }}</p>
          </div>
          <AppIcon name="chevron-right" :size="12" class="text-slate-400 group-hover:translate-x-0.5" />
        </div>
        </div>
      </div>
      <div class="flex justify-end pt-2 border-t border-slate-100 flex-shrink-0">
        <button @click="emit('update:visible', false)" class="px-4 py-2 bg-slate-100 text-slate-700 rounded-xl text-xs">关闭</button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch } from 'vue'
import AppIcon from '@/components/AppIcon.vue'
import type { WrongQuestionItem } from '@/types/quiz'

const props = defineProps<{
  visible: boolean
  items: WrongQuestionItem[]
}>()

const emit = defineEmits<{
  (e: 'update:visible', visible: boolean): void
  (e: 'jump', catIdx: number, qIdx: number): void
}>()

// 错题标题搜索
const keyword = ref('')
const filteredItems = computed(() => {
  const kw = keyword.value.trim().toLowerCase()
  if (!kw) return props.items
  return props.items.filter((item) => (item.question.title || '').toLowerCase().includes(kw))
})

// 关闭弹窗时清空搜索词
watch(() => props.visible, (visible) => {
  if (!visible) keyword.value = ''
})
</script>
