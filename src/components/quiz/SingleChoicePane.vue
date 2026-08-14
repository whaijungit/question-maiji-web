<template>
  <div class="h-full w-full max-w-3xl mx-auto flex flex-col bg-white rounded-2xl border border-slate-200 shadow-sm p-5 md:p-6 overflow-hidden">
    <div class="flex items-center justify-between pb-3 border-b border-slate-100 flex-shrink-0">
      <span class="bg-amber-50 text-amber-700 font-bold px-2.5 py-1 rounded-lg text-xs border border-amber-200">
        题目 #{{ question?.id || (activeQuestionIndex + 1) }}
      </span>
      <span class="bg-amber-50 text-amber-700 font-semibold px-2.5 py-1 rounded-lg text-xs border border-amber-200">
        单选题
      </span>
    </div>

    <div class="flex-1 min-h-0 overflow-y-auto custom-scrollbar py-4 space-y-5">
      <h2 class="text-base md:text-lg font-semibold text-slate-800 leading-relaxed">
        {{ question?.title }}
      </h2>

      <div class="space-y-3">
        <div v-for="(optText, idx) in (question?.options || [])" :key="idx"
          @click="!answerRecord.submitted && emit('select', idx)"
          :class="['group p-3 md:p-3.5 border-2 rounded-xl cursor-pointer transition-all flex items-center space-x-3 text-xs md:text-sm shadow-sm', getChoiceClass(idx)]">
          <span class="w-7 h-7 rounded-lg flex items-center justify-center text-xs flex-shrink-0 font-bold" :class="getChoiceBadgeClass(idx)">
            {{ String.fromCharCode(65 + idx) }}
          </span>
          <span class="flex-1">{{ optText }}</span>
          <AppIcon v-if="getStatusIcon(idx)" :name="getStatusIcon(idx)!.name" :size="14" :class="[getStatusIcon(idx)!.class, 'flex-shrink-0']" />
        </div>
      </div>

      <div v-if="answerRecord.submitted" class="bg-amber-50/80 border border-amber-200 rounded-xl p-4 space-y-1.5">
        <div class="flex items-center space-x-2 text-amber-900 font-bold text-xs">
          <AppIcon name="lightbulb" :size="12" class="text-amber-500" /> 题目解析：
        </div>
        <p class="text-xs md:text-sm text-slate-700 leading-relaxed">{{ question?.explanation || '无详细解析' }}</p>
      </div>
    </div>

    <QuestionNavFooter :submitted="answerRecord.submitted" submit-label="确认提交本题"
      @prev="emit('prev')" @submit="emit('submit')" @next="emit('next')" />
  </div>
</template>

<script setup lang="ts">
import AppIcon from '@/components/AppIcon.vue'
import type { IconName } from '@/components/icons'
import QuestionNavFooter from './QuestionNavFooter.vue'
import type { QuizQuestion, AnswerRecord } from '@/types/quiz'

const props = defineProps<{
  question: QuizQuestion | undefined
  answerRecord: AnswerRecord
  activeQuestionIndex: number
}>()

const emit = defineEmits<{
  (e: 'select', idx: number): void
  (e: 'prev'): void
  (e: 'submit'): void
  (e: 'next'): void
}>()

function getChoiceClass(idx: number) {
  const rec = props.answerRecord
  const q = props.question
  if (rec.submitted) {
    if (idx === q?.answer) return "border-emerald-500 bg-emerald-50 text-emerald-900"
    if (idx === rec.selectedOption) return "border-rose-500 bg-rose-50 text-rose-900"
    return "border-slate-200 bg-white text-slate-400"
  }
  if (idx === rec.selectedOption) {
    return "border-amber-500 bg-amber-50 text-amber-900 ring-2 ring-amber-400/30 shadow-md"
  }
  return "border-slate-300 bg-white text-slate-700 hover:border-amber-400 hover:bg-amber-50/60 hover:shadow-md hover:-translate-y-0.5 active:scale-[0.99]"
}

function getChoiceBadgeClass(idx: number) {
  const rec = props.answerRecord
  const q = props.question
  if (rec.submitted) {
    if (idx === q?.answer) return "bg-emerald-500 text-white"
    if (idx === rec.selectedOption) return "bg-rose-500 text-white"
    return "bg-slate-100 text-slate-400"
  }
  if (idx === rec.selectedOption) return "bg-amber-500 text-white"
  return "bg-slate-200 text-slate-700 group-hover:bg-amber-100 group-hover:text-amber-700"
}

/** 选项右侧状态图标：选中 ✓ / 判对 ✓ / 判错 ✗ */
function getStatusIcon(idx: number): { name: IconName; class: string } | null {
  const rec = props.answerRecord
  if (rec.submitted) {
    if (idx === props.question?.answer) return { name: 'check', class: 'text-emerald-600' }
    if (idx === rec.selectedOption) return { name: 'x', class: 'text-rose-500' }
    return null
  }
  if (idx === rec.selectedOption) return { name: 'check', class: 'text-amber-600' }
  return null
}
</script>
