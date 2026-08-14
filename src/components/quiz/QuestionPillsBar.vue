<template>
  <div class="bg-white border-t border-slate-200 px-4 h-12 flex items-center justify-between gap-3 flex-shrink-0 z-10 shadow-sm">
    <div class="flex items-center space-x-2 flex-shrink-0">
      <AppIcon name="list-checks" :size="12" class="text-amber-600" />
      <span class="text-xs font-bold text-slate-700 truncate max-w-[110px] sm:max-w-[220px]">
        {{ categoryName }}
      </span>
    </div>

    <!-- 分页选择器：固定窗口题号 + 上下翻页（无滚动条） -->
    <div class="flex items-center gap-1.5 flex-shrink-0">
      <button @click="goPrevPage" :disabled="currentPage === 0"
        class="w-7 h-7 md:w-8 md:h-8 rounded-lg text-xs font-bold flex items-center justify-center transition-all flex-shrink-0 bg-slate-100 text-slate-600 hover:bg-slate-200 disabled:opacity-40 disabled:cursor-not-allowed">
        <AppIcon name="chevron-left" :size="12" />
      </button>

      <button v-for="item in pageQuestions" :key="item.idx" @click="emit('go-to', item.idx)"
        :class="['w-7 h-7 md:w-8 md:h-8 rounded-lg text-xs font-semibold flex items-center justify-center transition-all flex-shrink-0', getPillClass(item.idx)]">
        {{ item.idx + 1 }}
      </button>

      <button @click="goNextPage" :disabled="currentPage >= totalPages - 1"
        class="w-7 h-7 md:w-8 md:h-8 rounded-lg text-xs font-bold flex items-center justify-center transition-all flex-shrink-0 bg-slate-100 text-slate-600 hover:bg-slate-200 disabled:opacity-40 disabled:cursor-not-allowed">
        <AppIcon name="chevron-right" :size="12" />
      </button>
    </div>

    <div class="flex items-center space-x-1.5 md:space-x-2 text-xs flex-shrink-0 font-medium">
      <span class="bg-slate-100 text-slate-600 px-2 py-0.5 rounded-lg border border-slate-200 hidden sm:inline-block">
        未做 <b class="text-slate-800">{{ stats.unanswered }}</b>
      </span>
      <span class="bg-emerald-50 text-emerald-700 px-2 py-0.5 rounded-lg border border-emerald-200">
        正确 <b class="text-emerald-700">{{ stats.correct }}</b>
      </span>
      <span @click="emit('open-wrong')" class="bg-rose-50 hover:bg-rose-100 text-rose-700 px-2 py-0.5 rounded-lg border border-rose-200 cursor-pointer transition-all flex items-center gap-1 shadow-sm">
        错误 <b class="text-rose-700">{{ stats.wrong }}</b>
        <AppIcon name="chevron-right" :size="10" class="text-rose-400" />
      </span>
      <span class="text-slate-300 font-normal hidden sm:inline">|</span>
      <span class="text-slate-600">
        进度 <b class="text-amber-600 font-bold">{{ stats.done }}/{{ stats.total }}</b>
      </span>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, onBeforeUnmount, ref } from 'vue'
import AppIcon from '@/components/AppIcon.vue'
import type { QuizQuestion, QuizStats, AnswerRecord } from '@/types/quiz'

const props = defineProps<{
  categoryName: string
  questions: QuizQuestion[]
  activeCategoryIndex: number
  activeQuestionIndex: number
  stats: QuizStats
  /** 各题作答记录（用于 pill 着色） */
  answers: Record<string, AnswerRecord>
}>()

const emit = defineEmits<{
  (e: 'go-to', idx: number): void
  (e: 'open-wrong'): void
}>()

// 响应式分页窗口：移动端每页 5 题，桌面端每页 10 题
const isMobile = ref(window.matchMedia('(max-width: 640px)').matches)
const mediaQuery = window.matchMedia('(max-width: 640px)')
const onMediaChange = (e: MediaQueryListEvent) => { isMobile.value = e.matches }
mediaQuery.addEventListener('change', onMediaChange)
onBeforeUnmount(() => mediaQuery.removeEventListener('change', onMediaChange))

const pageSize = computed(() => (isMobile.value ? 5 : 10))
const totalPages = computed(() => Math.max(1, Math.ceil(props.questions.length / pageSize.value)))
/** 当前页自动跟随当前题目（跳题/切分类/错题跳转均会自动翻页） */
const currentPage = computed(() => Math.min(Math.floor(props.activeQuestionIndex / pageSize.value), totalPages.value - 1))

/** 当前页显示的题号（含全局索引） */
const pageQuestions = computed(() => {
  const start = currentPage.value * pageSize.value
  return props.questions.slice(start, start + pageSize.value).map((_, i) => ({ idx: start + i }))
})

function goPrevPage() {
  if (currentPage.value > 0) emit('go-to', (currentPage.value - 1) * pageSize.value)
}

function goNextPage() {
  if (currentPage.value < totalPages.value - 1) emit('go-to', (currentPage.value + 1) * pageSize.value)
}

// Pill 样式计算
function getPillClass(idx: number) {
  const record = props.answers[`${props.activeCategoryIndex}-${idx}`]
  let bg = "bg-slate-100 text-slate-600 hover:bg-slate-200"
  if (record && record.submitted) {
    bg = record.isCorrect ? "bg-emerald-500 text-white font-bold" : "bg-rose-500 text-white font-bold"
  }
  const ring = idx === props.activeQuestionIndex ? "ring-2 ring-amber-500 ring-offset-1 scale-105 z-10" : ""
  return `${bg} ${ring}`
}
</script>
