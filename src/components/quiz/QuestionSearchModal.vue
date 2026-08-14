<template>
  <!-- 题目标题搜索弹窗 -->
  <div v-if="visible" class="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
    <div class="bg-white rounded-2xl border border-slate-200 shadow-2xl w-full max-w-xl p-5 space-y-4 max-h-[85vh] flex flex-col">
      <div class="flex items-center justify-between border-b border-slate-100 pb-3 flex-shrink-0">
        <h3 class="font-bold text-amber-700 text-sm md:text-base flex items-center gap-1.5">
          <AppIcon name="search" :size="16" /> 题目标题搜索
        </h3>
        <button @click="emit('update:visible', false)" class="text-slate-400 hover:text-slate-600"><AppIcon name="x" :size="18" /></button>
      </div>

      <div class="relative flex-shrink-0">
        <input ref="searchInputRef" v-model="keyword" type="text" placeholder="输入题目标题关键字搜索..."
          @keyup.enter="jumpToFirst"
          class="w-full bg-slate-50 border border-slate-200 rounded-lg text-base px-3 py-2.5 pr-9 outline-none focus:border-amber-400 focus:ring-2 focus:ring-amber-400/20 transition-all" />
        <AppIcon name="search" :size="15" class="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
      </div>

      <div class="flex-1 min-h-0 overflow-y-auto custom-scrollbar space-y-2">
        <div v-if="keyword.trim() && results.length === 0" class="text-center py-10 text-slate-400">
          <AppIcon name="search" :size="30" class="text-slate-300 mb-2" />
          <p class="text-xs font-medium text-slate-600">未找到包含「{{ keyword.trim() }}」的题目</p>
        </div>
        <div v-else-if="!keyword.trim()" class="text-center py-10 text-slate-400">
          <AppIcon name="lightbulb" :size="30" class="text-slate-300 mb-2" />
          <p class="text-xs font-medium text-slate-600">输入关键字搜索全部题目（如：海龟、循环、变量）</p>
        </div>
        <button v-for="r in results" :key="`${r.catIdx}-${r.qIdx}`" @click="pick(r)"
          class="w-full text-left p-3 bg-slate-50 hover:bg-amber-50/80 border border-slate-200 hover:border-amber-300 rounded-xl transition-all flex items-center justify-between gap-3 group">
          <div>
            <div class="flex items-center gap-1.5 mb-1">
              <span class="text-[10px] font-bold px-1.5 py-0.5 rounded bg-amber-100 text-amber-700 max-w-[60%] truncate">{{ r.categoryName }}</span>
              <span class="text-[10px] font-bold text-slate-400">#{{ r.id }}</span>
            </div>
            <p class="text-xs font-medium text-slate-800 group-hover:text-amber-700">{{ r.title }}</p>
          </div>
          <AppIcon name="chevron-right" :size="12" class="text-slate-400 flex-shrink-0 group-hover:translate-x-0.5" />
        </button>
      </div>

      <div class="flex justify-end pt-2 border-t border-slate-100 flex-shrink-0">
        <button @click="emit('update:visible', false)" class="px-4 py-2 bg-slate-100 text-slate-700 rounded-xl text-xs">关闭</button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch, nextTick } from 'vue'
import AppIcon from '@/components/AppIcon.vue'
import type { QuizCategory } from '@/types/quiz'

const props = defineProps<{
  visible: boolean
  categories: QuizCategory[]
}>()

const emit = defineEmits<{
  (e: 'update:visible', visible: boolean): void
  (e: 'jump', catIdx: number, qIdx: number): void
}>()

interface SearchResult {
  catIdx: number
  qIdx: number
  categoryName: string
  title: string
  id: number | string
}

const keyword = ref('')
const searchInputRef = ref<HTMLInputElement | null>(null)

const results = computed<SearchResult[]>(() => {
  const kw = keyword.value.trim().toLowerCase()
  if (!kw) return []
  const list: SearchResult[] = []
  props.categories.forEach((cat, catIdx) => {
    (cat.questions ?? []).forEach((q, qIdx) => {
      const title = q.title || ''
      if (title.toLowerCase().includes(kw)) {
        list.push({ catIdx, qIdx, categoryName: cat.category || '', title, id: q.id ?? qIdx + 1 })
      }
    })
  })
  return list.slice(0, 50)
})

function pick(r: SearchResult) {
  emit('update:visible', false)
  emit('jump', r.catIdx, r.qIdx)
}

function jumpToFirst() {
  if (results.value.length > 0) pick(results.value[0]!)
}

// 打开时自动聚焦输入框；关闭时清空搜索词
watch(() => props.visible, (visible) => {
  if (visible) {
    nextTick(() => searchInputRef.value?.focus())
  } else {
    keyword.value = ''
  }
})
</script>
